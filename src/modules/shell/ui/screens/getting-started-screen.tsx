import type { ReactNode } from "react";
import { GettingStartedChecklist } from "#/modules/shell/ui/components/getting-started-checklist";
import { WelcomeLessonPlayer } from "#/modules/shell/ui/components/welcome-lesson-player";
import { useGettingStartedChecklist } from "#/modules/shell/ui/hooks/use-getting-started-checklist";

/** "Comece por aqui": the welcome lesson beside the checklist of what to set up first. */
export function GettingStartedScreen(): ReactNode {
    const checklist = useGettingStartedChecklist();

    return (
        <div className="grid gap-8">
            <header className="grid max-w-2xl gap-2">
                <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Comece por aqui
                </p>
                <h1 className="text-title font-extrabold tracking-[-0.02em] sm:text-4xl">
                    Boas-vindas ao Editor Oculto
                </h1>
                <p className="text-muted-foreground">
                    Antes de editar seu primeiro vídeo, assista à aula. Ela mostra como criar sua
                    conta no Claude, instalar no computador e ativar o plano Pro.
                </p>
            </header>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <WelcomeLessonPlayer onFinished={() => checklist.markDone("lesson")} />
                <GettingStartedChecklist
                    entries={checklist.entries}
                    doneCount={checklist.doneCount}
                    totalCount={checklist.totalCount}
                />
            </div>
        </div>
    );
}
