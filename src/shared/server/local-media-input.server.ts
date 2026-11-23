/**
 * Demuxers a source video may use: "mov" covers .mp4/.mov/.m4v (and YouTube's mp4), "matroska"
 * covers .mkv/.webm, "avi" covers .avi. ffmpeg matches each name against the demuxer's own list
 * ("mov,mp4,m4a,3gp,3g2,mj2", "matroska,webm"), and nested inputs inherit the whitelist.
 */
const ALLOWED_INPUT_FORMATS = ["mov", "matroska", "avi"].join(",");

/**
 * ffmpeg and ffprobe pick the format from the file's content, so an upload disguised as a video
 * can be a playlist or a DASH/HLS manifest that points at URLs or at other files on disk. The
 * protocol whitelist keeps them on disk; the format whitelist stops a manifest from reading
 * another account's video next to it in the storage directory.
 * These are input options: they must come right before the input they apply to.
 */
export function localFileInput(absolutePath: string): Array<string> {
    return [
        "-protocol_whitelist",
        "file",
        "-format_whitelist",
        ALLOWED_INPUT_FORMATS,
        "-i",
        absolutePath,
    ];
}
