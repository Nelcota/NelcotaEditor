import { z } from "zod";
import { TRANSCRIPTION_LANGUAGES } from "#/modules/preferences/model/preferences";
import { CLIP_LENGTHS } from "#/modules/video-records/model/clip-length";
import { MAX_TITLE_LENGTH } from "#/modules/video-records/model/upload-limits";
import { MAX_CLIP_COUNT, MIN_CLIP_COUNT } from "#/modules/video-records/model/video-status";

const MAX_FILE_NAME_LENGTH = 255;

/** What the browser declares before sending a file; the server checks the real size afterwards. */
export const startVideoUploadInputSchema = z.object({
    fileName: z.string().trim().min(1).max(MAX_FILE_NAME_LENGTH),
    title: z.string().trim().max(MAX_TITLE_LENGTH).default(""),
    sizeBytes: z.number().int().positive(),
    clipCount: z.number().int().min(MIN_CLIP_COUNT).max(MAX_CLIP_COUNT),
    clipLength: z.enum(CLIP_LENGTHS),
    language: z.enum(TRANSCRIPTION_LANGUAGES),
});

export type StartVideoUploadInput = z.infer<typeof startVideoUploadInputSchema>;

export const videoUploadIdInputSchema = z.object({ uploadId: z.uuid() });

export const startedVideoUploadSchema = z.object({
    uploadId: z.uuid(),
    /** Where the browser sends the file with PUT: a signed storage link, or the app's own route. */
    uploadUrl: z.string().min(1),
});

export type StartedVideoUpload = z.infer<typeof startedVideoUploadSchema>;
