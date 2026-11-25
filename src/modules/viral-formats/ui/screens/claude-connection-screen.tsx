import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { claudeConnectionQueryOptions } from "#/modules/auth/model/claude-connection-queries";
import type { ClaudeConnection } from "#/modules/auth/model/claude-connection";
import { ClaudeConnectSteps } from "#/modules/viral-formats/ui/components/claude-connect-steps";
import { ClaudeConnectedCard } from "#/modules/viral-formats/ui/components/claude-connected-card";
import { AsyncButton } from "#/shared/ui/async-button";
import { BrandMark } from "#/shared/ui/brand-logo";
import { ClaudeLogo } from "#/shared/ui/claude-logo";
import { cn } from "#/shared/ui/cn";
import { Skeleton } from "#/shared/ui/skeleton";

/** The two marks joined by a line: dashed while waiting, solid once Claude is in. */
function ConnectionPicture({ isConnected }: { isConnected: boolean }): ReactNode {
    return (
        <div
            aria-hidden="true"
            className="flex items-center justify-center gap-4 rounded-2xl border border-card-border bg-card px-6 py-12"
        >
            <span className="grid size-16 place-items-center rounded-2xl bg-secondary">
                <BrandMark className="h-6" />
            </span>
            <span
                className={cn(
                    "h-0.5 w-16 rounded-full border-t-2 border-dashed border-foreground/25",
                    isConnected === true && "border-solid border-success",
                )}
            />
            <span className="grid size-16 place-items-center rounded-2xl bg-secondary">
                <ClaudeLogo className="size-9" />
            </span>
        </div>
    );
}

function ConnectionPanel({ connection }: { connection: ClaudeConnection }): ReactNode {
    const connectedAt = connection.connectedAt;

    if (connectedAt !== null) {
        return <ClaudeConnectedCard connectedAt={connectedAt} />;
    }

    return <ClaudeConnectSteps mcpUrl={connection.mcpUrl} />;
}

function ConnectionLoadError({ onRetry }: { onRetry: () => Promise<unknown> }): ReactNode {
    return (
        <div className="grid justify-items-start gap-3">
            <p className="text-muted-foreground">
                Não foi possível ver se o Claude está conectado. Confira sua conexão.
            </p>
            <AsyncButton variant="secondary" onAction={onRetry}>
                <RotateCwIcon aria-hidden="true" />
                Tentar de novo
            </AsyncButton>
        </div>
    );
}

/** Etapa 1: connect the person's Claude, which the formats edit with, or see that it is. */
export function ClaudeConnectionScreen(): ReactNode {
    const connectionQuery = useQuery(claudeConnectionQueryOptions());
    const connection = connectionQuery.data;
    const connectedAt = connection?.connectedAt ?? null;

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <header className="grid max-w-2xl gap-2">
                <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Etapa 1
                </p>
                <h1 className="text-title font-extrabold tracking-[-0.02em] sm:text-4xl">
                    Conecte o seu Claude
                </h1>
                <p className="text-muted-foreground">
                    Os Formatos Virais usam o seu Claude para editar os vídeos. Você conecta uma vez
                    e pronto. Os Cortes funcionam mesmo sem essa etapa.
                </p>
            </header>
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <ConnectionPicture isConnected={connectedAt !== null} />
                <section
                    aria-labelledby="how-to-connect"
                    className="grid gap-4 rounded-2xl border border-card-border p-6"
                >
                    <h2 id="how-to-connect" className="text-lg font-bold">
                        Como conectar
                    </h2>
                    {connection === undefined && connectionQuery.isError === false && (
                        <Skeleton className="h-56 w-full rounded-xl" />
                    )}
                    {connection === undefined && connectionQuery.isError === true && (
                        <ConnectionLoadError onRetry={() => connectionQuery.refetch()} />
                    )}
                    {connection !== undefined && <ConnectionPanel connection={connection} />}
                </section>
            </div>
        </div>
    );
}
