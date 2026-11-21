import OpenAI, { APIError, APIUserAbortError, AuthenticationError } from "openai";
import { z } from "zod";
import { getEnvironment } from "#/shared/server/env.server";
import { HTTP_PAYMENT_REQUIRED } from "#/shared/server/http-response";
import { UserFacingError } from "#/shared/server/user-facing-error";

// DeepSeek speaks the OpenAI chat API, so the official SDK brings retries, timeouts and typed errors.
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const REQUEST_TIMEOUT_MILLISECONDS = 180_000;
const MAX_RETRIES = 2;
const TEMPERATURE = 0.3;

// The SDK types the answer but does not check it at runtime.
const chatResponseSchema = z.object({
    choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
});

export interface ChatPrompt {
    system: string;
    user: string;
}

function readApiKey(): string {
    const environment = getEnvironment();
    const apiKey = environment.DEEPSEEK_API_KEY.trim();

    if (apiKey.length === 0) {
        throw new UserFacingError(
            "Falta a chave da DeepSeek. Preencha DEEPSEEK_API_KEY no arquivo .env e rode npm run worker:restart.",
        );
    }

    return apiKey;
}

function createDeepSeekClient(): OpenAI {
    return new OpenAI({
        apiKey: readApiKey(),
        baseURL: DEEPSEEK_BASE_URL,
        timeout: REQUEST_TIMEOUT_MILLISECONDS,
        maxRetries: MAX_RETRIES,
    });
}

/** Turns SDK errors into messages the user can act on; cancellation passes through untouched. */
function toUserFacingError(error: unknown): unknown {
    if (error instanceof APIUserAbortError || error instanceof APIError === false) {
        return error;
    }

    if (error instanceof AuthenticationError) {
        return new UserFacingError(
            "A chave da DeepSeek é inválida. Confira DEEPSEEK_API_KEY no .env.",
            {
                cause: error,
            },
        );
    }

    if (error.status === HTTP_PAYMENT_REQUIRED) {
        return new UserFacingError("Sua conta da DeepSeek está sem saldo.", { cause: error });
    }

    return new UserFacingError("A DeepSeek não respondeu. Tente novamente em alguns minutos.", {
        cause: error,
    });
}

function parseJsonContent(content: string | null): unknown {
    if (content === null || content.trim().length === 0) {
        throw new UserFacingError("A DeepSeek devolveu uma resposta vazia. Tente novamente.");
    }

    try {
        const parsed: unknown = JSON.parse(content);
        return parsed;
    } catch (error) {
        throw new UserFacingError("A DeepSeek devolveu uma resposta inválida. Tente novamente.", {
            cause: error,
        });
    }
}

async function createCompletion(
    prompt: ChatPrompt,
    signal: AbortSignal,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const environment = getEnvironment();
    const client = createDeepSeekClient();

    try {
        return await client.chat.completions.create(
            {
                model: environment.DEEPSEEK_MODEL,
                temperature: TEMPERATURE,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: prompt.system },
                    { role: "user", content: prompt.user },
                ],
            },
            { signal },
        );
    } catch (error) {
        throw toUserFacingError(error);
    }
}

/** Asks DeepSeek for a JSON answer and returns it decoded, for the caller to validate with Zod. */
export async function requestJsonCompletion(
    prompt: ChatPrompt,
    signal: AbortSignal,
): Promise<unknown> {
    const completion = await createCompletion(prompt, signal);
    const result = chatResponseSchema.safeParse(completion);

    if (result.success === false) {
        throw new UserFacingError("A DeepSeek devolveu uma resposta inesperada. Tente novamente.");
    }

    const firstChoice = result.data.choices[0];

    if (firstChoice === undefined) {
        throw new UserFacingError("A DeepSeek não devolveu nenhuma resposta. Tente novamente.");
    }

    return parseJsonContent(firstChoice.message.content);
}
