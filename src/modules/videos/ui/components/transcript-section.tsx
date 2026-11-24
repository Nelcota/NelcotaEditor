import ChevronDownIcon from "~icons/lucide/chevron-down";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TranscriptBody } from "#/modules/videos/ui/components/transcript-body";
import { transcriptQueryOptions } from "#/modules/videos/ui/hooks/transcript-queries";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { FormAlert } from "#/shared/ui/form-alert";
import { Skeleton } from "#/shared/ui/skeleton";

const TRANSCRIPT_PANEL_ID = "transcript-panel";
const TRANSCRIPT_HINT_ID = "transcript-hint";

interface TranscriptContentProps {
    videoId: string;
    currentSeconds: number;
    onSeek: (seconds: number) => void;
}

interface TranscriptSectionProps extends TranscriptContentProps {
    /** Where the transcript is the point of the page, it starts open and is fetched right away. */
    isInitiallyOpen?: boolean;
}

function TranscriptLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="grid justify-items-start gap-3">
            <FormAlert message={message} />
            <Button variant="secondary" onClick={onRetry}>
                <RotateCwIcon aria-hidden="true" />
                Tentar de novo
            </Button>
        </div>
    );
}

function TranscriptContent({ videoId, currentSeconds, onSeek }: TranscriptContentProps) {
    const transcriptQuery = useQuery(transcriptQueryOptions(videoId));
    const transcript = transcriptQuery.data;

    if (transcriptQuery.isError === true && transcript === undefined) {
        return (
            <TranscriptLoadError
                message={transcriptQuery.error.message}
                onRetry={async () => {
                    await transcriptQuery.refetch();
                }}
            />
        );
    }

    if (transcript === undefined) {
        return (
            <Skeleton
                className="h-40 rounded-xl"
                aria-busy="true"
                aria-label="Carregando transcrição"
            />
        );
    }

    if (transcript === null) {
        return (
            <p className="text-sm text-muted-foreground">
                A transcrição aparece aqui quando a Tinta terminar.
            </p>
        );
    }

    return (
        <TranscriptBody lines={transcript.lines} currentSeconds={currentSeconds} onSeek={onSeek} />
    );
}

/** The section title is the toggle itself, so the heading and the control read as one. */
function TranscriptToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
    return (
        <div className="grid gap-0.5">
            <h2 id="transcript-title" className="text-lg leading-tight font-semibold">
                <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={TRANSCRIPT_PANEL_ID}
                    aria-describedby={TRANSCRIPT_HINT_ID}
                    onClick={onToggle}
                    className="group flex w-full items-center justify-between gap-3 rounded-lg text-start outline-none focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
                >
                    Transcrição
                    <ChevronDownIcon
                        className={cn(
                            "size-5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground",
                            isOpen === true && "rotate-180",
                        )}
                        aria-hidden="true"
                    />
                </button>
            </h2>
            <p id={TRANSCRIPT_HINT_ID} className="text-sm text-muted-foreground">
                Toque numa fala para levar o vídeo original até ela.
            </p>
        </div>
    );
}

/** What was said, line by line; opening it is the only moment it is fetched. */
export function TranscriptSection({ isInitiallyOpen = false, ...props }: TranscriptSectionProps) {
    const [isOpen, setIsOpen] = useState(isInitiallyOpen);

    return (
        <section
            id="transcricao"
            aria-labelledby="transcript-title"
            className="grid scroll-mt-6 gap-3 rounded-2xl border bg-popover p-4 sm:p-5"
        >
            <TranscriptToggle
                isOpen={isOpen}
                onToggle={() => setIsOpen((wasOpen) => wasOpen === false)}
            />
            {isOpen === true && (
                <div id={TRANSCRIPT_PANEL_ID}>
                    <TranscriptContent {...props} />
                </div>
            )}
        </section>
    );
}
