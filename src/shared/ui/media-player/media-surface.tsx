import PlayBoldIcon from "~icons/solar/play-bold";
import type { ReactNode, RefObject } from "react";
import { cn } from "#/shared/ui/cn";
import { toBarPercent } from "#/shared/ui/media-player/seek-bar";
import type { MediaPlayer } from "#/shared/ui/media-player/use-media-player";
import { Spinner } from "#/shared/ui/spinner";

const BAR_PERCENT = 100;

interface MediaSurfaceProps {
    player: MediaPlayer;
    containerRef: RefObject<HTMLDivElement | null>;
    label: string;
    /** The <video> element itself. */
    children: ReactNode;
    controls: ReactNode;
    size?: "md" | "sm";
    className?: string;
}

function BigPlayButton({ player, size }: { player: MediaPlayer; size: "md" | "sm" }): ReactNode {
    return (
        <button
            type="button"
            aria-label="Tocar"
            onClick={async () => {
                await player.togglePlay();
            }}
            className={cn(
                "absolute top-1/2 left-1/2 z-10 grid -translate-1/2 place-items-center rounded-full border border-white/20 bg-black/65 text-white outline-none transition-[scale,background-color] hover:scale-105 hover:bg-black/80 focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]",
                size === "md" && "size-18 [&>svg]:size-8",
                size === "sm" && "size-12 [&>svg]:size-5",
            )}
        >
            <PlayBoldIcon aria-hidden="true" className="translate-x-0.5" />
        </button>
    );
}

/** While playing with the mouse still, the controls step aside and only this thin line stays. */
function IdleProgress({ player }: { player: MediaPlayer }): ReactNode {
    const media = player.media;

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/20 opacity-0 transition-opacity group-data-[idle=true]/player:opacity-100"
        >
            {/* scaleX, not width: it changes on every timeupdate and must not re-run layout. */}
            <div
                className="h-full origin-left bg-white"
                style={{
                    transform: `scaleX(${toBarPercent(media.currentSeconds, media.durationSeconds) / BAR_PERCENT})`,
                }}
            />
        </div>
    );
}

/**
 * The frame every custom-controlled video shares: click the picture to play or pause, keyboard
 * shortcuts once it has focus, the big play button while paused, and controls that hide while
 * the video plays and the mouse rests.
 */
export function MediaSurface({
    player,
    containerRef,
    label,
    children,
    controls,
    size = "md",
    className,
}: MediaSurfaceProps): ReactNode {
    const media = player.media;

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label={label}
            tabIndex={0}
            data-idle={player.isIdle}
            onKeyDown={async (event) => {
                await player.handleKeyDown(event);
            }}
            onPointerMove={player.wake}
            className={cn(
                "group/player @container relative isolate overflow-hidden bg-black outline-none focus-visible:ring-4 focus-visible:ring-ring/70 data-[idle=true]:cursor-none [&:fullscreen]:rounded-none [&:fullscreen]:border-0",
                className,
            )}
        >
            <div
                className="absolute inset-0 [&>video]:size-full"
                onClick={async () => {
                    await player.togglePlay();
                }}
            >
                {children}
            </div>
            {media.isPlaying === false && <BigPlayButton player={player} size={size} />}
            {media.isPlaying === true && media.isWaiting === true && (
                <Spinner className="pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-1/2 text-white" />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/80 to-transparent transition-opacity duration-300 group-data-[idle=true]/player:opacity-0 group-has-[:focus-visible]/player:opacity-100!" />
            <div className="absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300 group-data-[idle=true]/player:pointer-events-none group-data-[idle=true]/player:opacity-0 has-[:focus-visible]:pointer-events-auto! has-[:focus-visible]:opacity-100!">
                {controls}
            </div>
            <IdleProgress player={player} />
        </div>
    );
}
