import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { AdminOverview } from "#/modules/admin/admin-views";
import { formatCount, formatHours } from "#/modules/admin/ui/admin-format";
import { adminOverviewQueryOptions } from "#/modules/admin/ui/admin-queries";
import { AdminLoadError, AdminLoading } from "#/modules/admin/ui/admin-states";
import { AdminUserList } from "#/modules/admin/ui/admin-user-list";
import { AdminVideoList } from "#/modules/admin/ui/admin-video-list";
import { cn } from "#/shared/ui/cn";
import { formatBytes } from "#/shared/ui/format";

interface StatProps {
    label: string;
    value: string;
    note: string;
    isAlert?: boolean;
}

function Stat({ label, value, note, isAlert = false }: StatProps): ReactNode {
    return (
        <div className="grid content-start gap-1 rounded-2xl border bg-popover p-4 sm:p-5">
            <p className="text-sm font-semibold text-muted-foreground">{label}</p>
            <p
                className={cn(
                    "text-2xl font-extrabold tracking-tight whitespace-nowrap tabular-nums",
                    isAlert === true && "text-destructive",
                )}
            >
                {value}
            </p>
            <p className="text-xs text-muted-foreground">{note}</p>
        </div>
    );
}

function TotalsGrid({ overview }: { overview: AdminOverview }): ReactNode {
    const recent = `nos últimos ${overview.recentDays} dias`;

    return (
        <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
            <Stat
                label="Contas"
                value={formatCount(overview.userCount)}
                note={`+${formatCount(overview.newUserCount)} ${recent}`}
            />
            <Stat
                label="Vídeos enviados"
                value={formatCount(overview.videoCount)}
                note={`+${formatCount(overview.newVideoCount)} ${recent}`}
            />
            <Stat
                label="Cortes prontos"
                value={formatCount(overview.readyClipCount)}
                note={`+${formatCount(overview.newClipCount)} ${recent}`}
            />
            <Stat
                label="Espaço em disco"
                value={formatBytes(overview.storageBytes)}
                note={`Limite de ${formatBytes(overview.storageQuotaBytes)} por conta`}
            />
        </div>
    );
}

function PipelineGrid({ overview }: { overview: AdminOverview }): ReactNode {
    return (
        <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
            <Stat
                label="Na fila"
                value={formatCount(overview.queuedVideoCount)}
                note="Esperando o worker"
            />
            <Stat
                label="Processando"
                value={formatCount(overview.workingVideoCount)}
                note="Em alguma etapa agora"
            />
            <Stat
                label="Falharam"
                value={formatCount(overview.failedVideoCount)}
                note="Vídeos parados com erro"
                isAlert={overview.failedVideoCount > 0}
            />
            <Stat
                label="Vídeo processado"
                value={formatHours(overview.processedSeconds)}
                note={`${formatCount(overview.adminCount)} admins · ${formatCount(overview.bannedUserCount)} contas bloqueadas`}
            />
        </div>
    );
}

interface PanelProps {
    title: string;
    link: ReactNode;
    children: ReactNode;
}

function Panel({ title, link, children }: PanelProps): ReactNode {
    return (
        <section className="grid content-start gap-4">
            <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-bold">{title}</h2>
                {link}
            </div>
            {children}
        </section>
    );
}

const PANEL_LINK_CLASS =
    "rounded-sm text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring/70";

function RecentFailures({ overview }: { overview: AdminOverview }): ReactNode {
    const failures = overview.recentFailures;

    return (
        <Panel
            title="Falhas recentes"
            link={
                <Link to="/admin/videos" search={{ filter: "failed" }} className={PANEL_LINK_CLASS}>
                    Ver todas
                </Link>
            }
        >
            {failures.length === 0 && (
                <p className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                    Nenhum vídeo falhou. Tudo certo por aqui.
                </p>
            )}
            {failures.length > 0 && <AdminVideoList videos={failures} showOwner={true} />}
        </Panel>
    );
}

function TopStorageUsers({ overview }: { overview: AdminOverview }): ReactNode {
    return (
        <Panel
            title="Contas que mais usam espaço"
            link={
                <Link to="/admin/users" className={PANEL_LINK_CLASS}>
                    Ver contas
                </Link>
            }
        >
            <AdminUserList users={overview.topStorageUsers} />
        </Panel>
    );
}

export function AdminOverviewScreen(): ReactNode {
    const overviewQuery = useQuery(adminOverviewQueryOptions());
    const overview = overviewQuery.data;

    if (overviewQuery.isError === true && overview === undefined) {
        return (
            <AdminLoadError
                title="Não foi possível carregar a visão geral"
                message="Tente de novo; se continuar, recarregue a página."
                onRetry={async () => {
                    await overviewQuery.refetch();
                }}
            />
        );
    }

    if (overview === undefined) {
        return <AdminLoading label="Carregando a visão geral" />;
    }

    return (
        <div className="@container grid gap-8">
            <section aria-label="Totais" className="grid gap-4">
                <TotalsGrid overview={overview} />
                <PipelineGrid overview={overview} />
            </section>
            <div className="grid gap-8 @5xl:grid-cols-2">
                <RecentFailures overview={overview} />
                <TopStorageUsers overview={overview} />
            </div>
        </div>
    );
}
