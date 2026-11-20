import { ExecaError, execa } from "execa";

const STDERR_IN_MESSAGE_LENGTH = 500;

export class CommandFailedError extends Error {
    readonly stderr: string;

    constructor(command: string, exitCode: number | null, stderr: string, options?: ErrorOptions) {
        super(
            `${command} exited with code ${String(exitCode)}: ${stderr.slice(-STDERR_IN_MESSAGE_LENGTH)}`,
            options,
        );
        this.name = "CommandFailedError";
        this.stderr = stderr;
    }
}

export class EmptyCommandError extends Error {
    constructor() {
        super("Cannot run an empty command");
        this.name = "EmptyCommandError";
    }
}

interface CommandOptions {
    workingDirectory?: string;
    /** Aborting kills the process; the promise then rejects with the abort reason. */
    signal?: AbortSignal;
    /** Called for every output line (stdout and stderr interleaved), e.g. to read progress. */
    onOutputLine?: (line: string) => void;
}

function toCommandError(command: string, error: unknown): unknown {
    if (error instanceof ExecaError === false) {
        return error;
    }

    let stderr = "";

    if (typeof error.stderr === "string") {
        stderr = error.stderr;
    }

    return new CommandFailedError(command, error.exitCode ?? null, stderr, { cause: error });
}

/**
 * Runs a program without a shell (arguments are never interpolated) and returns its stdout.
 * execa handles line splitting, cancellation and killing the process tree.
 */
export async function runCommand(
    command: string,
    args: ReadonlyArray<string>,
    options: CommandOptions = {},
): Promise<string> {
    if (command.trim().length === 0) {
        throw new EmptyCommandError();
    }

    const subprocess = execa(command, args, {
        cwd: options.workingDirectory,
        cancelSignal: options.signal,
        all: true,
    });
    const onOutputLine = options.onOutputLine;

    try {
        if (onOutputLine !== undefined) {
            for await (const line of subprocess.iterable({ from: "all" })) {
                onOutputLine(line);
            }
        }

        const result = await subprocess;
        return result.stdout;
    } catch (error) {
        const signal = options.signal;

        // Cancelling is not a failure of the command: callers check for the abort reason.
        if (signal !== undefined && signal.aborted === true) {
            throw signal.reason;
        }

        throw toCommandError(command, error);
    }
}
