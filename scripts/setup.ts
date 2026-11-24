import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execa } from "execa";

const ENV_FILE = ".env";
const ENV_EXAMPLE_FILE = ".env.example";
const STORAGE_DIRECTORY = "storage";
const SECRET_BYTES = 32;
const APP_URL = "http://localhost:3210";
const EMPTY_SECRET_LINE = 'BETTER_AUTH_SECRET=""';
const DEEPSEEK_KEY_PATTERN = /^DEEPSEEK_API_KEY="?([^"\n]*)"?/m;

class SetupError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SetupError";
    }
}

/** Runs a program without a shell, so no argument is ever interpreted by one. */
async function runStep(description: string, command: string, args: Array<string>): Promise<void> {
    console.info(`\n> ${description}`);
    await execa(command, args, { stdio: "inherit" });
}

function createEnvFile(): void {
    if (existsSync(ENV_FILE) === true) {
        console.info(".env already exists, keeping it.");
        return;
    }

    if (existsSync(ENV_EXAMPLE_FILE) === false) {
        throw new SetupError(`${ENV_EXAMPLE_FILE} is missing; it is the template for ${ENV_FILE}.`);
    }

    const template = readFileSync(ENV_EXAMPLE_FILE, "utf8");

    // Without this line the app would start with no auth secret, so stop instead of writing it.
    if (template.includes(EMPTY_SECRET_LINE) === false) {
        throw new SetupError(`${ENV_EXAMPLE_FILE} has no ${EMPTY_SECRET_LINE} line to fill.`);
    }

    const secret = randomBytes(SECRET_BYTES).toString("base64url");
    const content = template.replace(EMPTY_SECRET_LINE, `BETTER_AUTH_SECRET="${secret}"`);
    writeFileSync(ENV_FILE, content);
    console.info("Created .env with a fresh BETTER_AUTH_SECRET.");
}

function hasDeepSeekKey(): boolean {
    const content = readFileSync(ENV_FILE, "utf8");
    const match = DEEPSEEK_KEY_PATTERN.exec(content);

    if (match === null) {
        return false;
    }

    const key = match[1];

    if (key === undefined) {
        return false;
    }

    return key.trim().length > 0;
}

function printNextSteps(): void {
    console.info("\nTudo pronto!");

    if (hasDeepSeekKey() === false) {
        console.info(
            "\n!! Falta a chave da DeepSeek: abra o arquivo .env e preencha DEEPSEEK_API_KEY.",
        );
        console.info("   Depois rode: npm run worker:restart");
    }

    console.info(`\nAgora rode \`npm run local\` e abra ${APP_URL}`);
}

createEnvFile();
mkdirSync(STORAGE_DIRECTORY, { recursive: true });
await runStep("Enabling the git hooks in .githooks", "git", [
    "config",
    "core.hooksPath",
    ".githooks",
]);
await runStep("Starting PostgreSQL and Whisper", "docker", [
    "compose",
    "up",
    "-d",
    "--wait",
    "postgres",
    "whisper",
]);
await runStep("Applying database migrations", "npx", ["drizzle-kit", "migrate"]);
await runStep("Building and starting the worker", "docker", [
    "compose",
    "up",
    "-d",
    "--build",
    "worker",
]);
printNextSteps();
