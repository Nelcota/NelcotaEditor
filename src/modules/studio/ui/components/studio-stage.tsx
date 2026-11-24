import LockKeyholeIcon from "~icons/lucide/lock-keyhole";
import type { ReactNode, RefObject } from "react";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { RenderingOverlay } from "#/modules/studio/ui/components/studio-notices";
import { StudioPreview } from "#/modules/studio/ui/components/studio-preview";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";
import type { StudioPlayback } from "#/modules/studio/ui/hooks/use-studio-playback";
import { toCaptionsUrl } from "#/modules/transcription/model/captions-url";

interface StudioStageProps {
    video: VideoSummary;
    editor: StudioEditor;
    videoRef: RefObject<HTMLVideoElement | null>;
    playback: StudioPlayback;
    isRendering: boolean;
}

/**
 * The live preview on a dark stage, as large as the space allows: the clip is judged the way it
 * will be watched, in a dark feed, whatever the app's theme.
 */
export function StudioStage({
    video,
    editor,
    playback,
    isRendering,
    ...props
}: StudioStageProps): ReactNode {
    return (
        <section
            aria-label="Prévia do corte"
            className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] justify-items-center gap-3 bg-stage p-4 text-stage-foreground @4xl/studio:p-6"
        >
            {/* A size container: the preview reads both sides to fit its shape. */}
            <div
                className="grid h-[min(58dvh,560px)] w-full place-items-center @4xl/studio:h-full"
                style={{ containerType: "size" }}
            >
                <StudioPreview
                    draft={editor.draft}
                    videoRef={props.videoRef}
                    playback={playback}
                    sourceUrl={video.originalFileUrl}
                    captionsUrl={toCaptionsUrl(video.id)}
                    overlay={
                        isRendering === true && (
                            <RenderingOverlay progressPercent={video.progressPercent} />
                        )
                    }
                />
            </div>
            {isRendering === true && (
                <p className="flex items-center gap-2 text-xs">
                    <LockKeyholeIcon className="size-4 shrink-0" aria-hidden="true" />A edição volta
                    quando o corte ficar pronto. Pode sair desta página.
                </p>
            )}
        </section>
    );
}
