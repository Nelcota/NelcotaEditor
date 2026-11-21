/**
 * ffmpeg and ffprobe pick the format from the file's content, so an upload disguised as a video
 * can be a playlist that points at URLs. Allowing only the file protocol keeps them on disk.
 * These are input options: they must come right before the input they apply to.
 */
export function localFileInput(absolutePath: string): Array<string> {
    return ["-protocol_whitelist", "file", "-i", absolutePath];
}
