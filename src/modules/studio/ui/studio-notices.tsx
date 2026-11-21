import CloseCircleIcon from "~icons/solar/close-circle-linear";
import KeyboardIcon from "~icons/solar/keyboard-linear";
import LockKeyholeIcon from "~icons/solar/lock-keyhole-minimalistic-linear";
import WiFiOffIcon from "~icons/solar/wi-fi-off-linear";
import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/clip-view";
import { ClipDownloadLink } from "#/modules/videos/ui/clip-download-link";
import { RetryClipButton } from "#/modules/videos/ui/retry-clip-button";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { Progress } from "#/shared/ui/progress";
import { useStoredFlag } from "#/shared/ui/use-stored-flag";

const SHORTCUTS_DISMISSED_KEY = "nelcota:studio-shortcuts-dismissed";

/** Covers the preview while Brasa renders the clip again. */
export function RenderingOverlay({ progressPercent }: { progressPercent: number }): ReactNode {
    return (
        <div
            role="status"
            className="absolute inset-0 z-30 grid content-center justify-items-center gap-2.5 bg-background/95 p-6 text-center"
        >
            <StageCrewMascot status="rendering" isWorking className="size-12" />
            <p className="font-bold">Brasa está refazendo o corte</p>
            <Progress value={progressPercent} className="w-4/5" />
            <p className="text-xs text-muted-foreground tabular-nums">
                {progressPercent}% do total
            </p>
        </div>
    );
}

export function LockedHint(): ReactNode {
    return (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <LockKeyholeIcon className="size-4 shrink-0" aria-hidden="true" />A edição volta quando
            o corte ficar pronto. Pode sair desta página.
        </p>
    );
}

interface RenderFailedBannerProps {
    videoId: string;
    clip: ClipView;
}

/** The last render of this clip failed; the edits are kept, so trying again is one click. */
export function RenderFailedBanner({ videoId, clip }: RenderFailedBannerProps): ReactNode {
    return (
        <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3"
        >
            <StageCrewMascot status="failed" className="size-8" />
            <p className="min-w-0 flex-1 text-sm">
                <span className="font-bold">Não foi possível refazer o corte.</span>{" "}
                <span className="text-muted-foreground">
                    Guarda barrou a renderização. Suas alterações continuam aqui.
                </span>
            </p>
            <RetryClipButton
                videoId={videoId}
                clipId={clip.id}
                isDisabled={false}
                variant="outline"
            />
        </div>
    );
}

export function RenderedNotice({ clip }: { clip: ClipView }): ReactNode {
    return (
        <div
            role="status"
            className="flex flex-wrap items-center gap-3 rounded-xl border bg-popover px-4 py-3 text-sm"
        >
            <StageCrewMascot status="done" className="size-7" />
            <p className="flex-1">
                <span className="font-bold">Corte refeito.</span>{" "}
                <span className="text-muted-foreground">O arquivo para baixar já é o novo.</span>
            </p>
            <ClipDownloadLink clip={clip} label="Baixar" emphasis="secondary" />
        </div>
    );
}

export function OfflineNotice(): ReactNode {
    return (
        <div
            role="status"
            className="flex items-center gap-3 rounded-xl border bg-popover px-4 py-3 text-sm"
        >
            <WiFiOffIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p>
                <span className="font-bold">Sem conexão.</span>{" "}
                <span className="text-muted-foreground">
                    Pode continuar editando: as alterações ficam neste navegador e são salvas quando
                    a conexão voltar.
                </span>
            </p>
        </div>
    );
}

/** Shown until closed once: the keys that make editing quick. */
export function ShortcutsHint(): ReactNode {
    const dismissed = useStoredFlag(SHORTCUTS_DISMISSED_KEY);

    if (dismissed.isOn === true) {
        return null;
    }

    return (
        <div className="hidden items-center gap-3 rounded-xl border bg-popover px-4 py-2 text-sm @4xl/studio:flex">
            <KeyboardIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="flex-1 text-muted-foreground">
                <span className="font-bold text-foreground">Atalhos:</span> Espaço tocar · J e L
                voltam e avançam 5 s · [ e ] marcam início e fim · Ctrl+Z desfaz
            </p>
            <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Fechar os atalhos"
                onClick={dismissed.toggle}
            >
                <CloseCircleIcon aria-hidden="true" />
            </Button>
        </div>
    );
}
