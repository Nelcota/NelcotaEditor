import WifiOffIcon from "~icons/lucide/wifi-off";
import type { ReactNode } from "react";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { ClipDownloadLink } from "#/modules/videos/ui/components/clip-download-link";
import { RetryClipButton } from "#/modules/videos/ui/components/retry-clip-button";
import { StageCrewMascot } from "#/modules/videos/ui/components/stage-crew-mascot";
import { Progress } from "#/shared/ui/progress";

/** Covers the preview while Brasa renders the clip again. */
export function RenderingOverlay({ progressPercent }: { progressPercent: number }): ReactNode {
    return (
        <div
            role="status"
            className="absolute inset-0 z-30 grid content-center justify-items-center gap-2.5 bg-background/95 p-6 text-center"
        >
            <StageCrewMascot status="rendering" isWorking className="size-12" />
            <p className="font-semibold">Brasa está refazendo o corte</p>
            <Progress value={progressPercent} className="w-4/5" />
            <p className="text-xs text-muted-foreground tabular-nums">
                {progressPercent}% do total
            </p>
        </div>
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
                <span className="font-semibold">Não foi possível refazer o corte.</span>{" "}
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
                <span className="font-semibold">Corte refeito.</span>{" "}
                <span className="text-muted-foreground">O arquivo para baixar já é o novo.</span>
            </p>
            <ClipDownloadLink clip={clip} label="Baixar corte" emphasis="secondary" />
        </div>
    );
}

export function OfflineNotice(): ReactNode {
    return (
        <div
            role="status"
            className="flex items-center gap-3 rounded-xl border bg-popover px-4 py-3 text-sm"
        >
            <WifiOffIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p>
                <span className="font-semibold">Sem conexão.</span>{" "}
                <span className="text-muted-foreground">
                    Pode continuar editando: as alterações ficam neste navegador e são salvas quando
                    a conexão voltar.
                </span>
            </p>
        </div>
    );
}
