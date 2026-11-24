import { MAX_TITLE_LENGTH } from "#/modules/video-records/model/upload-limits";
import { truncateText } from "#/modules/video-records/model/video-title";

const UPLOAD_PLACEHOLDER_TITLE = "Vídeo enviado";
const PATH_SEPARATOR_PATTERN = /[/\\]/;

/** The file's name without folders or its last extension; a dotfile keeps its whole name. */
function toBaseName(fileName: string): string {
    const lastSegment = fileName.split(PATH_SEPARATOR_PATTERN).at(-1) ?? "";
    const extensionStart = lastSegment.lastIndexOf(".");

    if (extensionStart <= 0) {
        return lastSegment;
    }

    return lastSegment.slice(0, extensionStart);
}

/**
 * The title an uploaded video gets: the typed one, else the file name without its extension and
 * cut to fit, else a placeholder. The review shows it and the server stores it, so they match.
 */
export function resolveUploadTitle(fileName: string, typedTitle: string): string {
    const trimmedTitle = typedTitle.trim();

    if (trimmedTitle.length > 0) {
        return trimmedTitle;
    }

    const baseName = truncateText(toBaseName(fileName).trim(), MAX_TITLE_LENGTH);

    if (baseName.length === 0) {
        return UPLOAD_PLACEHOLDER_TITLE;
    }

    return baseName;
}
