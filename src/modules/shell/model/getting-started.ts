import PlayIcon from "~icons/lucide/play";
import type { NavSection } from "#/modules/shell/model/nav-sections";

export const GETTING_STARTED_PATH = "/getting-started";

export const GETTING_STARTED_SECTION: NavSection = {
    path: GETTING_STARTED_PATH,
    label: "Comece por aqui",
    icon: PlayIcon,
};

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

export interface WelcomeLesson {
    title: string;
    durationLabel: string;
    /** Null until the lesson is published; the player says so instead of playing. */
    videoUrl: string | null;
}

export const WELCOME_LESSON: WelcomeLesson = {
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
