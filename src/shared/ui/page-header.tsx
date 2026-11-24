import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    action?: ReactNode;
}

/**
 * The reference names the page in the breadcrumb, not in a big title: the heading and its line stay
 * for screen readers, and only the page's controls show, on the leading side.
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
    if (action === undefined) {
        return (
            <>
                <h1 className="sr-only">{title}</h1>
                <p className="sr-only">{description}</p>
            </>
        );
    }

    return (
        <header className="flex flex-wrap items-center gap-2">
            <h1 className="sr-only">{title}</h1>
            <p className="sr-only">{description}</p>
            {action}
        </header>
    );
}
