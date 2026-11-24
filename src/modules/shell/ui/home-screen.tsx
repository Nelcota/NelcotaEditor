import ChartNoAxesColumnIcon from "~icons/lucide/chart-no-axes-column";
import ScissorsIcon from "~icons/lucide/scissors";
import UploadIcon from "~icons/lucide/upload";
import { Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { useFirstName } from "#/modules/auth/ui/use-first-name";
import { VideoLinkComposer } from "#/modules/videos/ui/video-link-composer";
import { BrandMark } from "#/shared/ui/brand-logo";

const MORNING_START_HOUR = 5;
const AFTERNOON_START_HOUR = 12;
const EVENING_START_HOUR = 18;
const SHORTCUT_CLASS =
    "inline-flex h-9 items-center gap-2 rounded-xl border border-card-border bg-card px-3.5 text-sm font-medium outline-none transition-[background-color,scale] hover:bg-accent focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] [&>svg]:size-4 [&>svg]:text-muted-foreground";

/** By the person's own clock, so it only runs in the browser; the server says a plain hello. */
function greetingForHour(hour: number): string {
    if (hour >= MORNING_START_HOUR && hour < AFTERNOON_START_HOUR) {
        return "Bom dia";
    }

    if (hour >= AFTERNOON_START_HOUR && hour < EVENING_START_HOUR) {
        return "Boa tarde";
    }

    return "Boa noite";
}

/** The hour never needs a live update here: the greeting is read once per visit. */
function subscribeToNothing(): () => void {
    return () => undefined;
}

function readHour(): number {
    return new Date().getHours();
}

function readNoHour(): null {
    return null;
}

function useGreeting(): string {
    const hour = useSyncExternalStore(subscribeToNothing, readHour, readNoHour);

    if (hour === null) {
        return "Olá";
    }

    return greetingForHour(hour);
}

/**
 * Início (the reference's Copilot): a greeting from Nel, the link box that starts a video, and
 * three shortcuts under it.
 */
export function HomeScreen(): ReactNode {
    const firstName = useFirstName();
    const greeting = useGreeting();

    return (
        <div className="grid min-h-[calc(100dvh-12rem)] place-content-center justify-items-center gap-6 pb-16">
            <div className="grid justify-items-center gap-2 text-center">
                <h1 className="flex items-center gap-3 text-[1.875rem] leading-tight font-semibold tracking-[-0.035em]">
                    <BrandMark className="size-9" />
                    {greeting}, {firstName}.
                </h1>
                <p className="max-w-[46ch] text-sm text-muted-foreground">
                    Sou o Nel: transformo seus vídeos longos em cortes verticais com legenda,
                    prontos para postar.
                </p>
            </div>
            <VideoLinkComposer />
            <nav aria-label="Atalhos" className="-mt-4 flex flex-wrap justify-center gap-2">
                <Link to="/videos" search={{ newVideo: true }} className={SHORTCUT_CLASS}>
                    <UploadIcon aria-hidden="true" />
                    Enviar arquivo
                </Link>
                <Link to="/clips" className={SHORTCUT_CLASS}>
                    <ScissorsIcon aria-hidden="true" />
                    Ver meus cortes
                </Link>
                <Link to="/overview" className={SHORTCUT_CLASS}>
                    <ChartNoAxesColumnIcon aria-hidden="true" />
                    Analisar meus resultados
                </Link>
            </nav>
        </div>
    );
}
