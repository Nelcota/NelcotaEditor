import ArrowLeftIcon from "~icons/lucide/arrow-left";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BrandMark } from "#/shared/ui/brand-logo";
import { Button } from "#/shared/ui/button";

interface StandaloneMessageScreenProps {
    title: string;
    description: string;
    /** Extra actions shown before the way back. */
    actions?: ReactNode;
    /** The way back; the start page unless a closer place fits (a missing video goes to Vídeos). */
    returnLink?: ReactNode;
}

function HomeLink(): ReactNode {
    return (
        <Button asChild variant="secondary">
            <Link to="/">
                <ArrowLeftIcon aria-hidden="true" />
                Ir para o início
            </Link>
        </Button>
    );
}

/** A full page for when there is no screen to show: an unknown address or an unexpected error. */
export function StandaloneMessageScreen({
    title,
    description,
    actions,
    returnLink,
}: StandaloneMessageScreenProps) {
    return (
        <main className="grid min-h-dvh place-items-center px-4 py-12">
            <div className="grid max-w-md justify-items-center gap-4 text-center">
                <BrandMark className="size-16" />
                <h1 className="text-title font-semibold tracking-[-0.02em]">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {actions}
                    {returnLink ?? <HomeLink />}
                </div>
            </div>
        </main>
    );
}
