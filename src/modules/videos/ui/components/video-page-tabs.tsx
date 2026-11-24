import ScissorsIcon from "~icons/lucide/scissors";
import PencilIcon from "~icons/lucide/pencil";
import SquarePlayIcon from "~icons/lucide/square-play";
import { useNavigate } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";
import { isVideoFinished, isVideoResumable } from "#/modules/video-records/model/video-status";
import type { VideoDetails } from "#/modules/videos/model/video-views";
import { ProcessingPanel } from "#/modules/videos/ui/components/processing-panel";
import { ResumePanel } from "#/modules/videos/ui/components/resume-panel";
import { VideoClipsSection } from "#/modules/videos/ui/components/video-clips-section";
import { VideoOriginalSection } from "#/modules/videos/ui/components/video-original-section";
import type { StudioTabProps } from "#/modules/videos/model/studio-tab-props";
import type { VideoPageSearch, VideoPageTab } from "#/modules/videos/model/video-page-search";
import { VIDEO_PAGE_TABS } from "#/modules/videos/model/video-page-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/shared/ui/tabs";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

interface VideoPageTabsProps {
    details: VideoDetails;
    search: VideoPageSearch;
    /**
     * The Studio module builds on this one, so the route hands its tab in instead of the page
     * importing it.
     */
    StudioTab: ComponentType<StudioTabProps>;
}

/**
 * Cortes to watch and pick, Original to read and scrub the full video, Studio to edit a clip. The
 * tab lives in the address, so it survives reloads. Tab labels have no side padding: the first
 * icon sits on the surface's text line.
 */
export function VideoPageTabs({ details, search, StudioTab }: VideoPageTabsProps): ReactNode {
    const track = useTrackPromise();
    const navigate = useNavigate();
    const video = details.video;
    const tab = search.tab ?? "clips";

    const goTo = async (nextTab: VideoPageTab, clipId?: string): Promise<void> => {
        await navigate({
            to: "/videos/$videoId",
            params: { videoId: video.id },
            search: { tab: nextTab, clip: clipId ?? search.clip },
            replace: true,
        });
    };

    return (
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
                <TabsTrigger value="clips" className="h-11 flex-none px-0 text-base font-semibold">
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
                <TabsTrigger value="studio" className="h-11 flex-none px-0 text-base font-semibold">
                    <PencilIcon aria-hidden="true" />
                    Studio
                </TabsTrigger>
            </TabsList>
            <TabsContent value="clips" className="grid grid-cols-[minmax(0,1fr)] gap-8">
                {isVideoFinished(video.status) === false && <ProcessingPanel video={video} />}
                {isVideoResumable(video.status) === true && <ResumePanel video={video} />}
                <VideoClipsSection details={details} />
            </TabsContent>
            <TabsContent value="original" className="min-w-0">
                <VideoOriginalSection details={details} />
            </TabsContent>
            <TabsContent value="studio" className="min-w-0">
                <StudioTab
                    details={details}
                    clipId={search.clip}
                    onSelectClip={(clipId) => track(goTo("studio", clipId))}
                    onShowClips={() => track(goTo("clips"))}
                />
            </TabsContent>
        </Tabs>
    );
}
