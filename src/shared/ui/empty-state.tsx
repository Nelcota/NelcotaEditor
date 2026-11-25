import type { ReactNode } from "react";

interface EmptyStateProps {
    art: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
    /** Extra content between the description and the action, such as a short how-it-works. */
    children?: ReactNode;
}

/** The one empty/error placeholder used across the app, so they never drift apart. */
export function EmptyState({ art, title, description, action, children }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-card-border bg-muted px-6 py-14 text-center">
            {art}
            <p className="text-lg font-medium tracking-tight text-balance [overflow-wrap:anywhere]">
                {title}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground [overflow-wrap:anywhere]">
                {description}
            </p>
            {children}
            {action !== undefined && <div className="mt-2">{action}</div>}
        </div>
    );
}
