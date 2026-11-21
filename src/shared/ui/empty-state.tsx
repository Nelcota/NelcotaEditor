import type { ReactNode } from "react";

interface EmptyStateProps {
    art: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}

/** The one empty/error placeholder used across the app, so they never drift apart. */
export function EmptyState({ art, title, description, action }: EmptyStateProps) {
    return (
        <div className="relative isolate flex flex-col items-center gap-3 overflow-hidden rounded-md border border-card-border bg-card px-6 py-14 text-center">
            <div aria-hidden="true" className="absolute inset-0 -z-10 grid-backdrop" />
            {art}
            <p className="text-lg font-medium tracking-tight text-balance [overflow-wrap:anywhere]">
                {title}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground [overflow-wrap:anywhere]">
                {description}
            </p>
            {action !== undefined && <div className="mt-2">{action}</div>}
        </div>
    );
}
