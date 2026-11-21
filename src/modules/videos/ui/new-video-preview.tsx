import VideoFramePlayHorizontalIcon from "~icons/solar/video-frame-play-horizontal-linear";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { toYoutubeThumbnailUrl } from "#/modules/videos/youtube-preview";
import {
    describeClipCount,
    describeNewVideoSource,
} from "#/modules/videos/ui/describe-new-video-source";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { toLinkVideoId } from "#/modules/videos/ui/video-source";
import type { VideoSource } from "#/modules/videos/ui/video-source";
import { youtubePreviewQueryOptions } from "#/modules/videos/ui/youtube-preview-queries";

const FRAME_CLASS = "aspect-video w-full rounded-xl bg-black object-cover";

interface NewVideoPreviewProps {
    source: VideoSource;
    title: string;
    clipCount: number;
    languageLabel: string;
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
        <div className="grid aspect-video w-full place-content-center justify-items-center gap-2 rounded-xl border border-dashed text-[14px] text-muted-foreground">
            <VideoFramePlayHorizontalIcon className="size-7" aria-hidden="true" />O vídeo aparece
            aqui
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

function Fact({ label, value }: { label: string; value: string }): ReactNode {
    return (
        <div className="grid gap-0.5">
            <dt className="text-[14px] text-muted-foreground">{label}</dt>
            <dd className="text-sm font-bold">{value}</dd>
        </div>
    );
}

/** How the video will show up in the list, filled in as the person fills the form. */
export function NewVideoPreview({
    source,
    title,
    clipCount,
    languageLabel,
}: NewVideoPreviewProps): ReactNode {
    const videoId = toLinkVideoId(source);
    const previewQuery = useQuery({
        ...youtubePreviewQueryOptions(videoId ?? ""),
        enabled: videoId !== null,
    });
    const text = describeNewVideoSource(source, title, previewQuery.data);

    return (
        <aside
            aria-label="Prévia"
            className="hidden min-h-0 content-start gap-4 overflow-y-auto border-l p-5 lg:grid"
        >
            <div className="grid gap-1">
                <h3 className="font-bold">Prévia</h3>
                <p className="text-[14px] text-muted-foreground">
                    Como o vídeo entra na sua lista.
                </p>
            </div>
            <div className="grid gap-3 rounded-2xl border bg-background/40 p-3">
                <div className="relative">
                    <PreviewFrame source={source} />
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-black/70 py-0.5 pr-2.5 pl-1 text-xs font-bold text-white">
                        <StageCrewMascot status="queued" className="size-5" />
                        Entra na fila
                    </span>
                </div>
                <div className="grid gap-1 px-1">
                    <p className="line-clamp-2 leading-snug font-extrabold break-words">
                        {text.title}
                    </p>
                    <p title={text.detail} className="truncate text-[14px] text-muted-foreground">
                        {text.detail}
                    </p>
                </div>
                <dl className="mx-1 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 pb-1">
                    <Fact label="Cortes" value={describeClipCount(clipCount)} />
                    <Fact label="Formato" value="9:16 · legenda" />
                    <div className="col-span-2">
                        <Fact label="Idioma da fala" value={languageLabel} />
                    </div>
                </dl>
            </div>
        </aside>
    );
}
