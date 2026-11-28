import { z } from "zod";
import type { Clip } from "#/modules/clips/clips.schema";
import { captionCueSchema } from "#/modules/clips/model/clip-studio";
import type { CaptionCue } from "#/modules/clips/model/clip-studio";
import { logger } from "#/shared/server/logger.server";

const storedCuesSchema = z.array(captionCueSchema);

/** Use the transcript when saved edits are missing or cannot be read. */
export function readStoredCaptionCues(
    clip: Pick<Clip, "id" | "captionCues">,
): Array<CaptionCue> | null {
    const { id: clipId, captionCues } = clip;

    if (captionCues === null) {
        return null;
    }

    const result = storedCuesSchema.safeParse(captionCues);

    if (result.success === false) {
        logger.warn({ clipId }, "Ignoring invalid stored caption cues");
        return null;
    }

    return result.data;
}
