import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    action?: ReactNode;
}

/** The title block every console page starts with. */
export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-[30px] font-extrabold tracking-tight">{title}</h1>
                <p className="mt-1 max-w-prose text-muted-foreground">{description}</p>
            </div>
            {action}
        </header>
    );
}
