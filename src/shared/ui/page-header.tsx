import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    action?: ReactNode;
}

/** The title block every console page starts with. */
export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        // Wraps by the space it has, not the window: with the sidebar open the action moves below
        // instead of squeezing the description into a narrow column.
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0 flex-[1_1_20rem]">
                <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
                <p className="mt-1 max-w-prose text-muted-foreground">{description}</p>
            </div>
            {action}
        </header>
    );
}
