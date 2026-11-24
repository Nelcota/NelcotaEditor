import FilmIcon from "~icons/lucide/film";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { toYoutubeThumbnailUrl } from "#/modules/videos/model/youtube-preview";
import { describeNewVideoSource } from "#/modules/videos/model/describe-new-video-source";
import { StageCrewMascot } from "#/modules/videos/ui/components/stage-crew-mascot";
import { toLinkVideoId } from "#/modules/videos/model/video-source";
import type { VideoSource } from "#/modules/videos/model/video-source";
import { youtubePreviewQueryOptions } from "#/modules/videos/model/youtube-preview-queries";

const FRAME_CLASS =
    "aspect-video w-full rounded-lg bg-black object-cover outline-1 -outline-offset-1 outline-solid outline-white/10";

interface NewVideoPreviewProps {
    source: VideoSource;
    title: string;
}

/** A frame from the chosen file, read straight from the computer; nothing is uploaded for it. */
function FileFrame({ file }: { file: File }): ReactNode {
    // Created, attached and revoked by the same effect: a memoized URL could be revoked by one
    // cleanup and then reused (Strict Mode runs effects twice), or replaced without being revoked.
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        const objectUrl = URL.createObjectURL(file);

        if (video !== null) {
            video.src = `${objectUrl}#t=1`;
        }

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return <video ref={videoRef} muted playsInline preload="metadata" className={FRAME_CLASS} />;
}

function EmptyFrame(): ReactNode {
    return (
        <div className="grid aspect-video w-full place-content-center justify-items-center gap-2 rounded-lg border border-dashed text-meta text-muted-foreground">
            <FilmIcon className="size-7" aria-hidden="true" />O vídeo aparece aqui
        </div>
    );
}

function PreviewFrame({ source }: { source: VideoSource }): ReactNode {
    if (source.kind === "file") {
        return <FileFrame file={source.file} />;
    }

    const videoId = toLinkVideoId(source);

    if (videoId === null) {
        return <EmptyFrame />;
    }

    return (
        <img
            src={toYoutubeThumbnailUrl(videoId)}
            alt=""
            referrerPolicy="no-referrer"
            className={FRAME_CLASS}
        />
    );
}

/** How the video will show up in the list: its frame, title and where it comes from. */
export function NewVideoPreview({ source, title }: NewVideoPreviewProps): ReactNode {
    const videoId = toLinkVideoId(source);
    const previewQuery = useQuery({
        ...youtubePreviewQueryOptions(videoId ?? ""),
        enabled: videoId !== null,
    });
    const text = describeNewVideoSource(source, title, previewQuery.data);

    return (
        <figure aria-label="Prévia" className="m-0 grid content-start">
            <div className="grid gap-3 rounded-3xl border bg-background/40 p-3">
                <div className="relative">
                    <PreviewFrame source={source} />
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-black/70 py-0.5 pr-2.5 pl-1 text-xs font-semibold text-white">
                        <StageCrewMascot status="queued" className="size-5" />
                        Entra na fila
                    </span>
                </div>
                <div className="grid gap-1 px-1">
                    <p className="line-clamp-2 leading-snug font-semibold break-words">
                        {text.title}
                    </p>
                    <p title={text.detail} className="truncate text-meta text-muted-foreground">
                        {text.detail}
                    </p>
                </div>
            </div>
        </figure>
    );
}
