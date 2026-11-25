import type { Lesson } from "#/shared/ui/lesson-player";
export type ChecklistStepId = "lesson" | "account" | "install" | "pro";

export interface ChecklistStep {
    id: ChecklistStepId;
    title: string;
    description: string;
}

export const CHECKLIST_STEPS: ReadonlyArray<ChecklistStep> = [
    {
        id: "lesson",
        title: "Assisti à aula de boas-vindas",
        description: "O passo a passo completo está no vídeo ao lado.",
    },
    {
        id: "account",
        title: "Criei minha conta no Claude",
        description: "Se ainda não tem, crie em claude.ai com seu e-mail.",
    },
    {
        id: "install",
        title: "Instalei o Claude no computador",
        description: "Baixe o app para Mac ou Windows.",
    },
    {
        id: "pro",
        title: "Ativei o plano Pro",
        description: "O Editor Oculto precisa do Claude Pro para funcionar.",
    },
];

export interface ClaudeLink {
    label: string;
    href: string;
}

export const CLAUDE_LINKS: ReadonlyArray<ClaudeLink> = [
    { label: "Baixar o Claude", href: "https://claude.ai/download" },
    { label: "Criar conta no Claude", href: "https://claude.ai/login" },
    { label: "Ativar o plano Pro", href: "https://claude.ai/upgrade" },
];

export const WELCOME_LESSON: Lesson = {
    eyebrow: "Aula 1",
    title: "Como instalar o Claude e ativar o Pro",
    durationLabel: "8 min",
    videoUrl: null,
};

/** Per person, so two people sharing a browser keep their own progress. */
export function toChecklistStorageKey(userId: string, stepId: ChecklistStepId): string {
    if (userId.trim().length === 0) {
        throw new Error("A checklist key needs the user's id");
    }

    return `editor-oculto:getting-started:${userId}:${stepId}`;
}
