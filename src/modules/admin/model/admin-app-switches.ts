import { z } from "zod";
import {
    DEFAULT_APP_SWITCH_STATES,
    appSwitchKeySchema,
} from "#/modules/app-switches/model/app-switch";
import type { AppSwitchKey } from "#/modules/app-switches/model/app-switch";

/** Dates cross the server function boundary as ISO strings; null for a switch never changed. */
export interface AdminAppSwitch {
    key: AppSwitchKey;
    isEnabled: boolean;
    changedAt: string | null;
    changedByName: string | null;
}

export const setAdminAppSwitchInputSchema = z.object({
    key: appSwitchKeySchema,
    isEnabled: z.boolean(),
});

export type SetAdminAppSwitchInput = z.infer<typeof setAdminAppSwitchInputSchema>;

interface AppSwitchConfirmation {
    title: string;
    description: string;
    confirmLabel: string;
}

export interface AppSwitchCopy {
    label: string;
    description: string;
    /** For a switch that locks people out, asked before it moves in that direction. */
    confirmation: AppSwitchConfirmation | null;
    /** The switch state that needs the confirmation. */
    confirmWhenEnabled: boolean;
}

export interface AppSwitchGroup {
    title: string;
    keys: ReadonlyArray<AppSwitchKey>;
}

export const APP_SWITCH_GROUPS: ReadonlyArray<AppSwitchGroup> = [
    { title: "Contas", keys: ["sign-up", "email-verification"] },
    { title: "Envio de vídeos", keys: ["youtube-links", "file-uploads"] },
    { title: "Processamento e cortes", keys: ["video-processing", "clip-sharing"] },
    { title: "Sistema", keys: ["maintenance-mode"] },
];

export const APP_SWITCH_COPY: Readonly<Record<AppSwitchKey, AppSwitchCopy>> = {
    "sign-up": {
        label: "Cadastro de novas contas",
        description:
            "Desligado, a tela Criar conta avisa que os cadastros estão fechados. Quem já tem conta entra normalmente.",
        confirmation: {
            title: "Fechar os cadastros?",
            description: "Ninguém consegue criar conta até você ligar de novo.",
            confirmLabel: "Fechar cadastros",
        },
        confirmWhenEnabled: false,
    },
    "email-verification": {
        label: "Confirmação de email no cadastro",
        description:
            "Desligado, contas novas entram sem confirmar o email. Qualquer pessoa pode criar conta com um email que não é dela.",
        confirmation: {
            title: "Dispensar a confirmação de email?",
            description:
                "Contas criadas enquanto estiver desligado ficam valendo sem confirmação, mesmo depois que você ligar de novo.",
            confirmLabel: "Dispensar confirmação",
        },
        confirmWhenEnabled: false,
    },
    "youtube-links": {
        label: "Envio por link do YouTube",
        description:
            "Desligado, o campo de link some e quem tentar recebe um aviso. Vídeos já na fila continuam.",
        confirmation: null,
        confirmWhenEnabled: false,
    },
    "file-uploads": {
        label: "Upload de arquivo",
        description: "Desligado, novos uploads são recusados. Uploads já começados terminam.",
        confirmation: null,
        confirmWhenEnabled: false,
    },
    "video-processing": {
        label: "Processamento de vídeos",
        description:
            "Desligado, os vídeos novos esperam na fila. Os que já estão sendo processados terminam.",
        confirmation: null,
        confirmWhenEnabled: false,
    },
    "clip-sharing": {
        label: "Compartilhamento de cortes",
        description: "Desligado, links já enviados param de abrir e ninguém cria novos.",
        confirmation: null,
        confirmWhenEnabled: false,
    },
    "maintenance-mode": {
        label: "Modo manutenção",
        description:
            "Ligado, só admins usam o app. Os demais veem uma página de manutenção; o processamento continua.",
        confirmation: {
            title: "Ligar o modo manutenção?",
            description:
                "Todos que não são admin saem do app e veem a página de manutenção até você desligar.",
            confirmLabel: "Ligar manutenção",
        },
        confirmWhenEnabled: true,
    },
};

/** A paused feature, or maintenance turned on: what the page warns about at the top. */
export function isAppSwitchAwayFromDefault(key: AppSwitchKey, isEnabled: boolean): boolean {
    return isEnabled !== DEFAULT_APP_SWITCH_STATES[key];
}
