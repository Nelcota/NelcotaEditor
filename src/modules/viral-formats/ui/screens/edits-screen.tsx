import ArrowRightIcon from "~icons/lucide/arrow-right";
import LayersIcon from "~icons/lucide/layers";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";

/**
 * Minhas edições: the batches edited in the formats. Editing is not built yet, so nobody has one
 * and the page is its empty state.
 */
export function EditsScreen(): ReactNode {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <header className="grid max-w-2xl gap-2">
                <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Histórico
                </p>
                <h1 className="text-title font-extrabold tracking-[-0.02em] sm:text-4xl">
                    Minhas edições
                </h1>
                <p className="text-muted-foreground">
                    Os lotes que você editou nos Formatos Virais ficam aqui.
                </p>
            </header>
            <EmptyState
                art={<LayersIcon aria-hidden="true" className="size-10 text-primary-ink" />}
                title="Você ainda não editou nenhum vídeo"
                description="Escolha um formato e suba seus vídeos brutos."
                action={
                    <Button asChild className="font-bold">
                        <Link to="/formats">
                            Ver os formatos
                            <ArrowRightIcon aria-hidden="true" className="size-4" />
                        </Link>
                    </Button>
                }
            />
        </div>
    );
}
