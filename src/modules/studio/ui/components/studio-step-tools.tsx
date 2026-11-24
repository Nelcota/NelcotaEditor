import type { ReactNode } from "react";
import type { ClipStudioView } from "#/modules/studio/model/clip-studio-view";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { CaptionList } from "#/modules/studio/ui/components/caption-list";
import { MobileTrim } from "#/modules/studio/ui/components/mobile-trim";
import type { StudioStep } from "#/modules/studio/ui/components/studio-steps";
import { StudioStylePanel } from "#/modules/studio/ui/components/studio-style-panel";
import { StudioTimeline } from "#/modules/studio/ui/components/studio-timeline";
import { computeTimelineWindow } from "#/modules/studio/client/timeline-geometry";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";
import type { StudioPlayback } from "#/modules/studio/ui/hooks/use-studio-playback";
import type { TrimMarks } from "#/modules/studio/ui/hooks/use-trim-marks";

export interface StudioStepToolsProps {
    step: StudioStep;
    video: VideoSummary;
    studio: ClipStudioView;
    editor: StudioEditor;
    playback: StudioPlayback;
    marks: TrimMarks;
    videoDurationSeconds: number;
    /** Wide enough for the timeline; phones get the step buttons instead. */
    isDesktop: boolean;
    isRendering: boolean;
    playingIndex: number;
    openIndex: number | null;
    onOpenCue: (index: number | null) => void;
    /** Opens a caption from the timeline: it moves to the Legendas step and seeks there. */
    onOpenCueFromTimeline: (index: number) => void;
}

function TrimTools(props: StudioStepToolsProps): ReactNode {
    const { editor, studio, playback, marks, isRendering } = props;

    // Not just hidden on phones: the filmstrip loads ten videos that nobody would see.
    if (props.isDesktop === false) {
        return (
            <MobileTrim
                editor={editor}
                videoDurationSeconds={props.videoDurationSeconds}
                readCurrentSeconds={playback.clock.read}
                isLocked={isRendering}
            />
        );
    }

    return (
        <StudioTimeline
            editor={editor}
            window={computeTimelineWindow(
                editor.draft,
                editor.applied,
                studio.videoDurationSeconds,
            )}
            sourceUrl={props.video.originalFileUrl}
            videoDurationSeconds={props.videoDurationSeconds}
            clock={playback.clock}
            playingIndex={props.playingIndex}
            openIndex={props.openIndex}
            isLocked={isRendering}
            onOpen={props.onOpenCueFromTimeline}
            onSeek={playback.seek}
            onMarkStart={marks.markStart}
            onMarkEnd={marks.markEnd}
        />
    );
}

function CaptionTools(props: StudioStepToolsProps): ReactNode {
    return (
        <CaptionList
            editor={props.editor}
            words={props.studio.words}
            playingIndex={props.playingIndex}
            openIndex={props.openIndex}
            onOpen={props.onOpenCue}
            onSeek={props.playback.seek}
            isLocked={props.isRendering}
            className="max-h-[70dvh] min-h-80 flex-1 @4xl/studio:max-h-none"
        />
    );
}

function StyleTools(props: StudioStepToolsProps): ReactNode {
    return (
        <StudioStylePanel
            editor={props.editor}
            isLocked={props.isRendering}
            thumbnailUrl={props.video.thumbnailUrl}
        />
    );
}

const STEP_TOOLS: Record<StudioStep, (props: StudioStepToolsProps) => ReactNode> = {
    trim: TrimTools,
    captions: CaptionTools,
    style: StyleTools,
};

/** The tools of the current step. */
export function StudioStepTools(props: StudioStepToolsProps): ReactNode {
    const Tools = STEP_TOOLS[props.step];

    return <Tools {...props} />;
}
