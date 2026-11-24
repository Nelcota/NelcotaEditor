import type { ReactNode } from "react";

export interface LossItem {
    label: string;
    detail: string;
}

/** What a permanent action takes away, one row per thing, so nothing is a surprise later. */
export function LossList({ items }: { items: ReadonlyArray<LossItem> }): ReactNode {
    return (
        <ul className="grid gap-2">
            {items.map((item) => (
                <li
                    key={item.label}
                    className="flex items-baseline justify-between gap-4 rounded-xl bg-card px-4 py-3 text-sm"
                >
                    <span className="font-medium">{item.label}</span>
                    <span className="text-end text-muted-foreground">{item.detail}</span>
                </li>
            ))}
        </ul>
    );
}
