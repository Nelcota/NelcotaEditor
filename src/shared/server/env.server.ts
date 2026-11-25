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
const STORAGE_DRIVERS = ["disk", "r2"] as const;
// The account id goes into the endpoint host, so it must be exactly what Cloudflare issues.
const R2_ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/;
const R2_VARIABLE_NAMES = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
] as const;

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
    // The worker's scratch space (downloads, audio chunks, renders before they are stored).
    // Replicas may share it: a worker start removes only workspaces no worker is processing.
    WORK_DIR: optionalTextSchema.transform(
        (workDirectory) => workDirectory ?? DEFAULT_WORK_DIRECTORY,
    ),
    // "disk" keeps files under STORAGE_DIR; "r2" keeps them in a Cloudflare R2 bucket.
    STORAGE_DRIVER: z.enum(STORAGE_DRIVERS).default("disk"),
    R2_ACCOUNT_ID: optionalTextSchema.pipe(z.string().regex(R2_ACCOUNT_ID_PATTERN).optional()),
    R2_ACCESS_KEY_ID: optionalTextSchema,
    R2_SECRET_ACCESS_KEY: optionalTextSchema,
    R2_BUCKET: optionalTextSchema,
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
    // Both unset (development and tests only): sign-up and sign-in skip the Turnstile check.
    TURNSTILE_SITE_KEY: optionalTextSchema,
    TURNSTILE_SECRET_KEY: optionalTextSchema,
    WHISPER_URL: z.url(),
    WHISPER_MODEL: z.string().min(1),
    WHISPER_LANGUAGE: z.string().default(""),
    DEEPSEEK_API_KEY: z.string().default(""),
    DEEPSEEK_MODEL: z.string().min(1).default("deepseek-chat"),
    // Unset: auth emails fail and stay queued for retries, so sign-up cannot finish. Only the
    // worker sends email; the web server queues it.
    RESEND_API_KEY: optionalTextSchema,
    EMAIL_FROM: z.string().trim().min(1).default("Nelcota <nao-responda@tela.nelcota.com>"),
    // Soft limit per user: the usage screen warns as it fills, nothing is blocked.
    STORAGE_QUOTA_GIGABYTES: z.coerce.number().positive().default(20),
    // Videos one worker processes at once (each from a different person). Size it by the CPU and
    // the Whisper workers: every video runs ffmpeg and Whisper of its own.
    WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
    // A Netscape cookies.txt of a dedicated YouTube account, in base64. YouTube asks datacenter
    // addresses to sign in, so production downloads fail without it. Unset: no cookies are sent.
    YOUTUBE_COOKIES_BASE64: optionalTextSchema.pipe(z.base64().optional()),
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

const TURNSTILE_VARIABLE_NAMES = ["TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"] as const;

/**
 * One key without the other would either break sign-up or skip the check silently. Production
 * requires both only where the captcha is built (buildCaptchaPlugins), since the worker parses
 * this schema too and never holds the keys.
 */
function checkTurnstileKeys(environment: BaseEnvironment, context: z.RefinementCtx): void {
    const siteKey = environment.TURNSTILE_SITE_KEY;
    const secretKey = environment.TURNSTILE_SECRET_KEY;

    if ((siteKey === undefined) === (secretKey === undefined)) {
        return;
    }

    for (const variableName of TURNSTILE_VARIABLE_NAMES) {
        context.addIssue({
            code: "custom",
            path: [variableName],
            message: "Set both Turnstile keys or neither",
        });
    }
}

/** The R2 driver cannot start without every value it signs requests with. */
function checkR2Settings(environment: BaseEnvironment, context: z.RefinementCtx): void {
    if (environment.STORAGE_DRIVER !== "r2") {
        return;
    }

    for (const variableName of R2_VARIABLE_NAMES) {
        if (environment[variableName] === undefined) {
            context.addIssue({
                code: "custom",
                path: [variableName],
                message: "Required when STORAGE_DRIVER is r2",
            });
        }
    }
}

const environmentSchema = baseEnvironmentSchema.superRefine((environment, context) => {
    checkAuthUrl(environment, context);
    checkTurnstileKeys(environment, context);
    checkR2Settings(environment, context);
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

export function parseEnvironment(variables: Record<string, string | undefined>): Environment {
    const result = environmentSchema.safeParse(variables);

    if (result.success === false) {
        const variableNames = result.error.issues.map((issue) => issue.path.join("."));
        throw new InvalidEnvironmentError(variableNames);
    }

    return result.data;
}

export function getEnvironment(): Environment {
    if (cachedEnvironment !== null) {
        return cachedEnvironment;
    }

    cachedEnvironment = parseEnvironment(process.env);
    return cachedEnvironment;
}
