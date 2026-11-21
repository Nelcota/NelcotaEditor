import ChartSquareIcon from "~icons/solar/chart-square-linear";
import UsersGroupRoundedIcon from "~icons/solar/users-group-rounded-linear";
import VideoLibraryIcon from "~icons/solar/video-library-linear";
import { Link, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { IconComponent } from "#/shared/ui/icon-component";
import { PageHeader } from "#/shared/ui/page-header";

type AdminPath = "/admin" | "/admin/users" | "/admin/videos";

interface AdminTab {
    path: AdminPath;
    label: string;
    icon: IconComponent;
    /** The overview is the index route, so only an exact match selects it. */
    isExact: boolean;
}

const ADMIN_TABS: ReadonlyArray<AdminTab> = [
    { path: "/admin", label: "Visão geral", icon: ChartSquareIcon, isExact: true },
    { path: "/admin/users", label: "Usuários", icon: UsersGroupRoundedIcon, isExact: false },
    { path: "/admin/videos", label: "Vídeos", icon: VideoLibraryIcon, isExact: false },
];

const TAB_CLASS =
    "-mb-px flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-semibold text-muted-foreground outline-none transition-[color,border-color,box-shadow,scale] hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99] aria-[current=page]:border-primary aria-[current=page]:text-foreground [&>svg]:size-5";

function AdminNav(): ReactNode {
    return (
        <nav
            aria-label="Seções do admin"
            className="flex gap-1 overflow-x-auto overflow-y-hidden border-b"
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

/** Every admin page: the title, the three sections and the page itself. */
export function AdminLayout(): ReactNode {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <div className="grid gap-6">
                <PageHeader
                    title="Admin"
                    description="Contas, vídeos e a saúde do processamento em todo o Nelcota."
                />
                <AdminNav />
            </div>
            <Outlet />
        </div>
    );
}
