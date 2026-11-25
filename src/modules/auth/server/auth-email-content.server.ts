import { z } from "zod";

export const AUTH_EMAIL_KINDS = ["verify-email", "reset-password", "existing-account"] as const;

export type AuthEmailKind = (typeof AUTH_EMAIL_KINDS)[number];

/** The job payload: what the worker needs to write and send one auth email. */
export const authEmailJobSchema = z.object({
    kind: z.enum(AUTH_EMAIL_KINDS),
    to: z.email(),
    // Null for accounts whose address was never confirmed: whoever typed that name may not own it.
    name: z.string().trim().min(1).nullable(),
    url: z.url({ protocol: /^https?$/ }),
});

export type AuthEmailJob = z.infer<typeof authEmailJobSchema>;

export interface AuthEmailContent {
    subject: string;
    html: string;
    text: string;
}

interface AuthEmailCopy {
    subject: string;
    paragraphs: Array<string>;
    buttonLabel: string;
    closing: string;
}

const LINK_LIFETIME_NOTE = "O link vale por 1 hora.";
const NEUTRAL_GREETING = "Olá.";

function greet(name: string | null): string {
    if (name === null) {
        return NEUTRAL_GREETING;
    }

    return `Olá, ${name}.`;
}

/**
 * Anyone can sign up with someone else's address and a name like "visit scam.example", so a name
 * reaches an inbox only after its owner confirmed the address.
 */
export function pickGreetingName(recipient: {
    name: string;
    emailVerified: boolean;
}): string | null {
    if (recipient.emailVerified === false) {
        return null;
    }

    return recipient.name;
}

const AUTH_EMAIL_COPY: Record<AuthEmailKind, (name: string | null) => AuthEmailCopy> = {
    // Always sent before the address is confirmed, so it never carries the typed name.
    "verify-email": () => ({
        subject: "Confirme seu email no Nelcota",
        paragraphs: [
            NEUTRAL_GREETING,
            `Para ativar sua conta, confirme seu email. ${LINK_LIFETIME_NOTE}`,
        ],
        buttonLabel: "Confirmar email",
        closing: "Se você não criou uma conta no Nelcota, ignore este email.",
    }),
    "reset-password": (name) => ({
        subject: "Redefina sua senha do Nelcota",
        paragraphs: [
            greet(name),
            `Recebemos um pedido para redefinir sua senha. ${LINK_LIFETIME_NOTE}`,
        ],
        buttonLabel: "Escolher nova senha",
        closing: "Se não foi você, ignore este email. Sua senha continua a mesma.",
    }),
    "existing-account": (name) => ({
        subject: "Tentativa de cadastro com seu email",
        paragraphs: [
            greet(name),
            "Alguém tentou criar uma conta no Nelcota com este email, mas você já tem uma. Se foi você e esqueceu a senha, redefina pelo link abaixo.",
        ],
        buttonLabel: "Redefinir senha",
        closing: "Se não foi você, ignore este email. Nada mudou na sua conta.",
    }),
};

const HTML_ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};
const HTML_SPECIAL_CHARACTERS = /[&<>"']/g;

/** The name is typed by whoever signed up, so it never reaches the HTML as markup. */
function escapeHtml(value: string): string {
    return value.replace(HTML_SPECIAL_CHARACTERS, (character) => HTML_ESCAPES[character] ?? "");
}

function buildHtml(copy: AuthEmailCopy, url: string): string {
    const paragraphs = copy.paragraphs
        .map((paragraph) => `<p style="margin:0 0 16px">${escapeHtml(paragraph)}</p>`)
        .join("");
    const link = escapeHtml(url);

    return [
        '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#18181b;max-width:560px">',
        paragraphs,
        `<p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${escapeHtml(copy.buttonLabel)}</a></p>`,
        `<p style="margin:0 0 16px;font-size:14px;color:#52525b">Se o botão não abrir, copie este endereço no navegador:<br>${link}</p>`,
        `<p style="margin:0;font-size:14px;color:#52525b">${escapeHtml(copy.closing)}</p>`,
        "</div>",
    ].join("");
}

function buildText(copy: AuthEmailCopy, url: string): string {
    return [...copy.paragraphs, url, copy.closing].join("\n\n");
}

export function buildAuthEmail(job: AuthEmailJob): AuthEmailContent {
    const copy = AUTH_EMAIL_COPY[job.kind](job.name);

    return {
        subject: copy.subject,
        html: buildHtml(copy, job.url),
        text: buildText(copy, job.url),
    };
}
