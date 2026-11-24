import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { StudioStep } from "#/modules/studio/ui/components/studio-steps";

const STEP_INTROS: Record<StudioStep, { title: string; description: string }> = {
    trim: {
        title: "Onde o corte começa e termina",
        description: "Ajuste o início e o fim. A prévia toca só o trecho escolhido.",
    },
    captions: {
        title: "Revise as legendas",
        description: "Clique num bloco para corrigir o texto, dividir ou juntar.",
    },
    style: {
        title: "Como a legenda aparece",
        description: "Escolha um estilo pronto e ajuste os detalhes se quiser.",
    },
};

interface StudioToolPanelProps {
    step: StudioStep;
    /** The current step's tools. */
    children: ReactNode;
    footer: ReactNode;
}

/** Beside the stage: what the current step is for, its tools, and the way on. */
export function StudioToolPanel({ step, children, footer }: StudioToolPanelProps): ReactNode {
    const intro = STEP_INTROS[step];
    const titleRef = useRef<HTMLHeadingElement>(null);
    const previousStep = useRef(step);

    // The button that changed the step may leave with it, so focus lands on the new step's title.
    useEffect(() => {
        if (previousStep.current === step) {
            return;
        }

        previousStep.current = step;
        const title = titleRef.current;

        if (title === null) {
            return;
        }

        title.focus({ preventScroll: true });
    }, [step]);

    return (
        <section
            aria-labelledby="studio-step-title"
            className="flex min-h-0 flex-col bg-background @4xl/studio:border-s"
        >
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 @4xl/studio:overflow-y-auto @4xl/studio:p-6">
                <header className="grid gap-0.5">
                    <h2
                        ref={titleRef}
                        id="studio-step-title"
                        tabIndex={-1}
                        className="text-lg leading-tight font-semibold outline-none"
                    >
                        {intro.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">{intro.description}</p>
                </header>
                {children}
            </div>
            {footer}
        </section>
    );
}
