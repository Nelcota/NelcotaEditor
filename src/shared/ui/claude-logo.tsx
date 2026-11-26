import type { ReactNode, SVGProps } from "react";

/** The unmodified Claude Spark in Clay from Anthropic's press kit. */
export function ClaudeLogo(props: SVGProps<SVGSVGElement>): ReactNode {
    return (
        <svg {...props} viewBox="0 0 94 94" aria-hidden="true" focusable="false">
            <image href="/claude-spark.svg" width="94" height="94" />
        </svg>
    );
}
