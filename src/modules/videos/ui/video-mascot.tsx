import { toVideoMascotIndex } from "#/modules/videos/video-mascot";
import { Mascot } from "#/shared/ui/mascot";

export function VideoMascot({ videoId, className }: { videoId: string; className?: string }) {
    return <Mascot index={toVideoMascotIndex(videoId)} className={className} />;
}
