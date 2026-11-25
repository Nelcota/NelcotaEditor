import type { VideoDetails } from "#/modules/videos/model/video-views";

/** What the page gives the Studio tab. */
export interface StudioTabProps {
    details: VideoDetails;
    /** The clip asked for in the address; the best clip when absent, "not found" when unknown. */
    clipId: string | undefined;
    onSelectClip: (clipId: string) => void;
    onShowClips: () => void;
}
