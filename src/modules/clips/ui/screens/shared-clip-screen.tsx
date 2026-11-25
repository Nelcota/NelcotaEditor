import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { SharedClip } from "#/modules/clips/model/shared-clip";
import { BrandLogo } from "#/shared/ui/brand-logo";
import { VerticalClipPlayer } from "#/shared/ui/media-player/vertical-clip-player";
import { TooltipProvider } from "#/shared/ui/tooltip";

interface SharedClipScreenProps {
    clip: SharedClip;
}

/** What someone who got the link sees: the clip, its title and where it was made, no sign-in. */
export function SharedClipScreen({ clip }: SharedClipScreenProps): ReactNode {
    return (
        <div className="flex min-h-dvh flex-col items-center gap-8 px-4 py-8">
            <header>
                <Link
                    to="/"
                    aria-label="Nelcota, página inicial"
                    className="inline-block rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-99"
                >
                    <BrandLogo />
                </Link>
            </header>
            <main className="grid w-full max-w-xs gap-4">
                {/* The player's buttons have tooltips; this page has no app layout to provide them. */}
                <TooltipProvider>
                    <VerticalClipPlayer label={`Corte: ${clip.title}`} fileUrl={clip.videoPath} />
                </TooltipProvider>
                <h1 className="text-lg font-semibold text-pretty">{clip.title}</h1>
            </main>
        </div>
    );
}
