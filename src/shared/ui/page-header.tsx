import type { ReactNode } from "react";

interface PageHeaderProps {
    /** Short mono label above the title, wrapped in blue brackets as on the landing page. */
    eyebrow: string;
    title: string;
    description: string;
    action?: ReactNode;
}

/** The title block every console page starts with. */
export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
    return (
        // Wraps by the space it has, not the window: with the sidebar open the action moves below
        // instead of squeezing the description into a narrow column.
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0 flex-[1_1_20rem]">
                <p className="eyebrow">{eyebrow}</p>
                <h1 className="mt-3 text-heading font-normal tracking-[-0.04em] sm:text-heading-md">
                    {title}
                </h1>
                <p className="mt-2 max-w-prose text-muted-foreground">{description}</p>
            </div>
            {action}
        </header>
    );
}
