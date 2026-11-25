export const EDIT_STATUSES = ["queued", "rendering", "done", "failed"] as const;

export type EditStatus = (typeof EDIT_STATUSES)[number];

export const EDIT_STATUS_LABELS: Readonly<Record<EditStatus, string>> = {
    queued: "Na fila",
    rendering: "Editando",
    done: "Pronta",
    failed: "Não deu certo",
};

export const EDIT_FORMATS = ["split-screen"] as const;

export type EditFormat = (typeof EDIT_FORMATS)[number];
