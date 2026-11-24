import type { ReactNode } from "react";
import { Mascot } from "#/shared/ui/mascot";

interface ScoreChipProps {
    score: number;
    scale: number;
    /** Who gave the score, said by the tooltip and screen readers. */
    label: string;
    mascotIndex: number;
}

/** A score as a small pill, for layouts with no room for the full score block. */
export function ScoreChip({ score, scale, label, mascotIndex }: ScoreChipProps): ReactNode {
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 ps-1 pe-2.5 text-xs font-semibold whitespace-nowrap tabular-nums"
            title={`${label}: ${score} de ${scale}`}
        >
            <Mascot index={mascotIndex} className="size-5" />
            <span className="sr-only">{label}</span>
            {/* One item, so the chip's gap never splits the score from its scale. */}
            <span>
                {score}
                <span className="font-medium text-muted-foreground">/{scale}</span>
            </span>
        </span>
    );
}
