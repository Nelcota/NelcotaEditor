import CloseIcon from "~icons/solar/close-linear";
import DangerCircleIcon from "~icons/solar/danger-circle-linear";
import LinkIcon from "~icons/solar/link-linear";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import type { YoutubePreview } from "#/modules/videos/youtube-preview";
import { toYoutubeThumbnailUrl } from "#/modules/videos/youtube-preview";
import { youtubePreviewQueryOptions } from "#/modules/videos/ui/youtube-preview-queries";
import { Button } from "#/shared/ui/button";
import { Skeleton } from "#/shared/ui/skeleton";

const UNAVAILABLE_MESSAGES: Record<"private" | "not-found", string> = {
    private: "Esse vídeo é privado. Deixe como público ou não listado, ou envie o arquivo.",
    "not-found": "Não achamos esse vídeo. Confira se o link está completo.",
};

interface PreviewCardProps {
    thumbnailUrl: string;
    title: ReactNode;
    detail: ReactNode;
    onClear: () => void;
    clearButtonRef: RefObject<HTMLButtonElement | null>;
}

function PreviewCard({ thumbnailUrl, title, detail, onClear, clearButtonRef }: PreviewCardProps) {
    return (
        <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-background p-2.5 min-[400px]:grid-cols-[96px_minmax(0,1fr)_auto] sm:grid-cols-[136px_minmax(0,1fr)_auto] sm:gap-4">
            <img
                src={thumbnailUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="aspect-video w-full rounded-[5px] bg-muted object-cover outline outline-1 -outline-offset-1 outline-white/10"
            />
            <div className="grid min-w-0 gap-1">
                {title}
                {/* A div: the loading detail is a Skeleton (a div), which a <p> cannot hold. */}
                <div className="flex items-center gap-1.5 text-meta text-muted-foreground">
                    {detail}
                </div>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                ref={clearButtonRef}
                onClick={onClear}
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
    const clearButtonRef = useRef<HTMLButtonElement>(null);

    // This card replaces the link field the person was typing in; without this, focus would
    // fall to the page.
    useEffect(() => {
        clearButtonRef.current?.focus();
    }, []);

    if (preview === undefined && previewQuery.isError === false) {
        return (
            <PreviewCard
                thumbnailUrl={thumbnailUrl}
                title={
                    <span role="status">
                        <Skeleton className="h-4 w-4/5" />
                        <span className="sr-only">Buscando o vídeo</span>
                    </span>
                }
                detail={<Skeleton className="h-3 w-24" />}
                onClear={onClear}
                clearButtonRef={clearButtonRef}
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
                clearButtonRef={clearButtonRef}
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
                clearButtonRef={clearButtonRef}
            />
        );
    }

    return (
        <PreviewCard
            thumbnailUrl={preview.thumbnailUrl}
            title={
                <p className="leading-snug font-bold [overflow-wrap:anywhere]">{preview.title}</p>
            }
            detail={
                <>
                    <LinkIcon className="size-4 shrink-0" aria-hidden="true" />
                    <span title={describeFound(preview)} className="truncate">
                        {describeFound(preview)}
                    </span>
                </>
            }
            onClear={onClear}
            clearButtonRef={clearButtonRef}
        />
    );
}
