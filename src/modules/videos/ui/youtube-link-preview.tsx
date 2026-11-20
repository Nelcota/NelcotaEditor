import CloseIcon from "~icons/solar/close-linear";
import DangerCircleIcon from "~icons/solar/danger-circle-linear";
import LinkIcon from "~icons/solar/link-linear";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { YoutubePreview } from "#/modules/videos/youtube-preview";
import { toYoutubeThumbnailUrl } from "#/modules/videos/youtube-preview";
import { youtubePreviewQueryOptions } from "#/modules/videos/ui/youtube-preview-queries";
import { Button } from "#/shared/ui/button";
import { Skeleton } from "#/shared/ui/skeleton";

const UNAVAILABLE_MESSAGES: Record<"private" | "not-found", string> = {
    private: "Esse vídeo é privado. Deixe como público ou não listado, ou envie o arquivo.",
    "not-found": "Não achamos esse vídeo. Confira se o link está completo.",
};

function PreviewCard(props: {
    thumbnailUrl: string;
    title: ReactNode;
    detail: ReactNode;
    onClear: () => void;
}) {
    return (
        <div className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-background p-2.5 sm:grid-cols-[136px_minmax(0,1fr)_auto] sm:gap-4">
            <img
                src={props.thumbnailUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="aspect-video w-full rounded-lg bg-muted object-cover"
            />
            <div className="grid min-w-0 gap-1">
                {props.title}
                <p className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
                    {props.detail}
                </p>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={props.onClear}
                aria-label="Trocar o vídeo"
            >
                <CloseIcon aria-hidden="true" />
            </Button>
        </div>
    );
}

function describeFound(preview: Extract<YoutubePreview, { kind: "found" }>): string {
    const channel = preview.channel;

    if (channel === null) {
        return "YouTube · vídeo encontrado";
    }

    return `YouTube · ${channel}`;
}

interface YoutubeLinkPreviewProps {
    videoId: string;
    onClear: () => void;
}

/** The pasted video, so the person sees it is the right one before the crew starts. */
export function YoutubeLinkPreview({ videoId, onClear }: YoutubeLinkPreviewProps) {
    const previewQuery = useQuery(youtubePreviewQueryOptions(videoId));
    const preview = previewQuery.data;
    const thumbnailUrl = toYoutubeThumbnailUrl(videoId);

    if (preview === undefined && previewQuery.isError === false) {
        return (
            <PreviewCard
                thumbnailUrl={thumbnailUrl}
                title={<Skeleton className="h-4 w-4/5" aria-label="Buscando o vídeo" />}
                detail={<Skeleton className="h-3 w-24" />}
                onClear={onClear}
            />
        );
    }

    if (preview === undefined) {
        // The lookup is only a courtesy: the crew can still try the link.
        return (
            <PreviewCard
                thumbnailUrl={thumbnailUrl}
                title={<p className="font-bold">Vídeo do YouTube</p>}
                detail="Não deu para conferir agora; dá para gerar mesmo assim."
                onClear={onClear}
            />
        );
    }

    if (preview.kind === "unavailable") {
        return (
            <PreviewCard
                thumbnailUrl={thumbnailUrl}
                title={
                    <p role="alert" className="flex gap-1.5 text-sm font-semibold text-destructive">
                        <DangerCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {UNAVAILABLE_MESSAGES[preview.reason]}
                    </p>
                }
                detail="Cole outro link ou envie o arquivo."
                onClear={onClear}
            />
        );
    }

    return (
        <PreviewCard
            thumbnailUrl={preview.thumbnailUrl}
            title={<p className="line-clamp-2 leading-snug font-bold">{preview.title}</p>}
            detail={
                <>
                    <LinkIcon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{describeFound(preview)}</span>
                </>
            }
            onClear={onClear}
        />
    );
}
