import PlayIcon from "~icons/lucide/play";
import { useState } from "react";
import type { ReactNode } from "react";
import { WELCOME_LESSON } from "#/modules/shell/model/getting-started";

const NOT_PUBLISHED_MESSAGE = "A aula ainda não foi publicada. Volte em breve.";

interface WelcomeLessonPlayerProps {
    onFinished: () => void;
}

function LessonCaption(): ReactNode {
    return (
        <div className="flex items-end justify-between gap-3">
            <div className="grid gap-1">
                <span className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Aula 1
                </span>
                <span className="text-lg font-bold text-foreground">{WELCOME_LESSON.title}</span>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground tabular-nums">
                {WELCOME_LESSON.durationLabel}
            </span>
        </div>
    );
}

/** The welcome lesson; it checks "Assisti à aula" once it plays to the end. */
export function WelcomeLessonPlayer({ onFinished }: WelcomeLessonPlayerProps): ReactNode {
    const [isPlaying, setIsPlaying] = useState(false);
    const [notice, setNotice] = useState("");
    const videoUrl = WELCOME_LESSON.videoUrl;

    function startLesson(): void {
        if (videoUrl === null) {
            setNotice(NOT_PUBLISHED_MESSAGE);
            return;
        }

        setIsPlaying(true);
    }

    if (isPlaying === true && videoUrl !== null) {
        return (
            <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                onEnded={onFinished}
                className="aspect-video w-full rounded-2xl bg-stage"
            >
                <track kind="captions" />
            </video>
        );
    }

    return (
        <div className="grid gap-2">
            <div className="flex flex-col gap-6 rounded-2xl border border-card-border bg-card px-5 pt-10 pb-4 sm:aspect-video sm:pt-4">
                <div className="grid flex-1 place-items-center">
                    <button
                        type="button"
                        onClick={startLesson}
                        aria-label={`Assistir à aula: ${WELCOME_LESSON.title}`}
                        className="grid size-21 place-items-center rounded-full bg-primary-solid text-primary-foreground ring-12 ring-primary-solid/12 outline-none transition-[background-color,scale] hover:bg-primary-solid-hover focus-visible:ring-ring motion-safe:active:scale-99"
                    >
                        <PlayIcon
                            aria-hidden="true"
                            className="ms-1 size-8 fill-current *:fill-current"
                        />
                    </button>
                </div>
                <LessonCaption />
            </div>
            <p role="status" className="text-sm text-muted-foreground">
                {notice}
            </p>
        </div>
    );
}
