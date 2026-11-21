import type { ReactNode } from "react";

interface AccountSectionHeadingProps {
    id: string;
    title: string;
    description?: string;
    art?: ReactNode;
}

/** A section title with an optional line under it and an optional character beside it. */
export function AccountSectionHeading({
    id,
    title,
    description,
    art,
}: AccountSectionHeadingProps): ReactNode {
    return (
        <div className="flex items-center gap-3">
            {art}
            <div className="min-w-0">
                <h2 id={id} className="text-lg leading-tight font-semibold text-balance">
                    {title}
                </h2>
                {description !== undefined && (
                    <p className="text-sm text-pretty text-muted-foreground">{description}</p>
                )}
            </div>
        </div>
    );
}
