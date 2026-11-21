import ArrowLeftIcon from "~icons/solar/arrow-left-linear";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BrandMark } from "#/shared/ui/brand-logo";
import { Button } from "#/shared/ui/button";

interface StandaloneMessageScreenProps {
    title: string;
    description: string;
    /** Extra actions shown before the way back to the start page. */
    actions?: ReactNode;
}

/** A full page for when there is no screen to show: an unknown address or an unexpected error. */
export function StandaloneMessageScreen({
    title,
    description,
    actions,
}: StandaloneMessageScreenProps) {
    return (
        <main className="grid min-h-dvh place-items-center px-4 py-12">
            <div className="grid max-w-md justify-items-center gap-4 text-center">
                <BrandMark className="size-16" />
                <h1 className="text-[30px] leading-tight font-semibold tracking-tight">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {actions}
                    <Button asChild variant="secondary">
                        <Link to="/">
                            <ArrowLeftIcon aria-hidden="true" />
                            Ir para o início
                        </Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
