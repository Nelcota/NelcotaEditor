import type { CSSProperties, ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { toAudibleVolume } from "#/shared/ui/media-player/media-state";
import { toBarPercent } from "#/shared/ui/media-player/seek-bar";
import type { MediaPlayer } from "#/shared/ui/media-player/use-media-player";

const VOLUME_STEP = 0.05;
const MAX_VOLUME = 1;
// Same as the `--range-track` token in styles.css, which this gradient replaces on the volume bar.
const UNFILLED_TRACK_COLOR = "oklch(1 0 0 / 0.25)";
const rateFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

interface TimeLabelProps {
    currentSeconds: number;
    durationSeconds: number;
    className?: string;
}

export function TimeLabel({
    currentSeconds,
    durationSeconds,
    className,
}: TimeLabelProps): ReactNode {
    return (
        <span
            className={cn(
                "px-2 text-meta font-semibold whitespace-nowrap text-white tabular-nums",
                className,
            )}
        >
            {formatClock(currentSeconds)}
            <span className="text-white/60"> / {formatClock(durationSeconds)}</span>
        </span>
    );
}

/**
 * Chrome, Edge and Safari have no pseudo-element for the filled part of a range, so the track
 * paints it: solid up to the level, faint after.
 */
export function toVolumeTrackBackground(volume: number): string {
    const filledPercent = toBarPercent(volume, MAX_VOLUME);

    return `linear-gradient(to right, var(--range-fill) ${filledPercent}%, ${UNFILLED_TRACK_COLOR} ${filledPercent}%)`;
}

export function VolumeSlider({
    player,
    className,
}: {
    player: MediaPlayer;
    className?: string;
}): ReactNode {
    const volume = toAudibleVolume(player.media);
    const trackStyle: CSSProperties & Record<"--range-track", string> = {
        "--range-track": toVolumeTrackBackground(volume),
    };

    return (
        <input
            type="range"
            min={0}
            max={MAX_VOLUME}
            step={VOLUME_STEP}
            value={volume}
            onChange={(event) => player.setVolume(Number(event.target.value))}
            aria-label="Volume"
            style={trackStyle}
            className={cn(
                "range-media w-16 cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring",
                className,
            )}
        />
    );
}

/** Steps 1× → 1,25× → 1,5× → 2× → 0,5×; the pill keeps the 40px hit area of the other controls. */
export function PlaybackRateButton({ player }: { player: MediaPlayer }): ReactNode {
    const rateLabel = `${rateFormatter.format(player.media.playbackRate)}×`;

    return (
        <HintTooltip label="Velocidade">
            <button
                type="button"
                aria-label={`Velocidade ${rateLabel}. Clique para trocar`}
                onClick={player.stepRate}
                className="group/rate grid h-10 min-w-10 shrink-0 place-items-center rounded-lg px-1 text-white outline-none focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
            >
                <span className="grid h-7 min-w-9 place-items-center rounded-md border border-white/35 px-1.5 text-xs font-semibold tabular-nums transition-colors group-hover/rate:bg-white/15">
                    {rateLabel}
                </span>
            </button>
        </HintTooltip>
    );
}
