import type { SVGProps } from "react";
import { cn } from "#/shared/ui/cn";

// Matches the Solar Linear icons: 24px grid, 1.5 stroke, circle radius 10.
const STROKE_WIDTH = 1.5;
const RADIUS = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_LENGTH = CIRCUMFERENCE / 4;

export function Spinner({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            aria-hidden="true"
            className={cn("size-4 motion-safe:animate-spin", className)}
            {...props}
        >
            <circle cx="12" cy="12" r={RADIUS} opacity={0.25} />
            <circle cx="12" cy="12" r={RADIUS} strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`} />
        </svg>
    );
}
