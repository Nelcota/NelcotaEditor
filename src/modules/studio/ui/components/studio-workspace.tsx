import { useRef, useState } from "react";
import type { ClipStudioView } from "#/modules/studio/model/clip-studio-view";
import { isVideoFinished } from "#/modules/video-records/model/video-status";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import type { ClipView } from "#/modules/clips/model/clip-view";
import { findCueAt } from "#/modules/studio/ui/components/caption-overlay";
import { usePlaybackValue } from "#/modules/studio/ui/hooks/playback-clock";
import { RenderRequestDialogs } from "#/modules/studio/ui/components/render-request-dialogs";
import { StudioBar } from "#/modules/studio/ui/components/studio-bar";
import { StudioMessages } from "#/modules/studio/ui/components/studio-messages";
import { StudioStage } from "#/modules/studio/ui/components/studio-stage";
import { StudioTimeline } from "#/modules/studio/ui/components/studio-timeline";
import { StudioTools } from "#/modules/studio/ui/components/studio-tools";
import type { StudioToolTab } from "#/modules/studio/ui/components/studio-tools";
import { computeTimelineWindow } from "#/modules/studio/client/timeline-geometry";
import { useRenderRequest } from "#/modules/studio/ui/hooks/use-render-request";
import { useStudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";
import { useStudioPlayback } from "#/modules/studio/ui/hooks/use-studio-playback";
import { useStudioShortcuts } from "#/modules/studio/ui/hooks/use-studio-shortcuts";
import { useTrimMarks } from "#/modules/studio/ui/hooks/use-trim-marks";
import { useIsAtLeastWidth } from "#/shared/ui/use-is-at-least-width";

// The Studio's own width, not the window's. Matches the @4xl/studio (56rem) variant, where the
// tools sit beside the preview and the timeline runs under both.
const WIDE_STUDIO_MIN_PIXELS = 896;

interface StudioWorkspaceProps {
    video: VideoSummary;
    studio: ClipStudioView;
    rankedClips: Array<ClipView>;
    onSelectClip: (clipId: string) => void;
}

/** Wide screens trim on the timeline, so a Trecho tab left open on a phone shows the captions. */
function shownTab(tab: StudioToolTab, isDesktop: boolean): StudioToolTab {
    if (isDesktop === true && tab === "trim") {
        return "captions";
    }

    return tab;
}

/**
 * The editor for one clip, filling the window: the bar on top, the captions and style beside a
 * large preview, and the timeline with the trim and the caption blocks under both. Phones stack
 * the preview over the tools and trim with buttons instead of the timeline.
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
    const [tab, setTab] = useState<StudioToolTab>("captions");
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
        setTab("captions");
        const cue = draft.cues[index];

        if (cue !== undefined) {
            playback.seek(cue.startSeconds);
        }
    };

    return (
        <div ref={setRootElement} className="@container/studio min-h-full md:h-full">
            <div className="grid min-h-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_auto_auto] @4xl/studio:h-full @4xl/studio:grid-rows-[auto_auto_minmax(0,1fr)_auto]">
                <StudioBar
                    videoId={video.id}
                    rankedClips={rankedClips}
                    clipId={clip.id}
                    onSelectClip={onSelectClip}
                    editor={editor}
                    isRendering={isRendering}
                    onRender={renderRequest.request}
                />
                <div className="grid gap-2 px-4 py-3 empty:p-0">
                    <StudioMessages
                        videoId={video.id}
                        clip={clip}
                        editor={editor}
                        isRendering={isRendering}
                    />
                </div>
                <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] @4xl/studio:grid-cols-[400px_minmax(0,1fr)] @4xl/studio:grid-rows-[minmax(0,1fr)] @6xl/studio:grid-cols-[440px_minmax(0,1fr)]">
                    <div className="grid min-h-0 @4xl/studio:col-start-2 @4xl/studio:row-start-1">
                        <StudioStage
                            video={video}
                            editor={editor}
                            videoRef={videoRef}
                            playback={playback}
                            isRendering={isRendering}
                        />
                    </div>
                    <StudioTools
                        tab={shownTab(tab, isDesktop)}
                        onTabChange={setTab}
                        video={video}
                        studio={studio}
                        editor={editor}
                        playback={playback}
                        videoDurationSeconds={durationSeconds}
                        isDesktop={isDesktop}
                        isRendering={isRendering}
                        playingIndex={playingIndex}
                        openIndex={openIndex}
                        onOpenCue={setOpenIndex}
                    />
                </div>
                {/* Not just hidden on phones: the filmstrip loads ten videos that nobody would see. */}
                {isDesktop === true && (
                    <StudioTimeline
                        editor={editor}
                        window={computeTimelineWindow(
                            draft,
                            editor.applied,
                            studio.videoDurationSeconds,
                        )}
                        sourceUrl={video.originalFileUrl}
                        videoDurationSeconds={durationSeconds}
                        clock={playback.clock}
                        playingIndex={playingIndex}
                        openIndex={openIndex}
                        isLocked={isRendering}
                        onOpen={openCueFromTimeline}
                        onSeek={playback.seek}
                        onMarkStart={marks.markStart}
                        onMarkEnd={marks.markEnd}
                    />
                )}
            </div>
            <RenderRequestDialogs editor={editor} renderRequest={renderRequest} />
        </div>
    );
}
