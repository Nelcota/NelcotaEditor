import type { ClipView } from "#/modules/clips/model/clip-view";
import { DownloadLink } from "#/shared/ui/download-link";
import { SCORE_SCALE } from "#/modules/videos/model/clip-score";
import { CopyTitleButton } from "#/modules/videos/ui/components/copy-title-button";
import { RetryClipButton } from "#/modules/videos/ui/components/retry-clip-button";
import { ShareClipButton } from "#/modules/videos/ui/components/share-clip-button";
import { OpenInStudioLink } from "#/modules/videos/ui/components/open-in-studio-link";

/** Brilho picked the moment, so the score and the reason are presented as Brilho's. */
function BrilhoReason({ clip }: { clip: ClipView }) {
    return (
        <p className="max-w-prose text-sm">
            <span className="font-medium">
                Brilho deu {clip.score}/{SCORE_SCALE}
            </span>
            {clip.reason.length > 0 && (
                <span className="text-muted-foreground">: {clip.reason}</span>
            )}
        </p>
    );
}

interface SelectedClipDetailsProps {
    videoId: string;
    clip: ClipView;
    /** Whether the video is finished, so a failed clip can go back to the queue. */
    canRetry: boolean;
}

function ClipActions({ videoId, clip, canRetry }: SelectedClipDetailsProps) {
    const isBusy = canRetry === false;

    if (clip.status === "failed") {
        return (
            <>
                <RetryClipButton videoId={videoId} clipId={clip.id} isDisabled={isBusy} />
                <OpenInStudioLink videoId={videoId} clipId={clip.id} />
                <ShareClipButton videoId={videoId} clip={clip} />
            </>
        );
    }

    // Pending and rendering clips have no downloadUrl yet, so the link stays out until it is done.
    return (
        <>
            <DownloadLink href={clip.downloadUrl} label="Baixar corte" />
            <OpenInStudioLink videoId={videoId} clipId={clip.id} />
            <ShareClipButton videoId={videoId} clip={clip} />
            <CopyTitleButton title={clip.title} />
        </>
    );
}

/** Under the open row: why Brilho chose the clip and what to do with it. */
export function SelectedClipDetails({ videoId, clip, canRetry }: SelectedClipDetailsProps) {
    return (
        <div aria-live="polite" className="grid gap-4">
            <BrilhoReason clip={clip} />
            <div className="flex flex-wrap gap-2">
                <ClipActions videoId={videoId} clip={clip} canRetry={canRetry} />
            </div>
        </div>
    );
}
