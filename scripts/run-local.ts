import { existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { execa } from "execa";

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

/** Runs a program without a shell, so no argument is ever interpreted by one. */
async function runStep(description: string, command: string, args: Array<string>): Promise<void> {
    console.info(`\n> ${description}`);
    await execa(command, args, { stdio: "inherit" });
}

/** `docker info` exits non-zero exactly when the daemon is not reachable (or Docker is missing). */
async function isDockerRunning(): Promise<boolean> {
    const result = await execa("docker", ["info"], { stdio: "ignore", reject: false });

    return result.exitCode === 0;
}

async function startDockerDesktop(): Promise<void> {
    if (process.platform !== "win32" || existsSync(DOCKER_DESKTOP_PATH) === false) {
        throw new RunLocalError("Docker is not running. Start it and run `bun run local` again.");
    }

    console.info("\n> Starting Docker Desktop");
    // `start` returns at once and leaves Docker Desktop running on its own.
    await execa("cmd.exe", ["/c", "start", "", DOCKER_DESKTOP_PATH], { stdio: "ignore" });
}

async function waitForDocker(): Promise<void> {
    for (let attempt = 0; attempt < DOCKER_WAIT_ATTEMPTS; attempt += 1) {
        if ((await isDockerRunning()) === true) {
            return;
        }

        await sleep(DOCKER_WAIT_MILLISECONDS);
    }

    throw new RunLocalError("Docker Desktop did not start within 3 minutes.");
}

async function ensureDocker(): Promise<void> {
    if ((await isDockerRunning()) === true) {
        return;
    }

    await startDockerDesktop();
    await waitForDocker();
}

await ensureDocker();
await runStep("Starting PostgreSQL and Whisper", "docker", [
    "compose",
    "up",
    "-d",
    "--wait",
    "postgres",
    "whisper",
]);
await runStep("Applying database migrations", "bunx", ["drizzle-kit", "migrate"]);
// Docker's layer cache makes this quick when the worker code has not changed.
await runStep("Building and starting the worker", "docker", [
    "compose",
    "up",
    "-d",
    "--build",
    "worker",
]);
await runStep("Starting the dev server", "bun", ["run", "dev"]);
