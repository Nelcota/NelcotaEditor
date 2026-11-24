import ChevronRightIcon from "~icons/lucide/chevron-right";
import type { ReactNode } from "react";
import type { IconComponent } from "#/shared/ui/icon-component";
import { cn } from "#/shared/ui/cn";

// Rows: 16px in on both sides, a 20px icon, the label 12px after it. Every row in a card is 56px.
const ROW_CLASS =
    "flex min-h-14 w-full items-center gap-3 px-4 py-2 text-start text-base outline-none [&>svg:first-child]:size-5 [&>svg:first-child]:shrink-0";

const ACTION_ROW_CLASS =
    "transition-colors hover:bg-foreground/[0.03] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface RowContentProps {
    icon: IconComponent;
    label: string;
    value?: string;
    hasChevron?: boolean;
}

/** Icon, label, the value on the trailing side and, when the row leads somewhere, a chevron. */
export function InspectorRowContent({ icon, label, value, hasChevron = false }: RowContentProps) {
    const Icon = icon;

    return (
        <>
            <Icon aria-hidden="true" />
            <span className="min-w-0 flex-1 font-medium">{label}</span>
            {value !== undefined && (
                <span className="min-w-0 truncate text-sm text-muted-foreground tabular-nums">
                    {value}
                </span>
            )}
            {hasChevron === true && (
                <ChevronRightIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground"
                />
            )}
        </>
    );
}

export function InspectorRow(props: RowContentProps): ReactNode {
    return (
        <li className={ROW_CLASS}>
            <InspectorRowContent {...props} />
        </li>
    );
}

interface InspectorButtonRowProps extends RowContentProps {
    onClick: () => void;
    isDisabled?: boolean;
    isDestructive?: boolean;
}

export function InspectorButtonRow(props: InspectorButtonRowProps): ReactNode {
    const { onClick, isDisabled = false, isDestructive = false, ...content } = props;

    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                disabled={isDisabled}
                className={cn(
                    ROW_CLASS,
                    ACTION_ROW_CLASS,
                    isDestructive === true && "text-destructive",
                )}
            >
                <InspectorRowContent {...content} />
            </button>
        </li>
    );
}

/** The class a link row uses, so routes and downloads can render their own anchors. */
export const INSPECTOR_LINK_ROW_CLASS = cn(ROW_CLASS, ACTION_ROW_CLASS);

interface InspectorGroupProps {
    title: string;
    children: ReactNode;
}

/** A titled group of rows on one white card, as in a settings list. */
export function InspectorGroup({ title, children }: InspectorGroupProps): ReactNode {
    return (
        <section aria-label={title} className="grid gap-2">
            <h3 className="px-1 text-sm text-muted-foreground">{title}</h3>
            <ul className="divide-y overflow-hidden rounded-2xl border bg-background shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
                {children}
            </ul>
        </section>
    );
}
