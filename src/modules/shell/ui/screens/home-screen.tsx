import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { useFirstName } from "#/modules/shell/ui/hooks/use-first-name";
import { HomeShortcuts } from "#/modules/shell/ui/components/home-shortcuts";
import { BrandMark } from "#/shared/ui/brand-logo";

const MORNING_START_HOUR = 5;
const AFTERNOON_START_HOUR = 12;
const EVENING_START_HOUR = 18;

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
 * Início, as plain as the reference's assistant home: a greeting from Nel, the link box that
 * starts a video and three shortcuts under it. Nothing else competes with the box.
 */
export function HomeScreen({ linkComposer }: { linkComposer: ReactNode }): ReactNode {
    const firstName = useFirstName();
    const greeting = useGreeting();

    return (
        <div className="grid min-h-[calc(100dvh-12rem)] grid-cols-[minmax(0,1fr)] place-content-center justify-items-center gap-5 pb-16">
            <div className="grid justify-items-center gap-3 pb-3 text-center">
                <h1 className="flex items-center gap-3.5 text-[2.5rem] leading-tight font-semibold tracking-[-0.04em] max-sm:text-[1.875rem]">
                    <BrandMark className="size-11 max-sm:size-8" />
                    {greeting}, {firstName}.
                </h1>
                <p className="max-w-[44ch] text-base text-muted-foreground">
                    Cole um link e eu faço o resto: cortes verticais com legenda, prontos para
                    postar.
                </p>
            </div>
            <div className="grid w-full max-w-3xl">{linkComposer}</div>
            <HomeShortcuts />
        </div>
    );
}
