import { config } from "dotenv";
import { z } from "zod";

// Docker passes variables directly; locally they come from the .env file.
config({ path: ".env", quiet: true });

const environmentSchema = z.object({
    DATABASE_URL: z.string().min(1),
    STORAGE_DIR: z.string().min(1),
    BETTER_AUTH_URL: z.url().optional(),
    BETTER_AUTH_SECRET: z.string().optional(),
    WHISPER_URL: z.url(),
    WHISPER_MODEL: z.string().min(1),
    WHISPER_LANGUAGE: z.string().default(""),
    DEEPSEEK_API_KEY: z.string().default(""),
    DEEPSEEK_MODEL: z.string().min(1).default("deepseek-chat"),
    // Soft limit per user: the usage screen warns as it fills, nothing is blocked.
    STORAGE_QUOTA_GIGABYTES: z.coerce.number().positive().default(20),
});

export type Environment = z.infer<typeof environmentSchema>;

export class InvalidEnvironmentError extends Error {
    constructor(variableNames: Array<string>) {
        super(
            `Invalid or missing environment variables: ${variableNames.join(", ")}. Run "npm run setup".`,
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
