import { useRef, useState } from "react";
import type { ClipStudioView } from "#/modules/studio/clip-studio-view";
import { isVideoFinished } from "#/modules/video-records/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import type { ClipView } from "#/modules/clips/clip-view";
import { findCueAt } from "#/modules/studio/ui/caption-overlay";
import { usePlaybackValue } from "#/modules/studio/ui/playback-clock";
import { RenderRequestDialogs } from "#/modules/studio/ui/render-request-dialogs";
import { StudioMessages } from "#/modules/studio/ui/studio-messages";
import { ShortcutsHint } from "#/modules/studio/ui/studio-notices";
import { StudioPanels } from "#/modules/studio/ui/studio-panels";
import type { PhonePanel } from "#/modules/studio/ui/studio-panels";
import { StudioTimeline } from "#/modules/studio/ui/studio-timeline";
import { StudioToolbar } from "#/modules/studio/ui/studio-toolbar";
import { computeTimelineWindow } from "#/modules/studio/ui/timeline-geometry";
import { useRenderRequest } from "#/modules/studio/ui/use-render-request";
import { useStudioEditor } from "#/modules/studio/ui/use-studio-editor";
import { useStudioPlayback } from "#/modules/studio/ui/use-studio-playback";
import { useStudioShortcuts } from "#/modules/studio/ui/use-studio-shortcuts";
import { useTrimMarks } from "#/modules/studio/ui/use-trim-marks";
import { useIsAtLeastWidth } from "#/shared/ui/use-is-at-least-width";

// Tailwind's lg breakpoint, where the timeline shows.
// The Studio's own width, not the window's: the page frame and the video page's own columns
// leave less than the window. Matches the @4xl/studio (56rem) variant.
const WIDE_STUDIO_MIN_PIXELS = 896;

interface StudioWorkspaceProps {
    video: VideoSummary;
    studio: ClipStudioView;
    rankedClips: Array<ClipView>;
    onSelectClip: (clipId: string) => void;
}

/** The Studio for one clip: style, live preview, captions and the timeline, all on one draft. */
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
    const [phonePanel, setPhonePanel] = useState<PhonePanel>("captions");
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

    const openCue = (index: number | null): void => {
        setOpenIndex(index);
        setPhonePanel("captions");
    };

    const openCueAndSeek = (index: number): void => {
        openCue(index);
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
                onRender={renderRequest.request}
            />
            <StudioPanels
                video={video}
                editor={editor}
                words={studio.words}
                videoRef={videoRef}
                playback={playback}
                videoDurationSeconds={durationSeconds}
                isRendering={isRendering}
                playingIndex={playingIndex}
                openIndex={openIndex}
                onOpenCue={openCue}
                phonePanel={phonePanel}
                onPhonePanelChange={setPhonePanel}
            />
            {/* Not just hidden on phones: its filmstrip loads ten videos that nobody would see. */}
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
                    onOpen={openCueAndSeek}
                    onSeek={playback.seek}
                    onMarkStart={marks.markStart}
                    onMarkEnd={marks.markEnd}
                />
            )}
            <ShortcutsHint />
            <RenderRequestDialogs editor={editor} renderRequest={renderRequest} />
        </div>
    );
}
