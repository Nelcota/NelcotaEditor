import ArrowUpIcon from "~icons/lucide/arrow-up";
import SquarePlusIcon from "~icons/lucide/square-plus";
import UploadIcon from "~icons/lucide/upload";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { preferencesQueryOptions } from "#/modules/preferences/model/preferences-queries";
import { useIsLinkBlocked } from "#/modules/videos/ui/hooks/use-is-link-blocked";
import { useVideoSubmission } from "#/modules/videos/ui/hooks/use-video-submission";
import { hasUsableSource } from "#/modules/videos/model/video-source";
import type { VideoSource } from "#/modules/videos/model/video-source";
import { describeYoutubeLinkProblem } from "#/modules/videos/model/youtube-url";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const MISSING_LINK_MESSAGE = "Cole o link de um vídeo do YouTube.";
const BLOCKED_LINK_MESSAGE = "O YouTube não deixa usar esse vídeo. Tente outro link.";
const FALLBACK_ERROR_MESSAGE = "Não foi possível adicionar o vídeo. Tente de novo.";
const PREFERENCES_FAILED_MESSAGE =
    "Não foi possível carregar suas preferências de corte. Recarregue a página e tente de novo.";

interface ProblemInput {
    text: string;
    isSubmitAttempted: boolean;
    isLinkBlocked: boolean;
}

/** What is wrong with the link, once the person tried to send it; null while all is well. */
function describeProblem({ text, isSubmitAttempted, isLinkBlocked }: ProblemInput): string | null {
    if (isLinkBlocked === true) {
        return BLOCKED_LINK_MESSAGE;
    }

    if (isSubmitAttempted === false) {
        return null;
    }

    if (text.trim().length === 0) {
        return MISSING_LINK_MESSAGE;
    }

    return describeYoutubeLinkProblem(text);
}

/**
 * The Início's prompt box (the reference's assistant field): paste a YouTube link and send, and the
 * video starts with the saved preferences. The plus opens the full form, for a file or other
 * settings.
 */
export function VideoLinkComposer(): ReactNode {
    const problemId = useId();
    const preferencesQuery = useQuery(preferencesQueryOptions());
    // No fallback to the defaults: the box sends without a review step, so a video must never go
    // out with other settings than the ones the person saved.
    const preferences = preferencesQuery.data;
    const [text, setText] = useState("");
    const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);
    const source: VideoSource = { kind: "link", text };
    const isLinkBlocked = useIsLinkBlocked(source);
    const { submission } = useVideoSubmission();
    const isBusy = submission.isPending;
    const isReady = hasUsableSource(source) === true && isLinkBlocked === false;
    let problem = describeProblem({ text, isSubmitAttempted, isLinkBlocked });

    if (submission.isError === true) {
        problem = toErrorMessage(submission.error, FALLBACK_ERROR_MESSAGE);
    }

    if (preferencesQuery.isError === true) {
        problem = PREFERENCES_FAILED_MESSAGE;
    }

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        setIsSubmitAttempted(true);

        if (isReady === false || isBusy === true || preferences === undefined) {
            return;
        }

        submission.mutate({
            source,
            clipCount: preferences.defaultClipCount,
            clipLength: preferences.defaultClipLength,
            title: "",
            language: preferences.transcriptionLanguage,
        });
    };

    return (
        <form noValidate onSubmit={submit} className="grid w-full gap-2">
            <div className="grid gap-10 rounded-3xl border border-input/40 bg-card px-5 pt-5 pb-4 transition-[border-color,box-shadow] focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-ring">
                <label htmlFor={`${problemId}-input`} className="sr-only">
                    Link do vídeo no YouTube
                </label>
                <input
                    id={`${problemId}-input`}
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    autoCapitalize="none"
                    enterKeyHint="send"
                    placeholder="youtube.com/watch?v=…"
                    value={text}
                    disabled={isBusy}
                    aria-invalid={problem !== null}
                    aria-describedby={problemId}
                    onChange={(event) => {
                        setIsSubmitAttempted(false);
                        submission.reset();
                        setText(event.target.value);
                    }}
                    className="w-full min-w-0 bg-transparent text-base outline-none sm:text-lg placeholder:text-muted-foreground"
                />
                <div className="flex items-center gap-1.5">
                    <HintTooltip label="Enviar um arquivo ou mudar as opções">
                        <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                        >
                            <Link
                                to="/videos"
                                search={{ newVideo: true }}
                                aria-label="Enviar um arquivo ou mudar as opções"
                            >
                                <SquarePlusIcon aria-hidden="true" />
                            </Link>
                        </Button>
                    </HintTooltip>
                    <span className="flex-1" />
                    <HintTooltip label="Enviar um arquivo do computador">
                        <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                        >
                            <Link
                                to="/videos"
                                search={{ newVideo: true }}
                                aria-label="Enviar um arquivo do computador"
                            >
                                <UploadIcon aria-hidden="true" />
                            </Link>
                        </Button>
                    </HintTooltip>
                    <Button
                        type="submit"
                        size="icon-sm"
                        aria-label="Cortar este vídeo"
                        disabled={isBusy === true || preferencesQuery.isPending === true}
                        aria-busy={isBusy === true || preferencesQuery.isPending === true}
                        className={cn(
                            "rounded-full",
                            isReady === false &&
                                "bg-secondary text-muted-foreground not-disabled:hover:bg-accent",
                        )}
                    >
                        <ArrowUpIcon aria-hidden="true" />
                    </Button>
                </div>
            </div>
            <p id={problemId} role="status" className="min-h-5 px-1 text-xs text-destructive">
                {problem}
            </p>
        </form>
    );
}
