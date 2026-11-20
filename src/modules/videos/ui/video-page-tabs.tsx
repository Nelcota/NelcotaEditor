import ClapperboardIcon from "~icons/solar/clapperboard-linear";
import Pen2Icon from "~icons/solar/pen-2-linear";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { isVideoFinished, isVideoResumable } from "#/modules/videos/video-status";
import type { VideoDetails } from "#/modules/videos/video-views";
import { ProcessingPanel } from "#/modules/videos/ui/processing-panel";
import { ResumePanel } from "#/modules/videos/ui/resume-panel";
import { StudioTab } from "#/modules/videos/ui/studio/studio-tab";
import { VideoClipsSection } from "#/modules/videos/ui/video-clips-section";
import type { VideoPageSearch, VideoPageTab } from "#/modules/videos/ui/video-page-search";
import { VIDEO_PAGE_TABS } from "#/modules/videos/ui/video-page-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/shared/ui/tabs";

interface VideoPageTabsProps {
    details: VideoDetails;
    search: VideoPageSearch;
}

/** Cortes to watch and pick, Studio to edit one: the tab lives in the address, so it survives reloads. */
export function VideoPageTabs({ details, search }: VideoPageTabsProps): ReactNode {
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
            onValueChange={async (value) => {
                const nextTab = VIDEO_PAGE_TABS.find((candidate) => candidate === value);

                if (nextTab === undefined) {
                    return;
                }

                await goTo(nextTab);
            }}
            className="gap-6"
        >
            <TabsList variant="line" className="h-auto w-full justify-start gap-6 border-b pb-0">
                <TabsTrigger value="clips" className="h-11 flex-none px-0 text-base font-bold">
                    <ClapperboardIcon aria-hidden="true" />
                    Cortes
                    <span className="rounded-full bg-secondary px-2 text-xs text-muted-foreground">
                        {details.clips.length}
                    </span>
                </TabsTrigger>
                <TabsTrigger value="studio" className="h-11 flex-none px-0 text-base font-bold">
                    <Pen2Icon aria-hidden="true" />
                    Studio
                </TabsTrigger>
            </TabsList>
            <TabsContent value="clips" className="grid grid-cols-[minmax(0,1fr)] gap-8">
                {isVideoFinished(video.status) === false && <ProcessingPanel video={video} />}
                {isVideoResumable(video.status) === true && <ResumePanel video={video} />}
                <VideoClipsSection details={details} />
            </TabsContent>
            <TabsContent value="studio" className="min-w-0">
                <StudioTab
                    details={details}
                    clipId={search.clip}
                    onSelectClip={async (clipId) => {
                        await goTo("studio", clipId);
                    }}
                    onShowClips={async () => {
                        await goTo("clips");
                    }}
                />
            </TabsContent>
        </Tabs>
    );
}
