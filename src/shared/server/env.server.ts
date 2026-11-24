import os from "node:os";
import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

// Docker passes variables directly; locally they come from the .env file.
config({ path: ".env", quiet: true });

const PRODUCTION = "production";
const SECURE_PROTOCOL = "https:";
const HEADER_NAME_PATTERN = /^[a-z0-9-]+$/;
const DEFAULT_WORK_DIRECTORY = path.join(os.tmpdir(), "nelcota-work");

function toUndefinedWhenEmpty(value: string | undefined): string | undefined {
    if (value === undefined || value.length === 0) {
        return undefined;
    }

    return value;
}

/** `.env` files leave unused keys as "", which means "not configured". */
const optionalTextSchema = z.string().trim().optional().transform(toUndefinedWhenEmpty);

const baseEnvironmentSchema = z.object({
    NODE_ENV: z.string().optional(),
    DATABASE_URL: z.string().min(1),
    STORAGE_DIR: z.string().min(1),
    // The worker's scratch space (downloads, audio chunks, renders before they are stored). Each
    // worker needs its own: it is wiped when the worker starts.
    WORK_DIR: optionalTextSchema.transform(
        (workDirectory) => workDirectory ?? DEFAULT_WORK_DIRECTORY,
    ),
    BETTER_AUTH_URL: z.url().optional(),
    BETTER_AUTH_SECRET: z.string().optional(),
    /**
     * Header the reverse proxy sets to the client's address (for example "cf-connecting-ip" or
     * "x-real-ip"). Unset: the app is reached directly and the socket address is used, because any
     * forwarded header would come from the client itself.
     */
    TRUSTED_PROXY_IP_HEADER: optionalTextSchema.pipe(
        z.string().toLowerCase().regex(HEADER_NAME_PATTERN).optional(),
    ),
    // Both unset: sign-up and sign-in work without the Cloudflare Turnstile check.
    TURNSTILE_SITE_KEY: optionalTextSchema,
    TURNSTILE_SECRET_KEY: optionalTextSchema,
    WHISPER_URL: z.url(),
    WHISPER_MODEL: z.string().min(1),
    WHISPER_LANGUAGE: z.string().default(""),
    DEEPSEEK_API_KEY: z.string().default(""),
    DEEPSEEK_MODEL: z.string().min(1).default("deepseek-chat"),
    // Soft limit per user: the usage screen warns as it fills, nothing is blocked.
    STORAGE_QUOTA_GIGABYTES: z.coerce.number().positive().default(20),
    // Videos one worker processes at once (each from a different person). Size it by the CPU and
    // the Whisper workers: every video runs ffmpeg and Whisper of its own.
    WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
});

type BaseEnvironment = z.infer<typeof baseEnvironmentSchema>;

/** Cookies and redirects are built from this URL, so production must name its real https origin. */
function checkAuthUrl(environment: BaseEnvironment, context: z.RefinementCtx): void {
    const authUrl = environment.BETTER_AUTH_URL;

    if (environment.NODE_ENV !== PRODUCTION) {
        return;
    }

    if (authUrl === undefined || new URL(authUrl).protocol !== SECURE_PROTOCOL) {
        context.addIssue({
            code: "custom",
            path: ["BETTER_AUTH_URL"],
            message: "Must be an https URL in production",
        });
    }
}

/** One key without the other would either break sign-up or skip the check silently. */
function checkTurnstileKeys(environment: BaseEnvironment, context: z.RefinementCtx): void {
    const siteKey = environment.TURNSTILE_SITE_KEY;
    const secretKey = environment.TURNSTILE_SECRET_KEY;

    if ((siteKey === undefined) === (secretKey === undefined)) {
        return;
    }

    for (const variableName of ["TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"]) {
        context.addIssue({
            code: "custom",
            path: [variableName],
            message: "Set both Turnstile keys or neither",
        });
    }
}

const environmentSchema = baseEnvironmentSchema.superRefine((environment, context) => {
    checkAuthUrl(environment, context);
    checkTurnstileKeys(environment, context);
});

export type Environment = z.infer<typeof environmentSchema>;

export class InvalidEnvironmentError extends Error {
    constructor(variableNames: Array<string>) {
        super(
            `Invalid or missing environment variables: ${variableNames.join(", ")}. Run "bun run setup".`,
        );
        this.name = "InvalidEnvironmentError";
    }
}

let cachedEnvironment: Environment | null = null;

export function getEnvironment(): Environment {
    if (cachedEnvironment !== null) {
        return cachedEnvironment;
    }

    const result = environmentSchema.safeParse(process.env);

    if (result.success === false) {
        const variableNames = result.error.issues.map((issue) => issue.path.join("."));
        throw new InvalidEnvironmentError(variableNames);
    }

    cachedEnvironment = result.data;
    return cachedEnvironment;
}
