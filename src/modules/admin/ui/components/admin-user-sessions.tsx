import MonitorSmartphoneIcon from "~icons/lucide/monitor-smartphone";
import type { ReactNode } from "react";
import type { AdminSessionView } from "#/modules/admin/model/admin-views";
import { formatDateTime } from "#/shared/ui/format";

const UNKNOWN_DEVICE = "Aparelho desconhecido";
const MAX_USER_AGENT_LENGTH = 90;

/** The raw user agent is long and noisy; its start is enough to tell two devices apart. */
function describeDevice(userAgent: string | null): string {
    if (userAgent === null || userAgent.trim().length === 0) {
        return UNKNOWN_DEVICE;
    }

    if (userAgent.length <= MAX_USER_AGENT_LENGTH) {
        return userAgent;
    }

    return `${userAgent.slice(0, MAX_USER_AGENT_LENGTH)}…`;
}

function describeSession(session: AdminSessionView): string {
    const parts = [`Entrou em ${formatDateTime(session.createdAt)}`];

    if (session.ipAddress !== null) {
        parts.push(`IP ${session.ipAddress}`);
    }

    if (session.isImpersonation === true) {
        parts.push("Aberta por um admin");
    }

    return parts.join(" · ");
}

export function AdminUserSessions({ sessions }: { sessions: Array<AdminSessionView> }): ReactNode {
    if (sessions.length === 0) {
        return (
            <p className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                Nenhuma sessão ativa. A pessoa não está conectada em nenhum aparelho.
            </p>
        );
    }

    return (
        <ul className="rounded-2xl border bg-popover px-4 sm:px-5">
            {sessions.map((session) => (
                <li
                    key={session.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b py-3 last:border-b-0"
                >
                    <MonitorSmartphoneIcon
                        aria-hidden="true"
                        className="mt-0.5 size-5 text-muted-foreground"
                    />
                    <div className="grid min-w-0 gap-0.5">
                        <p className="text-sm [overflow-wrap:anywhere]">
                            {describeDevice(session.userAgent)}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                            {describeSession(session)}
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    );
}
