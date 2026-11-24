import PlayIcon from "~icons/lucide-solid/play";
import { useEffect, useEffectEvent } from "react";
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
            onClick={player.togglePlay}
            className={cn(
                "absolute top-1/2 left-1/2 z-10 grid -translate-1/2 place-items-center rounded-full border border-white/20 bg-black/65 text-white outline-none transition-[scale,background-color] hover:scale-105 hover:bg-black/80 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]",
                size === "md" && "size-18 [&>svg]:size-8",
                size === "sm" && "size-12 [&>svg]:size-5",
            )}
        >
            <PlayIcon aria-hidden="true" className="translate-x-0.5" />
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
 * the video plays and the mouse rests. The browser's own right-click menu is turned off.
 */
function preventDefault(event: Event): void {
    event.preventDefault();
}

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
    const onShortcutKey = useEffectEvent((event: KeyboardEvent): void => {
        player.handleKeyDown(event);
    });
    const onPointerMove = useEffectEvent((): void => {
        player.wake();
    });

    // Key presses bubble up from the player's own buttons and sliders, so the shortcuts work while
    // any of them has focus; the box itself stays out of the tab order.
    useEffect(() => {
        const container = containerRef.current;

        if (container === null) {
            return undefined;
        }

        container.addEventListener("keydown", onShortcutKey);
        container.addEventListener("pointermove", onPointerMove);
        // The browser menu offers "Show controls", which stacks its bar over ours; "Baixar" covers saving.
        container.addEventListener("contextmenu", preventDefault);

        return () => {
            container.removeEventListener("keydown", onShortcutKey);
            container.removeEventListener("pointermove", onPointerMove);
            container.removeEventListener("contextmenu", preventDefault);
        };
    }, [containerRef]);

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label={label}
            data-idle={player.isIdle}
            className={cn(
                "group/player @container relative isolate overflow-hidden bg-black outline-none focus-visible:ring-4 focus-visible:ring-ring data-[idle=true]:cursor-none [&:fullscreen]:rounded-none [&:fullscreen]:border-0",
                className,
            )}
        >
            <div className="absolute inset-0 [&>video]:size-full">{children}</div>
            {/* The whole picture plays and pauses on click; keyboard users have the controls. */}
            <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                className="absolute inset-0 outline-none"
                onClick={(event) => {
                    // Safari does not focus a button on click; without focus inside the player,
                    // its keys (K, F, M, arrows) would go to the page instead.
                    event.currentTarget.focus({ preventScroll: true });
                    player.togglePlay();
                }}
            />
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
