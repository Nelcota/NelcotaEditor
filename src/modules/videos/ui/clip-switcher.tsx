import SkipNextBoldIcon from "~icons/solar/skip-next-bold";
import SkipPreviousBoldIcon from "~icons/solar/skip-previous-bold";
import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/clip-view";
import { ControlButton } from "#/shared/ui/media-player/control-button";

interface ClipSwitcherProps {
    rankedClips: Array<ClipView>;
    selectedClipId: string;
    onSelectClip: (clip: ClipView) => void;
}

/** Steps through the clips best first, jumping the original to each one's start. */
export function ClipSwitcher({
    rankedClips,
    selectedClipId,
    onSelectClip,
}: ClipSwitcherProps): ReactNode {
    const selectedIndex = rankedClips.findIndex((clip) => clip.id === selectedClipId);

    if (selectedIndex === -1) {
        return null;
    }

    const previousClip = rankedClips[selectedIndex - 1];
    const nextClip = rankedClips[selectedIndex + 1];

    return (
        <div className="me-1 hidden h-8 shrink-0 items-center rounded-full bg-white/12 text-xs font-extrabold text-white tabular-nums @2xl:flex">
            <ControlButton
                label="Corte anterior"
                icon={SkipPreviousBoldIcon}
                size="sm"
                isDisabled={previousClip === undefined}
                onClick={() => {
                    if (previousClip !== undefined) {
                        onSelectClip(previousClip);
                    }
                }}
                className="rounded-full"
            />
            <span className="px-1 whitespace-nowrap">
                Corte {selectedIndex + 1} de {rankedClips.length}
            </span>
            <ControlButton
                label="Próximo corte"
                icon={SkipNextBoldIcon}
                size="sm"
                isDisabled={nextClip === undefined}
                onClick={() => {
                    if (nextClip !== undefined) {
                        onSelectClip(nextClip);
                    }
                }}
                className="rounded-full"
            />
        </div>
    );
}
