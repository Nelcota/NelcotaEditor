import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { clipStudioInputSchema } from "#/modules/clips/model/clip-studio";
import type { CaptionCue, StudioDraft } from "#/modules/clips/model/clip-studio";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { readStoredDraft } from "#/modules/studio/server/clip-studio.server";
import { findClipOfVideo } from "#/modules/clips/server/find-clip-of-video.server";
import { toClipView } from "#/modules/clips/server/clip-views.server";
import { readStoredCaptionCues } from "#/modules/clips/server/read-stored-caption-cues.server";
import { findOwnedVideo } from "#/modules/video-records/server/find-owned-video.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

/**
 * One clip's Studio state without the transcript. The browser already holds the video's words
 * (loaded once per video) and builds the applied captions from them, so switching clips never
 * reads the whole transcript again, neither on the server nor over the network.
 */
export interface ClipStudioSnapshot {
    clip: ClipView;
    /** The applied draft's settings and edges; its captions are `appliedCues`. */
    appliedSettings: Omit<StudioDraft, "cues">;
    /** The captions as edited in the Studio; null while they still follow the transcript. */
    appliedCues: Array<CaptionCue> | null;
    draft: StudioDraft | null;
    draftVersion: number;
    videoDurationSeconds: number | null;
}

export const getClipStudioSnapshot = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(clipStudioInputSchema)
    .handler(async ({ context, data }): Promise<ClipStudioSnapshot> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        const clip = await findClipOfVideo(video.id, data.clipId);
        const { startSeconds, endSeconds } = clip;

        if (Number.isFinite(startSeconds) === false || Number.isFinite(endSeconds) === false) {
            throw new UserFacingError("Não foi possível ler os tempos deste corte.");
        }

        return {
            clip: toClipView(clip),
            appliedSettings: {
                startSeconds,
                endSeconds,
                aspectRatio: clip.aspectRatio,
                captionStyle: clip.captionStyle,
                captionColor: clip.captionColor,
                captionSize: clip.captionSize,
                captionPosition: clip.captionPosition,
                captionFont: clip.captionFont,
            },
            appliedCues: readStoredCaptionCues(clip),
            draft: readStoredDraft(clip),
            draftVersion: clip.studioDraftVersion,
            videoDurationSeconds: video.durationSeconds,
        };
    });
