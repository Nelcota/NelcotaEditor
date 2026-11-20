import WiFiOffIcon from "~icons/solar/wi-fi-off-linear";
import { useIsOnline } from "#/shared/ui/use-is-online";

export function OfflineBanner() {
    const isOnline = useIsOnline();

    if (isOnline === true) {
        return null;
    }

    return (
        <div
            role="status"
            className="flex items-center gap-2.5 rounded-lg bg-muted px-4 py-2.5 text-sm"
        >
            <WiFiOffIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Sem conexão. O progresso dos vídeos volta a atualizar quando a internet voltar.
        </div>
    );
}
