import type { CSSProperties, ReactNode } from "react";
import { resolveCaptionPlacement } from "#/modules/clips/caption-layout";
import { CAPTION_COLOR_HEX, CAPTION_FONT_FACES } from "#/modules/clips/caption-style";
import type { CaptionCue, StudioDraft } from "#/modules/clips/clip-studio.schema";
import { findLastStartedIndex } from "#/modules/videos/ui/find-last-started-index";
import { usePlaybackValue } from "#/modules/studio/ui/playback-clock";
import type { PlaybackClock } from "#/modules/studio/ui/playback-clock";

const PERCENT = 100;
// Matches the subtitles file: outline 7 and shadow 3 at a 96px font.
const OUTLINE_EM = 0.073;
const LAST_WORD_HOLD_SECONDS = 0.3;

/**
 * The cue on screen at this moment, the same way the burned-in subtitles time it. Runs every
 * frame, so it binary-searches: the draft schema keeps cues in order and apart.
 */
export function findCueAt(cues: Array<CaptionCue>, seconds: number): number {
    const index = findLastStartedIndex(cues, seconds);
    const cue = cues[index];

    if (cue === undefined) {
        return -1;
    }

    const nextCue = cues[index + 1];
    const holdUntil = Math.min(
        cue.endSeconds + LAST_WORD_HOLD_SECONDS,
        nextCue?.startSeconds ?? Number.POSITIVE_INFINITY,
    );

    if (seconds >= holdUntil) {
        return -1;
    }

    return index;
}

function findSpokenWordIndex(cue: CaptionCue, seconds: number): number {
    return cue.words.findLastIndex((word) => word.startSeconds <= seconds);
}

function placementStyle(draft: StudioDraft): CSSProperties {
    const placement = resolveCaptionPlacement({
        aspectRatio: draft.aspectRatio,
        size: draft.captionSize,
        position: draft.captionPosition,
        font: draft.captionFont,
    });
    const face = CAPTION_FONT_FACES[draft.captionFont];
    const toHeight = (pixels: number): string => `${(pixels / placement.frameHeight) * PERCENT}%`;
    const sidePadding = `${(placement.marginHorizontal / placement.frameWidth) * PERCENT}%`;
    const style: CSSProperties = {
        fontSize: `${(placement.fontSize / placement.frameHeight) * PERCENT}cqh`,
        fontFamily: `"${face.family}", sans-serif`,
        fontWeight: face.previewWeight,
        WebkitTextStroke: `${OUTLINE_EM * 2}em #000`,
        left: sidePadding,
        right: sidePadding,
    };
    const positions: Record<StudioDraft["captionPosition"], CSSProperties> = {
        bottom: { bottom: toHeight(placement.marginVertical) },
        top: { top: toHeight(placement.marginVertical) },
        middle: { top: "50%", transform: "translateY(-50%)" },
    };

    return { ...style, ...positions[draft.captionPosition] };
}

/** Karaoke paints the word being spoken; the classic style keeps every word white. */
function wordStyle(draft: StudioDraft, isSpoken: boolean): CSSProperties | undefined {
    if (draft.captionStyle !== "karaoke" || isSpoken === false) {
        return undefined;
    }

    return { color: CAPTION_COLOR_HEX[draft.captionColor] };
}

interface CaptionOverlayProps {
    draft: StudioDraft;
    clock: PlaybackClock;
}

function findSpokenWordIndexIn(cue: CaptionCue | undefined, seconds: number): number {
    if (cue === undefined) {
        return -1;
    }

    return findSpokenWordIndex(cue, seconds);
}

/**
 * The caption drawn over the live preview, placed and sized like the rendered file. It follows the
 * clock through the cue and word indexes, so it re-renders when the highlight moves, not per frame.
 */
export function CaptionOverlay({ draft, clock }: CaptionOverlayProps): ReactNode {
    const cues = draft.cues;
    const cueIndex = usePlaybackValue(clock, (seconds) => findCueAt(cues, seconds));
    const cue = cues[cueIndex];
    const spokenIndex = usePlaybackValue(clock, (seconds) => findSpokenWordIndexIn(cue, seconds));

    if (draft.captionStyle === "none" || cue === undefined) {
        return null;
    }

    return (
        <p
            aria-hidden="true"
            className="pointer-events-none absolute z-10 text-center leading-[1.15] text-white uppercase [paint-order:stroke_fill] [text-shadow:0_0.03em_0.06em_rgb(0_0_0/0.6)]"
            style={placementStyle(draft)}
        >
            {cue.words.map((word, index) => (
                <span
                    key={`${word.startSeconds}-${index}`}
                    style={wordStyle(draft, index === spokenIndex)}
                >
                    {index > 0 && " "}
                    {word.text}
                </span>
            ))}
        </p>
    );
}
