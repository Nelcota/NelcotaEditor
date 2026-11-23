import OpenAI, { APIError, APIUserAbortError } from "openai";
import { z } from "zod";
import { getEnvironment } from "#/shared/server/env.server";
import { HTTP_PAYMENT_REQUIRED, HTTP_UNAUTHORIZED } from "#/shared/server/http-response";
import { UserFacingError } from "#/shared/server/user-facing-error";

// DeepSeek speaks the OpenAI chat API, so the official SDK brings retries, timeouts and typed errors.
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const REQUEST_TIMEOUT_MILLISECONDS = 180_000;
const MAX_RETRIES = 2;
const TEMPERATURE = 0.3;

// The customer cannot fix a missing key, an invalid key or an account without credit, and must
// not see the provider, the variable or the balance: those details go to the server log only.
const UNAVAILABLE_MESSAGE =
    "A IA que escolhe os cortes está fora do ar agora. Tente de novo mais tarde.";
const NO_ANSWER_MESSAGE =
    "A IA que escolhe os cortes não respondeu. Tente de novo em alguns minutos.";
export const BROKEN_ANSWER_MESSAGE =
    "A IA que escolhe os cortes deu uma resposta com defeito. Tente de novo.";

// The SDK types the answer but does not check it at runtime.
const chatResponseSchema = z.object({
    choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
});

export interface ChatPrompt {
    system: string;
    user: string;
}

class DeepSeekConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DeepSeekConfigurationError";
    }
}

function readApiKey(): string {
    const environment = getEnvironment();
    const apiKey = environment.DEEPSEEK_API_KEY.trim();

    if (apiKey.length === 0) {
        const cause = new DeepSeekConfigurationError(
            "DEEPSEEK_API_KEY is empty; set it in .env and restart the worker",
        );
        throw new UserFacingError(UNAVAILABLE_MESSAGE, { cause });
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

/** Turns SDK errors into messages the customer can act on; cancellation passes through untouched. */
export function toUserFacingError(error: unknown): unknown {
    if (error instanceof APIUserAbortError || error instanceof APIError === false) {
        return error;
    }

    if (error.status === HTTP_UNAUTHORIZED || error.status === HTTP_PAYMENT_REQUIRED) {
        return new UserFacingError(UNAVAILABLE_MESSAGE, { cause: error });
    }

    return new UserFacingError(NO_ANSWER_MESSAGE, { cause: error });
}

function parseJsonContent(content: string | null): unknown {
    if (content === null || content.trim().length === 0) {
        throw new UserFacingError(BROKEN_ANSWER_MESSAGE, {
            cause: new Error("DeepSeek answered with empty content"),
        });
    }

    try {
        const parsed: unknown = JSON.parse(content);
        return parsed;
    } catch (error) {
        throw new UserFacingError(BROKEN_ANSWER_MESSAGE, { cause: error });
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
        throw new UserFacingError(BROKEN_ANSWER_MESSAGE, { cause: result.error });
    }

    const firstChoice = result.data.choices[0];

    if (firstChoice === undefined) {
        throw new UserFacingError(BROKEN_ANSWER_MESSAGE, {
            cause: new Error("DeepSeek answered with no choices"),
        });
    }

    return parseJsonContent(firstChoice.message.content);
}
