import ChevronRightIcon from "~icons/lucide/chevron-right";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useBreadcrumbs } from "#/modules/shell/ui/hooks/use-breadcrumbs";
import type { Crumb } from "#/modules/shell/ui/hooks/use-breadcrumbs";
import { BrandMark } from "#/shared/ui/brand-logo";

function CrumbItem({ crumb, isLast }: { crumb: Crumb; isLast: boolean }): ReactNode {
    const to = crumb.to;

    if (isLast === true || to === undefined) {
        return (
            <span aria-current="page" className="min-w-0 truncate font-semibold text-foreground">
                {crumb.label}
            </span>
        );
    }

    return (
        <Link
            to={to}
            className="shrink-0 rounded-md text-muted-foreground outline-none transition-[color,scale] hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
        >
            {crumb.label}
        </Link>
    );
}

/**
 * The top of the panel: the breadcrumb on the leading side and the page's own tools trailing.
 * Phones, without the sidebar, start it with the brand mark.
 */
export function PageBar({ children }: { children?: ReactNode }): ReactNode {
    const crumbs = useBreadcrumbs();
    const lastIndex = crumbs.length - 1;

    return (
        <div className="flex h-14 shrink-0 items-center gap-3 ps-4 pe-2 md:ps-8 md:pe-6">
            <Link
                to="/"
                aria-label="Editor Oculto, ir para o início"
                className="shrink-0 rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-ring md:hidden"
            >
                <BrandMark className="h-6" isAnimated />
            </Link>
            <nav aria-label="Você está em" className="min-w-0 flex-1">
                <ol className="flex min-w-0 items-center gap-2 text-sm">
                    {crumbs.map((crumb, index) => (
                        <li
                            key={`${crumb.to ?? "current"}-${crumb.label}`}
                            className="flex shrink-0 items-center gap-2 last:min-w-0 last:shrink"
                        >
                            {index > 0 && (
                                <ChevronRightIcon
                                    aria-hidden="true"
                                    className="size-3.5 shrink-0 text-muted-foreground"
                                />
                            )}
                            <CrumbItem crumb={crumb} isLast={index === lastIndex} />
                        </li>
                    ))}
                </ol>
            </nav>
            <div className="flex shrink-0 items-center gap-1">{children}</div>
        </div>
    );
}
