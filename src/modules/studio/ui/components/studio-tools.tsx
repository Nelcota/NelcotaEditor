import CaptionsIcon from "~icons/lucide/captions";
import PaletteIcon from "~icons/lucide/palette";
import ScissorsIcon from "~icons/lucide/scissors";
import type { ComponentType, ReactNode, SVGProps } from "react";
import type { ClipStudioView } from "#/modules/studio/model/clip-studio-view";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { CaptionList } from "#/modules/studio/ui/components/caption-list";
import { MobileTrim } from "#/modules/studio/ui/components/mobile-trim";
import { StudioStylePanel } from "#/modules/studio/ui/components/studio-style-panel";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";
import type { StudioPlayback } from "#/modules/studio/ui/hooks/use-studio-playback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/shared/ui/tabs";

export const STUDIO_TOOL_TABS = ["trim", "captions", "style"] as const;

export type StudioToolTab = (typeof STUDIO_TOOL_TABS)[number];

const TAB_LABELS: Record<StudioToolTab, string> = {
    trim: "Trecho",
    captions: "Legendas",
    style: "Estilo",
};

const TAB_ICONS: Record<StudioToolTab, ComponentType<SVGProps<SVGSVGElement>>> = {
    trim: ScissorsIcon,
    captions: CaptionsIcon,
    style: PaletteIcon,
};

interface StudioToolsProps {
    tab: StudioToolTab;
    onTabChange: (tab: StudioToolTab) => void;
    video: VideoSummary;
    studio: ClipStudioView;
    editor: StudioEditor;
    playback: StudioPlayback;
    videoDurationSeconds: number;
    /** Wide screens trim on the timeline under the preview, so the Trecho tab is for phones. */
    isDesktop: boolean;
    isRendering: boolean;
    playingIndex: number;
    openIndex: number | null;
    onOpenCue: (index: number | null) => void;
}

function listTabs(isDesktop: boolean): ReadonlyArray<StudioToolTab> {
    if (isDesktop === true) {
        return ["captions", "style"];
    }

    return STUDIO_TOOL_TABS;
}

/** Captions and style side by side with the preview, as tabs: nothing has to be done in order. */
export function StudioTools(props: StudioToolsProps): ReactNode {
    const { editor, isRendering } = props;
    const tabs = listTabs(props.isDesktop);

    return (
        <Tabs
            value={props.tab}
            onValueChange={(value) => {
                const tab = tabs.find((candidate) => candidate === value);

                if (tab === undefined) {
                    return;
                }

                props.onTabChange(tab);
            }}
            className="min-h-0 gap-0 bg-background @4xl/studio:col-start-1 @4xl/studio:row-start-1 @4xl/studio:border-e"
        >
            <div className="border-b p-3">
                <TabsList aria-label="Ferramentas do Studio" className="h-11 w-full">
                    {tabs.map((tab) => {
                        const Icon = TAB_ICONS[tab];

                        return (
                            <TabsTrigger key={tab} value={tab} className="font-semibold">
                                <Icon aria-hidden="true" />
                                {TAB_LABELS[tab]}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </div>
            {props.isDesktop === false && (
                <TabsContent value="trim" className="p-4">
                    <MobileTrim
                        editor={editor}
                        videoDurationSeconds={props.videoDurationSeconds}
                        readCurrentSeconds={props.playback.clock.read}
                        isLocked={isRendering}
                    />
                </TabsContent>
            )}
            <TabsContent value="captions" className="flex min-h-0 flex-col">
                <CaptionList
                    editor={editor}
                    words={props.studio.words}
                    playingIndex={props.playingIndex}
                    openIndex={props.openIndex}
                    onOpen={props.onOpenCue}
                    onSeek={props.playback.seek}
                    isLocked={isRendering}
                    className="max-h-[70dvh] min-h-80 flex-1 @4xl/studio:max-h-none @4xl/studio:min-h-0"
                />
            </TabsContent>
            <TabsContent value="style" className="min-h-0 overflow-y-auto p-4">
                <StudioStylePanel
                    editor={editor}
                    isLocked={isRendering}
                    thumbnailUrl={props.video.thumbnailUrl}
                />
            </TabsContent>
        </Tabs>
    );
}
