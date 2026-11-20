import { z } from "zod";

const MAX_VIDEO_TITLE_LENGTH = 200;

/** Shared by the rename form and the server, which validates it again. */
export const videoTitleSchema = z
    .string()
    .trim()
    .min(1, "Digite um título.")
    .max(MAX_VIDEO_TITLE_LENGTH, `O título pode ter até ${MAX_VIDEO_TITLE_LENGTH} caracteres.`);

export const renameVideoFormSchema = z.object({ title: videoTitleSchema });
