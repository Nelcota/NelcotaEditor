import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    action?: ReactNode;
}

/** The title block every console page starts with: title and one line on the left, controls trailing. */
export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        // Wraps by the space it has: a long action row moves below instead of squeezing the title.
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0 flex-[1_1_20rem]">
                <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em]">
                    {title}
                </h1>
                <p className="mt-1 max-w-prose text-meta text-muted-foreground">{description}</p>
            </div>
            {action}
        </header>
    );
}
