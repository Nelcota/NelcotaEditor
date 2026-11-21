import WifiOffIcon from "~icons/lucide/wifi-off";
import type { ReactNode } from "react";
import { useIsOnline } from "#/shared/ui/use-is-online";

/**
 * The status region stays mounted and only its text changes: a region inserted already holding
 * its text is often not announced. Empty, it is hidden from sight but kept in the page.
 */
export function OfflineBanner(): ReactNode {
    const isOnline = useIsOnline();

    return (
        <div
            role="status"
            data-empty={isOnline}
            className="flex items-center gap-2.5 rounded-lg bg-muted px-4 py-2.5 text-sm data-[empty=true]:sr-only"
        >
            {isOnline === false && (
                <>
                    <WifiOffIcon
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                    />
                    Sem conexão. O progresso dos vídeos volta a atualizar quando a internet voltar.
                </>
            )}
        </div>
    );
}
