import { useRef, useState } from "react";
import type { ClipStudioView } from "#/modules/studio/clip-studio-view";
import { isVideoFinished } from "#/modules/video-records/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import type { ClipView } from "#/modules/clips/clip-view";
import type { StudioDraft } from "#/modules/clips/clip-studio.schema";
import { findCueAt } from "#/modules/studio/ui/caption-overlay";
import { usePlaybackValue } from "#/modules/studio/ui/playback-clock";
import { RenderRequestDialogs } from "#/modules/studio/ui/render-request-dialogs";
import { StudioMessages } from "#/modules/studio/ui/studio-messages";
import { StudioStage } from "#/modules/studio/ui/studio-stage";
import { StudioStepFooter } from "#/modules/studio/ui/studio-step-footer";
import { StudioStepTools } from "#/modules/studio/ui/studio-step-tools";
import { StudioStepper } from "#/modules/studio/ui/studio-steps";
import type { StudioStep } from "#/modules/studio/ui/studio-steps";
import { StudioToolPanel } from "#/modules/studio/ui/studio-tool-panel";
import { StudioToolbar } from "#/modules/studio/ui/studio-toolbar";
import { useRenderRequest } from "#/modules/studio/ui/use-render-request";
import { useStudioEditor } from "#/modules/studio/ui/use-studio-editor";
import { useStudioPlayback } from "#/modules/studio/ui/use-studio-playback";
import { useStudioShortcuts } from "#/modules/studio/ui/use-studio-shortcuts";
import { useTrimMarks } from "#/modules/studio/ui/use-trim-marks";
import { pluralize } from "#/shared/ui/pluralize";
import { useIsAtLeastWidth } from "#/shared/ui/use-is-at-least-width";

// The Studio's own width, not the window's: the page frame and the video page's own columns
// leave less than the window. Matches the @4xl/studio (56rem) variant, where the stage and the
// tools sit side by side and the timeline shows.
const WIDE_STUDIO_MIN_PIXELS = 896;

interface StudioWorkspaceProps {
    video: VideoSummary;
    studio: ClipStudioView;
    rankedClips: Array<ClipView>;
    onSelectClip: (clipId: string) => void;
}

function summarizeSteps(draft: StudioDraft): Record<StudioStep, string | null> {
    const lengthSeconds = draft.endSeconds - draft.startSeconds;
    const cueCount = draft.cues.length;

    return {
        trim: `${lengthSeconds.toFixed(1).replace(".", ",")} s`,
        captions: `${cueCount} ${pluralize(cueCount, "bloco", "blocos")}`,
        style: null,
    };
}

/**
 * The Studio for one clip, one step at a time: the trim, the captions, then their look. The
 * preview stays on its stage throughout, and every step can render the draft.
 */
export function StudioWorkspace({
    video,
    studio,
    rankedClips,
    onSelectClip,
}: StudioWorkspaceProps) {
    const editor = useStudioEditor(video.id, studio);
    const draft = editor.draft;
    const clip = studio.clip;
    const videoRef = useRef<HTMLVideoElement>(null);
    const playback = useStudioPlayback(videoRef, draft);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [step, setStep] = useState<StudioStep>("trim");
    const isRendering = isVideoFinished(video.status) === false;
    const renderRequest = useRenderRequest(editor, clip.sharePath);
    const durationSeconds = studio.videoDurationSeconds ?? draft.endSeconds;
    const marks = useTrimMarks({
        editor,
        clock: playback.clock,
        videoDurationSeconds: durationSeconds,
    });
    // Only the spoken cue's index re-renders the Studio, not every frame of the clock.
    const playingIndex = usePlaybackValue(playback.clock, (seconds) =>
        findCueAt(draft.cues, seconds),
    );
    const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
    const isDesktop = useIsAtLeastWidth(rootElement, WIDE_STUDIO_MIN_PIXELS);

    useStudioShortcuts(
        {
            togglePlay: playback.togglePlay,
            skip: (delta) => playback.seek(playback.clock.read() + delta),
            markStart: marks.markStart,
            markEnd: marks.markEnd,
            undo: editor.undo,
            redo: editor.redo,
        },
        isRendering === false,
    );

    const openCueFromTimeline = (index: number): void => {
        setOpenIndex(index);
        setStep("captions");
        const cue = draft.cues[index];

        if (cue !== undefined) {
            playback.seek(cue.startSeconds);
        }
    };

    return (
        <div
            ref={setRootElement}
            className="@container/studio grid grid-cols-[minmax(0,1fr)] gap-4"
        >
            <StudioMessages
                videoId={video.id}
                clip={clip}
                editor={editor}
                isRendering={isRendering}
            />
            <StudioToolbar
                rankedClips={rankedClips}
                clipId={clip.id}
                onSelectClip={onSelectClip}
                editor={editor}
                isRendering={isRendering}
                stepper={
                    <StudioStepper
                        step={step}
                        summaries={summarizeSteps(draft)}
                        onStepChange={setStep}
                    />
                }
            />
            {/* From @4xl the pair fills the window's height, so nothing below the fold. */}
            <div className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl border @4xl/studio:h-[clamp(520px,calc(100dvh-320px),900px)] @4xl/studio:grid-cols-[minmax(0,1fr)_456px] @4xl/studio:grid-rows-[minmax(0,1fr)] @6xl/studio:grid-cols-[minmax(0,1fr)_520px]">
                <StudioStage
                    video={video}
                    editor={editor}
                    videoRef={videoRef}
                    playback={playback}
                    isRendering={isRendering}
                />
                <StudioToolPanel
                    step={step}
                    footer={
                        <StudioStepFooter
                            step={step}
                            onStepChange={setStep}
                            editor={editor}
                            isRendering={isRendering}
                            onRender={renderRequest.request}
                        />
                    }
                >
                    <StudioStepTools
                        step={step}
                        video={video}
                        studio={studio}
                        editor={editor}
                        playback={playback}
                        marks={marks}
                        videoDurationSeconds={durationSeconds}
                        isDesktop={isDesktop}
                        isRendering={isRendering}
                        playingIndex={playingIndex}
                        openIndex={openIndex}
                        onOpenCue={setOpenIndex}
                        onOpenCueFromTimeline={openCueFromTimeline}
                    />
                </StudioToolPanel>
            </div>
            <RenderRequestDialogs editor={editor} renderRequest={renderRequest} />
        </div>
    );
}
