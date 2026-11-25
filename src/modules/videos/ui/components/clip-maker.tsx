import ScissorsIcon from "~icons/lucide/scissors";
import UploadIcon from "~icons/lucide/upload";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode, RefObject } from "react";
import { readSwitchState } from "#/modules/app-switches/model/app-switch";
import { appSwitchStatesQueryOptions } from "#/modules/app-switches/model/app-switch-queries";
import { FEATURE_TURNED_OFF_MESSAGES } from "#/modules/app-switches/model/feature-turned-off-error";
import type { Preferences } from "#/modules/preferences/model/preferences";
import { preferencesQueryOptions } from "#/modules/preferences/model/preferences-queries";
import type { ClipLength } from "#/modules/video-records/model/clip-length";
import { hasUsableSource } from "#/modules/videos/model/video-source";
import type { VideoSource } from "#/modules/videos/model/video-source";
import { describeYoutubeLinkProblem } from "#/modules/videos/model/youtube-url";
import { ClipCountPicker } from "#/modules/videos/ui/components/clip-count-picker";
import { ClipLengthPicker } from "#/modules/videos/ui/components/clip-length-picker";
import { useIsLinkBlocked } from "#/modules/videos/ui/hooks/use-is-link-blocked";
import { useVideoSubmission } from "#/modules/videos/ui/hooks/use-video-submission";
import { Button } from "#/shared/ui/button";
import { pluralize } from "#/shared/ui/pluralize";
import { Skeleton } from "#/shared/ui/skeleton";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const MISSING_LINK_MESSAGE = "Cole o link de um vídeo do YouTube.";
const BLOCKED_LINK_MESSAGE = "O YouTube não deixa usar esse vídeo. Tente outro link.";
const FALLBACK_ERROR_MESSAGE = "Não foi possível adicionar o vídeo. Tente de novo.";
const PREFERENCES_FAILED_MESSAGE =
    "Não foi possível carregar suas preferências de corte. Recarregue a página e tente de novo.";

const LENGTH_PHRASES: Readonly<Record<ClipLength, string>> = {
    short: "de cerca de 30 segundos",
    minute: "de cerca de 1 minuto",
    free: "do tamanho que cada trecho pedir",
};

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

function describeOrder(clipCount: number, clipLength: ClipLength): string {
    return `Você vai receber ${clipCount} ${pluralize(clipCount, "corte", "cortes")} ${LENGTH_PHRASES[clipLength]}, com legenda.`;
}

function UploadFileLink(): ReactNode {
    return (
        <Button asChild variant="secondary">
            <Link to="/videos" search={{ newVideo: true }}>
                <UploadIcon aria-hidden="true" />
                Enviar arquivo
            </Link>
        </Button>
    );
}

const CARD_CLASS = "grid gap-5 rounded-2xl border border-card-border bg-card p-5 sm:p-6";

/** In place of the card while links are paused: the full form still takes a file. */
function PausedLinkNotice(): ReactNode {
    return (
        <div className={CARD_CLASS}>
            <p className="text-muted-foreground">{FEATURE_TURNED_OFF_MESSAGES["youtube-links"]}</p>
            <div>
                <UploadFileLink />
            </div>
        </div>
    );
}

interface LinkFieldProps {
    id: string;
    inputRef: RefObject<HTMLInputElement | null>;
    value: string;
    problem: string | null;
    isBusy: boolean;
    onChange: (text: string) => void;
}

function LinkField({ id, inputRef, value, problem, isBusy, onChange }: LinkFieldProps): ReactNode {
    return (
        <div className="grid gap-1.5">
            <label htmlFor={`${id}-input`} className="text-sm font-medium">
                Link do vídeo no YouTube
            </label>
            <div className="flex h-12 items-center gap-3 rounded-xl border border-input bg-background px-4 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-ring/30">
                <ScissorsIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground"
                />
                <input
                    ref={inputRef}
                    id={`${id}-input`}
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    autoCapitalize="none"
                    enterKeyHint="send"
                    placeholder="youtube.com/watch?v=…"
                    value={value}
                    disabled={isBusy}
                    aria-invalid={problem !== null}
                    aria-describedby={id}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-full w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
            </div>
            <p id={id} role="status" className="min-h-5 text-sm text-destructive">
                {problem}
            </p>
        </div>
    );
}

/** The card itself, once the saved preferences are known: they are the starting choices. */
function ClipMakerForm({ preferences }: { preferences: Preferences }): ReactNode {
    const problemId = useId();
    const linkRef = useRef<HTMLInputElement>(null);
    const [text, setText] = useState("");
    const [clipCount, setClipCount] = useState(preferences.defaultClipCount);
    const [clipLength, setClipLength] = useState(preferences.defaultClipLength);
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

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        setIsSubmitAttempted(true);

        if (isBusy === true) {
            return;
        }

        if (isReady === false) {
            linkRef.current?.focus();
            return;
        }

        submission.mutate({
            source,
            clipCount,
            clipLength,
            title: "",
            language: preferences.transcriptionLanguage,
        });
    };

    return (
        <form noValidate onSubmit={submit} className={CARD_CLASS}>
            <LinkField
                id={problemId}
                inputRef={linkRef}
                value={text}
                problem={problem}
                isBusy={isBusy}
                onChange={(next) => {
                    setIsSubmitAttempted(false);
                    submission.reset();
                    setText(next);
                }}
            />
            <div className="grid items-start gap-5 md:grid-cols-2">
                <ClipCountPicker value={clipCount} onValueChange={setClipCount} />
                <ClipLengthPicker value={clipLength} onValueChange={setClipLength} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <p aria-live="polite" className="text-muted-foreground">
                    {describeOrder(clipCount, clipLength)}
                </p>
                <div className="flex flex-wrap gap-2 max-sm:w-full max-sm:*:flex-1">
                    <UploadFileLink />
                    <Button
                        type="submit"
                        className="font-bold"
                        disabled={isBusy}
                        aria-busy={isBusy}
                    >
                        <ScissorsIcon aria-hidden="true" />
                        Gerar cortes
                    </Button>
                </div>
            </div>
        </form>
    );
}

function ClipMakerWithPreferences(): ReactNode {
    const preferencesQuery = useQuery(preferencesQueryOptions());
    const preferences = preferencesQuery.data;

    if (preferencesQuery.isError === true) {
        return (
            <p role="alert" className={`${CARD_CLASS} text-destructive`}>
                {PREFERENCES_FAILED_MESSAGE}
            </p>
        );
    }

    if (preferences === undefined) {
        return <Skeleton className="h-72 w-full rounded-2xl" />;
    }

    return <ClipMakerForm preferences={preferences} />;
}

/**
 * Meus cortes' main action: paste a link, pick how many cuts and how long, and send. The choices
 * start from the saved preferences; a file or a title go through the full form.
 */
export function ClipMaker(): ReactNode {
    const { data: switches } = useQuery(appSwitchStatesQueryOptions());

    if (readSwitchState(switches, "youtube-links") === false) {
        return <PausedLinkNotice />;
    }

    return <ClipMakerWithPreferences />;
}
