import { ExecaError, execa } from "execa";

const STDERR_IN_MESSAGE_LENGTH = 500;
const URL_PATTERN = /https?:\/\/\S+/g;
// yt-dlp names the video in its messages: "ERROR: [youtube] dQw4w9WgXcQ: Private video".
const YOUTUBE_ID_PATTERN = /\[youtube\] [\w-]{11}/g;
// Same as the processing job expiry: a stalled yt-dlp or ffmpeg must not outlive its job and keep
// the only worker busy until someone cancels by hand.
const MAX_COMMAND_MILLISECONDS = 6 * 60 * 60 * 1000;

/**
 * Carries no `cause` and no raw stderr: the execa error's message holds the full command line,
 * links included, and printing the error prints both.
 */
export class CommandFailedError extends Error {
    constructor(command: string, exitCode: number | null, stderr: string) {
        super(
            `${command} exited with code ${String(exitCode)}: ${redactLinks(stderr.slice(-STDERR_IN_MESSAGE_LENGTH))}`,
        );
        this.name = "CommandFailedError";
    }
}

/**
 * The message is logged, and links and YouTube ids are the user's data, so they are replaced; the
 * rest of the stderr tail stays so ffmpeg and yt-dlp failures can still be diagnosed.
 */
function redactLinks(text: string): string {
    return text
        .replaceAll(URL_PATTERN, "<url>")
        .replaceAll(YOUTUBE_ID_PATTERN, "[youtube] <youtube-id>");
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

    return new CommandFailedError(command, error.exitCode ?? null, stderr);
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
        timeout: MAX_COMMAND_MILLISECONDS,
        all: true,
        // The interleaved output is read line by line above, never as a whole: keeping it too
        // would hold yt-dlp and ffmpeg progress for a 3-hour video in memory a third time.
        buffer: { stdout: true, stderr: true, all: false },
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
