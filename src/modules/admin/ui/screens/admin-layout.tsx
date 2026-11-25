import ChartColumnBigIcon from "~icons/lucide/chart-column-big";
import UsersRoundIcon from "~icons/lucide/users-round";
import SquarePlayIcon from "~icons/lucide/square-play";
import ToggleRightIcon from "~icons/lucide/toggle-right";
import { Link, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { IconComponent } from "#/shared/ui/icon-component";
import { PageHeader } from "#/shared/ui/page-header";

type AdminPath = "/admin" | "/admin/users" | "/admin/videos" | "/admin/features";

interface AdminTab {
    path: AdminPath;
    label: string;
    icon: IconComponent;
    /** The overview is the index route, so only an exact match selects it. */
    isExact: boolean;
}

const ADMIN_TABS: ReadonlyArray<AdminTab> = [
    { path: "/admin", label: "Visão geral", icon: ChartColumnBigIcon, isExact: true },
    { path: "/admin/users", label: "Usuários", icon: UsersRoundIcon, isExact: false },
    { path: "/admin/videos", label: "Vídeos", icon: SquarePlayIcon, isExact: false },
    { path: "/admin/features", label: "Recursos", icon: ToggleRightIcon, isExact: false },
];

const TAB_CLASS =
    "-mb-px flex min-h-11 items-center gap-2 border-b-2 border-transparent text-sm font-semibold text-muted-foreground outline-none transition-[color,border-color,box-shadow,scale] hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] aria-[current=page]:border-foreground aria-[current=page]:text-foreground [&>svg]:size-5";

function AdminNav(): ReactNode {
    return (
        <nav
            aria-label="Seções do admin"
            // Tabs without side padding, like the video page tabs: the first label starts on the
            // page's text line and the underline spans exactly the label.
            className="flex gap-6 overflow-x-auto overflow-y-hidden border-b"
        >
            {ADMIN_TABS.map((tab) => {
                const Icon = tab.icon;

                return (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        activeOptions={{ exact: tab.isExact, includeSearch: false }}
                        className={TAB_CLASS}
                    >
                        <Icon aria-hidden="true" />
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}

/** Every admin page: the title, the sections and the page itself. */
export function AdminLayout(): ReactNode {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <div className="grid gap-6">
                <PageHeader
                    title="Admin"
                    description="Contas, vídeos, recursos e a saúde do processamento em todo o Nelcota."
                />
                <AdminNav />
            </div>
            <Outlet />
        </div>
    );
}
