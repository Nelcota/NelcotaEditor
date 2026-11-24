import {
    ALLOWED_VIDEO_EXTENSIONS,
    MAX_UPLOAD_BYTES,
} from "#/modules/video-records/model/upload-limits";

/** Checked before uploading so a wrong file fails at once; the server checks again either way. */
export function describeFileProblem(file: File): string | null {
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_VIDEO_EXTENSIONS.some((extension) =>
        lowerName.endsWith(extension),
    );

    if (hasAllowedExtension === false) {
        return "Formato não suportado. Use MP4, MOV, MKV, WEBM ou AVI.";
    }

    if (file.size > MAX_UPLOAD_BYTES) {
        return "O arquivo passa de 5 GB. Escolha um arquivo menor ou cole um link do YouTube.";
    }

    return null;
}
