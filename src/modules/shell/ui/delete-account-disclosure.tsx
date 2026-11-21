import AltArrowDownIcon from "~icons/solar/alt-arrow-down-linear";
import type { ReactNode } from "react";
import { DeleteAccountSection } from "#/modules/auth/ui/delete-account-section";

interface DeleteAccountDisclosureProps {
    summary: string;
    art?: ReactNode;
}

/** The way out stays on the page but folded, so it never sits in the middle of everyday settings. */
export function DeleteAccountDisclosure({ summary, art }: DeleteAccountDisclosureProps): ReactNode {
    return (
        <details className="group grid gap-4 border-t pt-6">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99] [&::-webkit-details-marker]:hidden">
                {art}
                {summary}
                <AltArrowDownIcon
                    aria-hidden="true"
                    className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
            </summary>
            <div className="pt-4">
                <DeleteAccountSection />
            </div>
        </details>
    );
}
