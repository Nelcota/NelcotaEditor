import { useId } from "react";
import type { ReactNode } from "react";
import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { useBrandGaze } from "#/shared/ui/use-brand-gaze";

export function BrandGaze(): ReactNode {
    const id = useId();
    const overlayRef = useBrandGaze();
    const faceColor = `${id}-face`;
    const faceEdge = `${id}-edge`;
    const faceMask = `${id}-mask`;
    const eyeColor = `${id}-eyes`;

    return (
        <span aria-hidden="true" className="relative inline-flex size-8 shrink-0">
            <Mascot index={BRAND_MASCOT_INDEX} className="size-full" />
            <svg
                ref={overlayRef}
                className="brand-gaze pointer-events-none absolute inset-0 size-full"
                viewBox="0 0 80 80"
                focusable="false"
            >
                <defs>
                    <linearGradient id={faceColor} x2="35%" y2="100%">
                        <stop stopColor="#0db36a" />
                        <stop offset="1" stopColor="#079d53" />
                    </linearGradient>
                    <radialGradient id={faceEdge}>
                        <stop offset="65%" stopColor="white" />
                        <stop offset="1" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                    <mask id={faceMask}>
                        <g fill={`url(#${faceEdge})`}>
                            <ellipse cx="32" cy="37" rx="9" ry="13" />
                            <ellipse cx="48" cy="37" rx="9" ry="13" />
                        </g>
                    </mask>
                    <linearGradient id={eyeColor} x2="25%" y2="100%">
                        <stop stopColor="#f2ead0" />
                        <stop offset="1" stopColor="#d2c29b" />
                    </linearGradient>
                </defs>
                {/* Feather over the painted eyes so the shared sprite can stay intact. */}
                <rect
                    x="22"
                    y="24"
                    width="36"
                    height="26"
                    fill={`url(#${faceColor})`}
                    mask={`url(#${faceMask})`}
                />
                <g className="brand-gaze-eyes">
                    <g className="brand-gaze-lids" fill={`url(#${eyeColor})`}>
                        <ellipse cx="31.8" cy="37.2" rx="3.8" ry="5.9" />
                        <ellipse cx="47.9" cy="37.2" rx="3.8" ry="5.9" />
                    </g>
                </g>
            </svg>
        </span>
    );
}
