import { relative, resolve } from "node:path";
import { execa } from "execa";
import { z } from "zod";

// Claude Code runs this after every Edit or Write (see .claude/settings.json) and sends the tool
// call as JSON on stdin. Formatting right away keeps unformatted code from piling up until the
// pre-commit check.
const hookInputSchema = z.object({
    tool_input: z.object({ file_path: z.string().trim().min(1) }),
});

const FORMATTED_EXTENSIONS = [".ts", ".tsx", ".js", ".mjs", ".json", ".jsonc", ".md", ".css"];

async function readStdin(): Promise<string> {
    const chunks: Array<Buffer> = [];

    for await (const chunk of process.stdin) {
        chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString("utf8");
}

/** Only files of this project that oxfmt handles; anything else is left as it is. */
function toFormattablePath(filePath: string): string | null {
    const projectPath = relative(process.cwd(), resolve(filePath));

    if (projectPath.startsWith("..") === true || projectPath.length === 0) {
        return null;
    }

    if (FORMATTED_EXTENSIONS.some((extension) => projectPath.endsWith(extension)) === false) {
        return null;
    }

    return projectPath;
}

const result = hookInputSchema.safeParse(JSON.parse(await readStdin()));

if (result.success === false) {
    console.error("format-edited-file: the hook input has no tool_input.file_path");
    process.exit(1);
}

const formattablePath = toFormattablePath(result.data.tool_input.file_path);

if (formattablePath !== null) {
    // The project's .oxfmtrc.json still applies, ignorePatterns included.
    await execa("oxfmt", ["--no-error-on-unmatched-pattern", formattablePath], {
        preferLocal: true,
        stdio: "inherit",
    });
}
