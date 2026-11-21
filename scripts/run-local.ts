import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

// Everything "run it locally" needs, in order: Docker up, services up, schema current, worker
// rebuilt from the current code, then the dev server. Each step is safe to run again.
const DOCKER_DESKTOP_PATH = "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe";
const DOCKER_WAIT_ATTEMPTS = 60;
const DOCKER_WAIT_MILLISECONDS = 3000;

class RunLocalError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RunLocalError";
    }
}

function runStep(description: string, command: string): void {
    console.info(`\n> ${description}`);
    execSync(command, { stdio: "inherit" });
}

function isDockerRunning(): boolean {
    try {
        execSync("docker info", { stdio: "ignore" });
        return true;
    } catch {
        // `docker info` exits non-zero exactly when the daemon is not reachable.
        return false;
    }
}

function startDockerDesktop(): void {
    if (process.platform !== "win32" || existsSync(DOCKER_DESKTOP_PATH) === false) {
        throw new RunLocalError("Docker is not running. Start it and run `npm run local` again.");
    }

    console.info("\n> Starting Docker Desktop");
    execSync(`start "" "${DOCKER_DESKTOP_PATH}"`, { stdio: "ignore", shell: "cmd.exe" });
}

async function waitForDocker(): Promise<void> {
    for (let attempt = 0; attempt < DOCKER_WAIT_ATTEMPTS; attempt += 1) {
        if (isDockerRunning() === true) {
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, DOCKER_WAIT_MILLISECONDS));
    }

    throw new RunLocalError("Docker Desktop did not start within 3 minutes.");
}

async function ensureDocker(): Promise<void> {
    if (isDockerRunning() === true) {
        return;
    }

    startDockerDesktop();
    await waitForDocker();
}

await ensureDocker();
runStep("Starting PostgreSQL and Whisper", "docker compose up -d --wait postgres whisper");
runStep("Applying database migrations", "npx drizzle-kit migrate");
// Docker's layer cache makes this quick when the worker code has not changed.
runStep("Building and starting the worker", "docker compose up -d --build worker");
runStep("Starting the dev server", "npx vite dev");
