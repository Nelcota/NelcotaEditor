import { useId } from "react";
import type { ReactNode } from "react";

interface SettingsGroupProps {
    title: string;
    /** One short line under the title, when the group needs saying what it is for. */
    description?: string;
    children: ReactNode;
}

/** A titled list of settings rows in one bordered box; the rows divide themselves. */
export function SettingsGroup({ title, description, children }: SettingsGroupProps): ReactNode {
    const titleId = useId();

    return (
        <section aria-labelledby={titleId} className="grid gap-3">
            <div className="grid gap-0.5 px-1">
                <h2
                    id={titleId}
                    className="text-sm font-bold tracking-eyebrow text-muted-foreground uppercase"
                >
                    {title}
                </h2>
                {description !== undefined && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="divide-y overflow-hidden rounded-2xl border">{children}</div>
        </section>
    );
}
