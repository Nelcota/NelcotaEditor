import ChevronLeftIcon from "~icons/lucide/chevron-left";
import ChevronRightIcon from "~icons/lucide/chevron-right";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger } from "#/shared/ui/select";

interface StudioClipSwitcherProps {
    rankedClips: Array<ClipView>;
    clipId: string;
    onSelectClip: (clipId: string) => void;
}

/**
 * The clip being edited, as the page's heading, with the best-first neighbours one click away and
 * the whole list under "Corte N de M".
 */
export function StudioClipSwitcher(props: StudioClipSwitcherProps): ReactNode {
    const { rankedClips, clipId, onSelectClip } = props;
    const titleRef = useRef<HTMLHeadingElement>(null);

    // Switching clips remounts the editor, the arrows and list included, so focus would fall to
    // the page; the new clip's title takes it and a screen reader announces the clip.
    useEffect(() => {
        const title = titleRef.current;

        if (title === null || document.activeElement !== document.body) {
            return;
        }

        title.focus({ preventScroll: true });
    }, []);
    const index = rankedClips.findIndex((clip) => clip.id === clipId);
    const clip = rankedClips[index];
    const previous = rankedClips[index - 1];
    const next = rankedClips[index + 1];

    if (clip === undefined) {
        throw new Error(`The Studio's clip ${clipId} is not among the video's clips.`);
    }

    const selectNeighbour = (neighbour: ClipView | undefined): void => {
        if (neighbour === undefined) {
            return;
        }

        onSelectClip(neighbour.id);
    };

    return (
        // Grows from nothing: in the wrapping bar a long title shrinks instead of pushing
        // Renderizar to a second line.
        <div className="flex min-w-0 flex-1 basis-0 items-center gap-1">
            <HintTooltip label="Corte anterior">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Corte anterior"
                    disabled={previous === undefined}
                    onClick={() => selectNeighbour(previous)}
                    className="max-sm:hidden"
                >
                    <ChevronLeftIcon aria-hidden="true" />
                </Button>
            </HintTooltip>
            <div className="grid min-w-0 px-1">
                <h1
                    ref={titleRef}
                    tabIndex={-1}
                    className="truncate text-base leading-snug font-semibold outline-none"
                >
                    {clip.title}
                </h1>
                <Select value={clipId} onValueChange={onSelectClip}>
                    <SelectTrigger
                        aria-label={`Corte ${index + 1} de ${rankedClips.length}. Trocar de corte`}
                        className="h-6 w-fit gap-1 border-0 bg-transparent p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Corte {index + 1} de {rankedClips.length}
                    </SelectTrigger>
                    <SelectContent>
                        {rankedClips.map((candidate, position) => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                                    {position + 1}
                                </span>
                                <span className="truncate">{candidate.title}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <HintTooltip label="Próximo corte">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Próximo corte"
                    disabled={next === undefined}
                    onClick={() => selectNeighbour(next)}
                    className="max-sm:hidden"
                >
                    <ChevronRightIcon aria-hidden="true" />
                </Button>
            </HintTooltip>
        </div>
    );
}
