import type { ReactNode } from "react";
import { STAGE_CREW } from "#/modules/videos/stage-crew";
import { SCORE_SCALE } from "#/modules/videos/ui/clip-score";
import { Mascot } from "#/shared/ui/mascot";

/** Brilho's score as a small pill, for layouts with no room for the full score block. */
export function ScoreChip({ score }: { score: number }): ReactNode {
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 ps-1 pe-2.5 text-xs font-bold whitespace-nowrap tabular-nums"
            title={`Nota do Brilho: ${score} de ${SCORE_SCALE}`}
        >
            <Mascot index={STAGE_CREW.selecting} className="size-5" />
            <span className="sr-only">Nota do Brilho</span>
            {/* One item, so the chip's gap never splits the score from its scale. */}
            <span>
                {score}
                <span className="font-semibold text-muted-foreground">/{SCORE_SCALE}</span>
            </span>
        </span>
    );
}
