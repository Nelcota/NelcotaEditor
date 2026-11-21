import { rm } from "node:fs/promises";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { z } from "zod";
import { clips } from "#/modules/clips/clips.schema";
import type { CaptionWord } from "#/modules/clips/clip-studio.schema";
import {
    clipStudioInputSchema,
    renderClipDraftInputSchema,
    saveClipDraftInputSchema,
} from "#/modules/clips/clip-studio.schema";
import { enqueueVideoProcessing } from "#/modules/processing/server/video-processing-queue.server";
import type {
    ClipStudioState,
    RenderDraftResult,
    SaveDraftResult,
} from "#/modules/videos/clip-studio-view";
import {
    assertDraftFitsVideo,
    assertVideoEditable,
    findTranscriptWords,
    readStoredDraft,
    toAppliedDraft,
} from "#/modules/videos/server/clip-studio.server";
import { findClipOfVideo } from "#/modules/videos/server/find-clip-of-video.server";
import { resetVideoToQueued } from "#/modules/videos/server/video-progress.server";
import { findOwnedVideo, toClipView } from "#/modules/videos/server/video-queries.server";
import { UserFacingError } from "#/shared/server/user-facing-error";
import { resolveStoragePath } from "#/shared/server/storage.server";

const studioWordsInputSchema = z.object({ videoId: z.uuid() });

const nextDraftVersion = sql`${clips.studioDraftVersion} + 1`;

export const getClipStudio = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(clipStudioInputSchema)
    .handler(async ({ context, data }): Promise<ClipStudioState> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        // Ownership is settled; the clip and the transcript do not depend on each other.
        const [clip, words] = await Promise.all([
            findClipOfVideo(video.id, data.clipId),
            findTranscriptWords(video.id),
        ]);

        // The words build the applied draft here, but the browser gets them once per video
        // from getStudioWords instead of again with every clip.
        return {
            clip: toClipView(clip),
            applied: toAppliedDraft(clip, words),
            draft: readStoredDraft(clip),
            draftVersion: clip.studioDraftVersion,
            videoDurationSeconds: video.durationSeconds,
        };
    });

/** The video's transcript words, shared by every clip the Studio opens. */
export const getStudioWords = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(studioWordsInputSchema)
    .handler(async ({ context, data }): Promise<Array<CaptionWord>> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        return findTranscriptWords(video.id);
    });

/**
 * Keeps the Studio's edits without rendering them. The version only moves forward when the
 * caller saw the latest one, so a second tab can never silently overwrite the first.
 */
export const saveClipDraft = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(saveClipDraftInputSchema)
    .handler(async ({ context, data }): Promise<SaveDraftResult> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        assertVideoEditable(video);
        assertDraftFitsVideo(data.draft, video);
        const clip = await findClipOfVideo(video.id, data.clipId);

        const updated = await db
            .update(clips)
            .set({ studioDraft: data.draft, studioDraftVersion: nextDraftVersion })
            .where(and(eq(clips.id, clip.id), eq(clips.studioDraftVersion, data.expectedVersion)))
            .returning({ draftVersion: clips.studioDraftVersion });
        const row = updated[0];

        if (row === undefined) {
            return { kind: "conflict" };
        }

        return { kind: "saved", draftVersion: row.draftVersion };
    });

/**
 * Applies the saved draft to the clip and sends it back to Brasa. The old file is removed; the
 * pipeline keeps every finished step, so only this clip is rendered again.
 */
export const renderClipDraft = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(renderClipDraftInputSchema)
    .handler(async ({ context, data }): Promise<RenderDraftResult> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        assertVideoEditable(video);
        const clip = await findClipOfVideo(video.id, data.clipId);
        const draft = readStoredDraft(clip);

        if (clip.studioDraftVersion !== data.expectedVersion) {
            return { kind: "conflict" };
        }

        if (draft === null) {
            throw new UserFacingError("Não há alterações para renderizar.");
        }

        assertDraftFitsVideo(draft, video);

        const updated = await db
            .update(clips)
            .set({
                startSeconds: draft.startSeconds,
                endSeconds: draft.endSeconds,
                aspectRatio: draft.aspectRatio,
                captionStyle: draft.captionStyle,
                captionColor: draft.captionColor,
                captionSize: draft.captionSize,
                captionPosition: draft.captionPosition,
                captionFont: draft.captionFont,
                captionCues: draft.cues,
                studioDraft: null,
                studioDraftVersion: nextDraftVersion,
                status: "pending",
                outputPath: null,
            })
            .where(and(eq(clips.id, clip.id), eq(clips.studioDraftVersion, data.expectedVersion)))
            .returning({ id: clips.id });

        if (updated.length === 0) {
            return { kind: "conflict" };
        }

        if (clip.outputPath !== null) {
            await rm(resolveStoragePath(clip.outputPath), { force: true });
        }

        await resetVideoToQueued(video.id);
        await enqueueVideoProcessing(video.id);
        return { kind: "queued" };
    });
