import { z } from "zod";
import { EDIT_FORMATS } from "#/modules/viral-formats/model/edit-status";
import type { EditFormat } from "#/modules/viral-formats/model/edit-status";
import type { EditView } from "#/modules/viral-formats/model/edit-view";
import type { VideoStatus } from "#/modules/video-records/model/video-status";

/**
 * collecting: the person is still adding raw videos and adjustments. queued: they clicked Começar a
 * editar, so their Claude finds the session in its queue and edits every video in it.
 */
export const EDIT_SESSION_STATUSES = ["collecting", "queued"] as const;

export type EditSessionStatus = (typeof EDIT_SESSION_STATUSES)[number];

export const EDIT_SESSION_STATUS_LABELS: Readonly<Record<EditSessionStatus, string>> = {
    collecting: "Aguardando vídeos brutos",
    queued: "Na fila do Claude",
};

/** One batch is one sitting for Claude; more videos go in another edit. */
export const MAX_SESSION_VIDEOS = 20;
export const MAX_SESSION_NOTE_LENGTH = 1000;
/** Enough room to steer a batch; a longer back and forth belongs in Claude itself. */
export const MAX_SESSION_NOTES = 30;
/** The sidebar and Minhas edições show the latest ones. */
export const MAX_LISTED_SESSIONS = 30;

const FORMAT_NAMES: Readonly<Record<EditFormat, string>> = {
    "split-screen": "Tela dividida",
    "this-or-that": "Contraste",
    generic: "Dinâmico gamificado",
};

export function toFormatName(format: EditFormat): string {
    return FORMAT_NAMES[format];
}

/** "Tela dividida #2": the format and the person's count of edits in it. */
export function toEditSessionTitle(format: EditFormat, number: number): string {
    if (Number.isSafeInteger(number) === false || number < 1) {
        throw new RangeError(`An edit session number starts at 1, got ${String(number)}`);
    }

    return `${toFormatName(format)} #${number}`;
}

export const editSessionIdInputSchema = z.object({ sessionId: z.uuid() });

export const createEditSessionInputSchema = z.object({ format: z.enum(EDIT_FORMATS) });

export const sessionVideoInputSchema = z.object({ sessionId: z.uuid(), videoId: z.uuid() });

export const sessionNoteInputSchema = z.object({
    sessionId: z.uuid(),
    body: z.string().trim().min(1).max(MAX_SESSION_NOTE_LENGTH),
});

export interface EditSessionSummary {
    id: string;
    title: string;
    format: EditFormat;
    status: EditSessionStatus;
    videoCount: number;
    createdAt: string;
}

/** A raw video in the batch, with how far its storing and transcription got. */
export interface SessionVideo {
    id: string;
    title: string;
    status: VideoStatus;
    progressPercent: number;
    durationSeconds: number | null;
    sourceBytes: number | null;
    /** A frame the worker took, once the file was read; null before that. */
    thumbnailUrl: string | null;
    isReady: boolean;
    hasFailed: boolean;
}

export interface SessionNote {
    id: string;
    body: string;
    createdAt: string;
}

export interface EditSessionView extends EditSessionSummary {
    videos: Array<SessionVideo>;
    notes: Array<SessionNote>;
    edits: Array<EditView>;
}

/** At most this many queued batches go to Claude at once; the rest wait for the next call. */
export const MAX_QUEUED_SESSIONS_FOR_CLAUDE = 5;

/** What the person's Claude reads to edit a queued batch. */
export interface QueuedEditSession {
    sessionId: string;
    title: string;
    format: EditFormat;
    adjustments: Array<string>;
    videos: Array<{
        videoId: string;
        title: string;
        durationSeconds: number | null;
        isTranscribed: boolean;
        hasEdit: boolean;
    }>;
}
