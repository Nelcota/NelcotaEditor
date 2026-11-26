import { z } from "zod";

/** Built by the web server, which knows the app's address; the worker only sends it. */
export const supportEmailJobSchema = z.object({
    to: z.email(),
    ticketNumber: z.number().int().positive(),
    /** The ticket's page; null for a guest, who cannot sign in to read it. */
    url: z.url({ protocol: /^https?$/ }).nullable(),
    /** The answer itself, sent only to guests. */
    replyText: z.string().min(1).nullable(),
});

export type SupportEmailJob = z.infer<typeof supportEmailJobSchema>;

export interface SupportEmailContent {
    subject: string;
    html: string;
    text: string;
}

const HTML_ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};
const HTML_SPECIAL_CHARACTERS = /[&<>"']/g;
const LINE_BREAKS = /\r?\n/g;

/** The answer is an admin's free text, so it never reaches the HTML as markup. */
function escapeHtml(value: string): string {
    return value.replace(HTML_SPECIAL_CHARACTERS, (character) => HTML_ESCAPES[character] ?? "");
}

const WRAPPER_START =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#18181b;max-width:560px">';
const PARAGRAPH_START = '<p style="margin:0 0 16px">';
const NOTE_START = '<p style="margin:0;font-size:14px;color:#52525b">';
const NO_REPLY_NOTE = "Este email não recebe respostas.";

/** An account holder gets a link only: the answer stays behind their sign-in. */
function buildAccountEmail(job: SupportEmailJob, url: string): SupportEmailContent {
    const intro = `Respondemos sua conversa #${job.ticketNumber}. Abra a conversa para ler a resposta e continuar.`;
    const link = escapeHtml(url);

    return {
        subject: `Respondemos sua conversa #${job.ticketNumber}`,
        html: [
            WRAPPER_START,
            `${PARAGRAPH_START}${escapeHtml(intro)}</p>`,
            `<p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#C4F800;color:#0D0D0C;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">Abrir conversa</a></p>`,
            `${NOTE_START}${NO_REPLY_NOTE}</p>`,
            "</div>",
        ].join(""),
        text: [intro, url, NO_REPLY_NOTE].join("\n\n"),
    };
}

function buildGuestEmail(job: SupportEmailJob, replyText: string): SupportEmailContent {
    const intro = `Esta é a resposta à sua mensagem para o suporte do Editor Oculto (#${job.ticketNumber}).`;
    const closing = "Para continuar, envie uma nova mensagem pelo formulário de contato.";
    const replyHtml = escapeHtml(replyText).replace(LINE_BREAKS, "<br>");

    return {
        subject: `Resposta do suporte do Editor Oculto (#${job.ticketNumber})`,
        html: [
            WRAPPER_START,
            `${PARAGRAPH_START}${escapeHtml(intro)}</p>`,
            `<p style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #d4d4d8">${replyHtml}</p>`,
            `${NOTE_START}${escapeHtml(closing)} ${NO_REPLY_NOTE}</p>`,
            "</div>",
        ].join(""),
        text: [intro, replyText, `${closing} ${NO_REPLY_NOTE}`].join("\n\n"),
    };
}

export function buildSupportEmail(job: SupportEmailJob): SupportEmailContent {
    const { url, replyText } = job;

    if (url !== null) {
        return buildAccountEmail(job, url);
    }

    if (replyText === null) {
        throw new RangeError(`Support email for ticket #${job.ticketNumber} has no link or reply`);
    }

    return buildGuestEmail(job, replyText);
}
