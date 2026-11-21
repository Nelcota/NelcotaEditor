import type { ReactNode, RefObject } from "react";
import type { CaptionWord } from "#/modules/clips/clip-studio.schema";
import type { VideoSummary } from "#/modules/videos/video-views";
import { CaptionList } from "#/modules/studio/ui/caption-list";
import { MobileTrim } from "#/modules/studio/ui/mobile-trim";
import { LockedHint, RenderingOverlay } from "#/modules/studio/ui/studio-notices";
import { StudioPreview } from "#/modules/studio/ui/studio-preview";
import { StudioStylePanel } from "#/modules/studio/ui/studio-style-panel";
import type { StudioEditor } from "#/modules/studio/ui/use-studio-editor";
import type { StudioPlayback } from "#/modules/studio/ui/use-studio-playback";
import { cn } from "#/shared/ui/cn";
import { SegmentedControl } from "#/shared/ui/segmented-control";

export type PhonePanel = "captions" | "style" | "trim";

const PHONE_PANELS = [
    { value: "captions", label: "Legendas" },
    { value: "style", label: "Estilo" },
    { value: "trim", label: "Trecho" },
] as const;

interface StudioPanelsProps {
    video: VideoSummary;
    editor: StudioEditor;
    words: Array<CaptionWord>;
    videoRef: RefObject<HTMLVideoElement | null>;
    playback: StudioPlayback;
    videoDurationSeconds: number;
    isRendering: boolean;
    playingIndex: number;
    openIndex: number | null;
    onOpenCue: (index: number | null) => void;
    phonePanel: PhonePanel;
    onPhonePanelChange: (panel: PhonePanel) => void;
}

/**
 * Style, live preview and captions side by side on wide screens; on phones the preview stays and
 * one of the other panels shows at a time, picked with the segmented control.
 */
export function StudioPanels(props: StudioPanelsProps): ReactNode {
    const { video, editor, playback, isRendering, phonePanel } = props;

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 @4xl/studio:grid-cols-[260px_minmax(0,1fr)_360px]">
            <div
                className={cn(
                    "order-3 @4xl/studio:order-1 @4xl/studio:block",
                    phonePanel !== "style" && "hidden",
                )}
            >
                <StudioStylePanel editor={editor} isLocked={isRendering} />
            </div>
            <div className="order-1 grid justify-items-center gap-2 @4xl/studio:order-2">
                <StudioPreview
                    draft={editor.draft}
                    videoRef={props.videoRef}
                    playback={playback}
                    sourceUrl={video.originalFileUrl}
                    overlay={
                        isRendering === true && (
                            <RenderingOverlay progressPercent={video.progressPercent} />
                        )
                    }
                />
                {isRendering === true && <LockedHint />}
            </div>
            <SegmentedControl
                label="Parte do Studio"
                value={phonePanel}
                options={PHONE_PANELS}
                onValueChange={props.onPhonePanelChange}
                className="order-2 @4xl/studio:hidden"
            />
            <CaptionList
                editor={editor}
                words={props.words}
                playingIndex={props.playingIndex}
                openIndex={props.openIndex}
                onOpen={props.onOpenCue}
                onSeek={playback.seek}
                isLocked={isRendering}
                className={cn(
                    "order-3 max-h-[70dvh] @4xl/studio:flex @4xl/studio:h-[600px]",
                    phonePanel !== "captions" && "hidden",
                )}
            />
            <div className={cn("order-3 @4xl/studio:hidden", phonePanel !== "trim" && "hidden")}>
                <MobileTrim
                    editor={editor}
                    videoDurationSeconds={props.videoDurationSeconds}
                    readCurrentSeconds={playback.clock.read}
                    isLocked={isRendering}
                />
            </div>
        </div>
    );
}
