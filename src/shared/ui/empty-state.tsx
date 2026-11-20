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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center">
            {art}
            <p className="text-lg font-extrabold">{title}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
            {action !== undefined && <div className="mt-2">{action}</div>}
        </div>
    );
}
