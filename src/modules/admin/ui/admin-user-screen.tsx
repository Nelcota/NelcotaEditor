import ChevronLeftIcon from "~icons/lucide/chevron-left";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { AdminUserDetails } from "#/modules/admin/admin-views";
import { formatCount } from "#/modules/admin/ui/admin-format";
import { adminUserQueryOptions } from "#/modules/admin/ui/admin-queries";
import { AdminLoadError, AdminLoading } from "#/modules/admin/ui/admin-states";
import { AdminUserActions } from "#/modules/admin/ui/admin-user-actions";
import { AdminUserBadges } from "#/modules/admin/ui/admin-user-badges";
import { AdminUserSessions } from "#/modules/admin/ui/admin-user-sessions";
import { AdminUserVideos } from "#/modules/admin/ui/admin-user-videos";
import { UserAvatar } from "#/modules/auth/ui/user-avatar";
import { formatBytes, formatDate, formatDateTime } from "#/shared/ui/format";

function BanNotice({ details }: { details: AdminUserDetails }): ReactNode {
    if (details.user.isBanned === false) {
        return null;
    }

    const parts = ["Conta bloqueada"];

    if (details.banReason !== null) {
        parts.push(`Motivo: ${details.banReason}`);
    }

    if (details.banExpiresAt !== null) {
        parts.push(`Até ${formatDateTime(details.banExpiresAt)}`);
    }

    return (
        <p className="max-w-prose rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {parts.join(" · ")}
        </p>
    );
}

function ProfileHeader({ details }: { details: AdminUserDetails }): ReactNode {
    const user = details.user;

    return (
        <div className="flex flex-wrap items-center gap-4">
            <UserAvatar name={user.name} image={user.image} className="size-16 text-xl" />
            <div className="grid min-w-0 flex-[1_1_16rem] gap-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
                        {user.name}
                    </h2>
                    <AdminUserBadges user={user} />
                </div>
                <p className="text-muted-foreground [overflow-wrap:anywhere]">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                    Conta criada em {formatDate(user.createdAt)}
                </p>
            </div>
        </div>
    );
}

function UsageFacts({ details }: { details: AdminUserDetails }): ReactNode {
    const user = details.user;
    const facts = [
        { label: "Vídeos", value: formatCount(user.videoCount) },
        { label: "Processando agora", value: formatCount(details.workingVideoCount) },
        { label: "Cortes prontos", value: formatCount(details.readyClipCount) },
        {
            label: "Espaço usado",
            value: `${formatBytes(user.storageBytes)} de ${formatBytes(details.storageQuotaBytes)}`,
        },
    ];

    return (
        <dl className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
            {facts.map((fact) => (
                <div
                    key={fact.label}
                    className="grid gap-1 rounded-2xl border bg-popover p-4 sm:p-5"
                >
                    <dt className="text-sm font-medium text-muted-foreground">{fact.label}</dt>
                    <dd className="text-lg font-semibold tabular-nums">{fact.value}</dd>
                </div>
            ))}
        </dl>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
    return (
        <section className="grid gap-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            {children}
        </section>
    );
}

function UserDetails({ details }: { details: AdminUserDetails }): ReactNode {
    return (
        <div className="@container grid gap-8">
            <div className="grid gap-4">
                <ProfileHeader details={details} />
                <BanNotice details={details} />
                <AdminUserActions details={details} />
            </div>
            <UsageFacts details={details} />
            <Section title="Vídeos">
                <AdminUserVideos userId={details.user.id} />
            </Section>
            <Section title="Sessões ativas">
                <AdminUserSessions sessions={details.sessions} />
            </Section>
        </div>
    );
}

function BackLink(): ReactNode {
    return (
        <Link
            to="/admin/users"
            className="flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring"
        >
            <ChevronLeftIcon aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            Todas as contas
        </Link>
    );
}

function UserContent({ userId }: { userId: string }): ReactNode {
    const userQuery = useQuery(adminUserQueryOptions(userId));
    const details = userQuery.data;

    if (userQuery.isError === true && details === undefined) {
        return (
            <AdminLoadError
                title="Não foi possível abrir esta conta"
                message="Ela pode ter sido excluída. Volte para a lista ou tente de novo."
                onRetry={async () => {
                    await userQuery.refetch();
                }}
            />
        );
    }

    if (details === undefined) {
        return <AdminLoading label="Carregando a conta" />;
    }

    return <UserDetails details={details} />;
}

export function AdminUserScreen({ userId }: { userId: string }): ReactNode {
    return (
        <div className="grid gap-6">
            <BackLink />
            <UserContent userId={userId} />
        </div>
    );
}
