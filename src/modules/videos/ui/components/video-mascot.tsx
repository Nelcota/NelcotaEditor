import { toVideoMascotIndex } from "#/modules/videos/model/video-mascot";
import { Mascot } from "#/shared/ui/mascot";

export function VideoMascot({ videoId, className }: { videoId: string; className?: string }) {
    return <Mascot index={toVideoMascotIndex(videoId)} className={className} />;
}
