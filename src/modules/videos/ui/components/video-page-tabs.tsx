import ScissorsIcon from "~icons/lucide/scissors";
import PencilIcon from "~icons/lucide/pencil";
import SquarePlayIcon from "~icons/lucide/square-play";
import type { ReactNode } from "react";
import { isVideoFinished, isVideoResumable } from "#/modules/video-records/model/video-status";
import type { VideoDetails } from "#/modules/videos/model/video-views";
import { ProcessingPanel } from "#/modules/videos/ui/components/processing-panel";
import { ResumePanel } from "#/modules/videos/ui/components/resume-panel";
import { VideoClipsSection } from "#/modules/videos/ui/components/video-clips-section";
import { VideoStageAnnouncer } from "#/modules/videos/ui/components/video-stage-announcer";
import { VideoOriginalSection } from "#/modules/videos/ui/components/video-original-section";
import type { VideoPageSearch } from "#/modules/videos/model/video-page-search";
import { VIDEO_PAGE_TABS } from "#/modules/videos/model/video-page-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/shared/ui/tabs";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { useVideoTabNavigation } from "#/modules/videos/ui/hooks/use-video-tab-navigation";
import { useVideoResultGesture } from "#/modules/videos/ui/hooks/use-video-result-gesture";

interface VideoPageTabsProps {
    details: VideoDetails;
    search: VideoPageSearch;
}

/**
 * Cortes to watch and pick, Original to read and scrub the full video, Studio to edit a clip. The
 * tab lives in the address, so it survives reloads. The Studio opens as its own full-window
 * editor, so its tab only navigates there. Tab labels have no side padding: the first icon sits
 * on the surface's text line.
 */
export function VideoPageTabs({ details, search }: VideoPageTabsProps): ReactNode {
    const track = useTrackPromise();
    const video = details.video;
    const tab = search.tab ?? "clips";
    const goTo = useVideoTabNavigation(video.id, search);
    const failureMascot = useVideoResultGesture(video, "failed");

    return (
        <>
            <VideoStageAnnouncer video={video} />
            <Tabs
                value={tab}
                onValueChange={(value) => {
                    const nextTab = VIDEO_PAGE_TABS.find((candidate) => candidate === value);

                    if (nextTab === undefined) {
                        return;
                    }

                    track(goTo(nextTab));
                }}
                className="gap-6"
            >
                <TabsList
                    variant="line"
                    // Under sm the three labels only fit a 320px screen without their icons.
                    className="h-auto w-full justify-start gap-6 border-b px-0 pb-0 max-sm:gap-5 max-sm:[&_[role=tab]>svg]:hidden"
                >
                    <TabsTrigger
                        value="clips"
                        className="h-11 flex-none px-0 text-base font-semibold"
                    >
                        <ScissorsIcon aria-hidden="true" />
                        Cortes
                        <span className="rounded-lg bg-secondary px-2 text-xs text-muted-foreground tabular-nums">
                            {details.clips.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="original"
                        className="h-11 flex-none px-0 text-base font-semibold"
                    >
                        <SquarePlayIcon aria-hidden="true" />
                        Original
                    </TabsTrigger>
                    <TabsTrigger
                        value="studio"
                        className="h-11 flex-none px-0 text-base font-semibold"
                    >
                        <PencilIcon aria-hidden="true" />
                        Studio
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="clips" className="grid grid-cols-[minmax(0,1fr)] gap-8">
                    {isVideoFinished(video.status) === false && <ProcessingPanel video={video} />}
                    {isVideoResumable(video.status) === true && (
                        <ResumePanel video={video} mascotRef={failureMascot} />
                    )}
                    <VideoClipsSection details={details} />
                </TabsContent>
                <TabsContent value="original" className="min-w-0">
                    <VideoOriginalSection details={details} />
                </TabsContent>
            </Tabs>
        </>
    );
}
