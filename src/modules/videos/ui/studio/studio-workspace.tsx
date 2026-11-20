import { useEffect, useRef, useState } from "react";
import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS } from "#/modules/highlights/highlight-limits";
import type { ClipStudioView } from "#/modules/videos/clip-studio-view";
import { isVideoFinished } from "#/modules/videos/video-status";
import type { ClipView, VideoSummary } from "#/modules/videos/video-views";
import { CaptionList } from "#/modules/videos/ui/studio/caption-list";
import { findCueAt } from "#/modules/videos/ui/studio/caption-overlay";
import { MobileTrim } from "#/modules/videos/ui/studio/mobile-trim";
import { ConflictDialog, SharedRenderDialog } from "#/modules/videos/ui/studio/studio-dialogs";
import {
    LockedHint,
    OfflineNotice,
    RenderFailedBanner,
    RenderedNotice,
    RenderingOverlay,
    ShortcutsHint,
} from "#/modules/videos/ui/studio/studio-notices";
import { StudioPreview } from "#/modules/videos/ui/studio/studio-preview";
import { StudioStylePanel } from "#/modules/videos/ui/studio/studio-style-panel";
import { StudioTimeline } from "#/modules/videos/ui/studio/studio-timeline";
import { StudioToolbar } from "#/modules/videos/ui/studio/studio-toolbar";
import { computeTimelineWindow, clamp } from "#/modules/videos/ui/studio/timeline-geometry";
import { useStudioEditor } from "#/modules/videos/ui/studio/use-studio-editor";
import { useStudioPlayback } from "#/modules/videos/ui/studio/use-studio-playback";
import { useStudioShortcuts } from "#/modules/videos/ui/studio/use-studio-shortcuts";
import { cn } from "#/shared/ui/cn";
import { SegmentedControl } from "#/shared/ui/segmented-control";

type PhonePanel = "captions" | "style" | "trim";

const PHONE_PANELS = [
    { value: "captions", label: "Legendas" },
    { value: "style", label: "Estilo" },
    { value: "trim", label: "Trecho" },
] as const;

interface StudioWorkspaceProps {
    video: VideoSummary;
    studio: ClipStudioView;
    rankedClips: Array<ClipView>;
    onSelectClip: (clipId: string) => void;
}

/** True once a render this page started (or watched) has just finished. */
function useJustRendered(isRendering: boolean): boolean {
    const wasRenderingRef = useRef(isRendering);
    const [hasFinished, setHasFinished] = useState(false);

    useEffect(() => {
        if (wasRenderingRef.current === true && isRendering === false) {
            setHasFinished(true);
        }

        wasRenderingRef.current = isRendering;
    }, [isRendering]);

    return hasFinished;
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
    const [isConfirmingShare, setIsConfirmingShare] = useState(false);
    const [hasConflict, setHasConflict] = useState(false);
    const isRendering = isVideoFinished(video.status) === false;
    const hasJustRendered = useJustRendered(isRendering);
    const durationSeconds = studio.videoDurationSeconds ?? draft.endSeconds;
    const timelineWindow = computeTimelineWindow(
        draft,
        editor.applied,
        studio.videoDurationSeconds,
    );
    const playingIndex = findCueAt(draft.cues, playback.currentSeconds);

    const sendRender = async (): Promise<void> => {
        const outcome = await editor.render();

        if (outcome === "conflict") {
            setHasConflict(true);
        }
    };

    const requestRender = (): void => {
        if (clip.sharePath !== null) {
            setIsConfirmingShare(true);
            return;
        }

        void sendRender();
    };

    const markStart = (): void => {
        const earliest = Math.max(0, draft.endSeconds - MAX_CLIP_SECONDS);
        const start = clamp(playback.currentSeconds, earliest, draft.endSeconds - MIN_CLIP_SECONDS);
        editor.trim(start, draft.endSeconds);
    };

    const markEnd = (): void => {
        const latest = Math.min(durationSeconds, draft.startSeconds + MAX_CLIP_SECONDS);
        const end = clamp(playback.currentSeconds, draft.startSeconds + MIN_CLIP_SECONDS, latest);
        editor.trim(draft.startSeconds, end);
    };

    useStudioShortcuts(
        {
            togglePlay: playback.togglePlay,
            skip: (delta) => playback.seek(playback.currentSeconds + delta),
            markStart,
            markEnd,
            undo: editor.undo,
            redo: editor.redo,
        },
        isRendering === false,
    );

    const openCue = (index: number | null): void => {
        setOpenIndex(index);
        setPhonePanel("captions");
    };

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
            <ShortcutsHint />
            {clip.status === "failed" && isRendering === false && (
                <RenderFailedBanner videoId={video.id} clip={clip} />
            )}
            {hasJustRendered === true && clip.status === "done" && <RenderedNotice clip={clip} />}
            {editor.autosave.status === "offline" && <OfflineNotice />}
            {editor.renderError !== null && (
                <p role="alert" className="text-sm text-destructive">
                    {editor.renderError}
                </p>
            )}
            <StudioToolbar
                rankedClips={rankedClips}
                clipId={clip.id}
                onSelectClip={onSelectClip}
                editor={editor}
                isRendering={isRendering}
                onRender={requestRender}
            />
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
                <div
                    className={cn(
                        "order-3 lg:order-1 lg:block",
                        phonePanel !== "style" && "hidden",
                    )}
                >
                    <StudioStylePanel editor={editor} isLocked={isRendering} />
                </div>
                <div className="order-1 grid justify-items-center gap-2 lg:order-2">
                    <StudioPreview
                        draft={draft}
                        videoRef={videoRef}
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
                    onValueChange={setPhonePanel}
                    className="order-2 lg:hidden"
                />
                <CaptionList
                    editor={editor}
                    words={studio.words}
                    currentSeconds={playback.currentSeconds}
                    openIndex={openIndex}
                    onOpen={openCue}
                    onSeek={playback.seek}
                    isLocked={isRendering}
                    className={cn(
                        "order-3 max-h-[70vh] lg:flex lg:h-[600px]",
                        phonePanel !== "captions" && "hidden",
                    )}
                />
                <div className={cn("order-3 lg:hidden", phonePanel !== "trim" && "hidden")}>
                    <MobileTrim
                        editor={editor}
                        videoDurationSeconds={durationSeconds}
                        currentSeconds={playback.currentSeconds}
                        isLocked={isRendering}
                    />
                </div>
            </div>
            <div className="hidden lg:block">
                <StudioTimeline
                    editor={editor}
                    window={timelineWindow}
                    sourceUrl={video.originalFileUrl}
                    videoDurationSeconds={durationSeconds}
                    currentSeconds={playback.currentSeconds}
                    playingIndex={playingIndex}
                    openIndex={openIndex}
                    isLocked={isRendering}
                    onOpen={(index) => {
                        openCue(index);
                        const cue = draft.cues[index];

                        if (cue !== undefined) {
                            playback.seek(cue.startSeconds);
                        }
                    }}
                    onSeek={playback.seek}
                    onMarkStart={markStart}
                    onMarkEnd={markEnd}
                />
            </div>
            <ConflictDialog
                isOpen={hasConflict === true || editor.autosave.status === "conflict"}
                onTakeTheirs={async () => {
                    setHasConflict(false);
                    await editor.takeTheirs();
                }}
                onKeepMine={async () => {
                    setHasConflict(false);
                    await editor.keepMine();
                }}
            />
            <SharedRenderDialog
                isOpen={isConfirmingShare}
                onOpenChange={setIsConfirmingShare}
                onConfirm={sendRender}
            />
        </div>
    );
}
