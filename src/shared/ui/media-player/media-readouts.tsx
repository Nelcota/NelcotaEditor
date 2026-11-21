import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import { formatClock } from "#/shared/ui/format";
import { toAudibleVolume } from "#/shared/ui/media-player/media-state";
import type { MediaPlayer } from "#/shared/ui/media-player/use-media-player";

const VOLUME_STEP = 0.05;
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

export function VolumeSlider({
    player,
    className,
}: {
    player: MediaPlayer;
    className?: string;
}): ReactNode {
    return (
        <input
            type="range"
            min={0}
            max={1}
            step={VOLUME_STEP}
            value={toAudibleVolume(player.media)}
            onChange={(event) => player.setVolume(Number(event.target.value))}
            aria-label="Volume"
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
        <button
            type="button"
            aria-label={`Velocidade ${rateLabel}. Clique para trocar`}
            title="Velocidade"
            onClick={player.stepRate}
            className="group/rate grid h-10 min-w-10 shrink-0 place-items-center rounded-lg px-1 text-white outline-none focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
        >
            <span className="grid h-7 min-w-9 place-items-center rounded-md border border-white/35 px-1.5 text-xs font-semibold tabular-nums transition-colors group-hover/rate:bg-white/15">
                {rateLabel}
            </span>
        </button>
    );
}
