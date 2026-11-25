import ScissorsIcon from "~icons/lucide/scissors";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";
import { LessonPlayer } from "#/shared/ui/lesson-player";
import type { Lesson } from "#/shared/ui/lesson-player";

const CLIPS_LESSON: Lesson = {
    eyebrow: "Aula",
    title: "Como fazer seus cortes",
    durationLabel: null,
    videoUrl: null,
};

const HOW_IT_WORKS: ReadonlyArray<{ id: string; text: ReactNode }> = [
    {
        id: "link",
        text: (
            <>
                Em <strong>Meus cortes</strong>, cole o link do YouTube ou envie um arquivo.
            </>
        ),
    },
    {
        id: "count",
        text: (
            <>
                Escolha <strong>quantos cortes</strong> você quer.
            </>
        ),
    },
    {
        id: "receive",
        text: (
            <>
                Receba os cortes com legenda e <strong>nota</strong> de potencial.
            </>
        ),
    },
    {
        id: "download",
        text: (
            <>
                <strong>Baixe</strong> ou ajuste cada corte no Studio.
            </>
        ),
    },
];

/** Cortes' own "Comece por aqui": the lesson and how a long video becomes clips. */
export function ClipsGettingStartedScreen(): ReactNode {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <header className="grid max-w-2xl gap-2">
                <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Cortes
                </p>
                <h1 className="text-title font-extrabold tracking-[-0.02em] sm:text-4xl">
                    Comece por aqui
                </h1>
                <p className="max-w-xl text-pretty text-muted-foreground">
                    Veja como transformar um vídeo longo em vários cortes prontos para postar.
                </p>
            </header>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <LessonPlayer lesson={CLIPS_LESSON} />
                <section
                    aria-labelledby="how-clips-work"
                    className="grid gap-4 rounded-2xl border border-card-border p-6"
                >
                    <h2 id="how-clips-work" className="text-lg font-bold">
                        Como funciona
                    </h2>
                    <ol className="grid list-inside list-decimal gap-2.5 marker:font-bold marker:text-primary-ink">
                        {HOW_IT_WORKS.map((step) => (
                            <li key={step.id}>{step.text}</li>
                        ))}
                    </ol>
                    <Button asChild size="lg" className="mt-1 font-bold">
                        <Link to="/clips">
                            <ScissorsIcon aria-hidden="true" className="size-4" />
                            Fazer meu primeiro corte
                        </Link>
                    </Button>
                </section>
            </div>
        </div>
    );
}
