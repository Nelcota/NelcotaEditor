import { McpServer } from "@modelcontextprotocol/server";
import type { CallToolResult } from "@modelcontextprotocol/server";
import { z } from "zod";
import { findOwnedVideoOrNull } from "#/modules/video-records/server/find-owned-video.server";
import { findTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import { ALL_FILTER } from "#/modules/videos/model/video-list-filter";
import { DEFAULT_VIDEO_SORT } from "#/modules/videos/model/video-sort";
import { listUserVideosPage } from "#/modules/videos/server/video-queries.server";
import { MCP_RESOURCE } from "#/modules/auth/server/auth.server";
import { contrastPlanSchema } from "#/modules/viral-formats/model/contrast-plan";
import { InvalidEditPlanError } from "#/modules/viral-formats/model/edit-errors";
import { isEditFormat } from "#/modules/viral-formats/model/edit-status";
import { gamifiedPlanSchema } from "#/modules/viral-formats/model/gamified-plan";
import { splitScreenPlanSchema } from "#/modules/viral-formats/model/split-screen-plan";
import { VIRAL_FORMATS } from "#/modules/viral-formats/model/viral-formats";
import { createFormatEdit } from "#/modules/viral-formats/server/create-format-edit.server";
import type { FormatEditRequest } from "#/modules/viral-formats/server/create-format-edit.server";
import { findUserEdit, listUserEdits } from "#/modules/viral-formats/server/edit-queries.server";
import { listQueuedEditSessions } from "#/modules/viral-formats/server/edit-session-queries.server";

const SERVER_NAME = "editor-oculto";
const SERVER_VERSION = "1.0.0";
/** Enough for Claude to pick a recent video; older ones are found by title in the app. */
const MAX_LISTED_VIDEOS = 25;
const DEFAULT_LISTED_VIDEOS = 10;

const listVideosInputSchema = z.object({
    limit: z
        .number()
        .int()
        .min(1)
        .max(MAX_LISTED_VIDEOS)
        .default(DEFAULT_LISTED_VIDEOS)
        .describe("How many of the most recent videos to return."),
});

/** Where the person sees and downloads their edits. */
const EDITS_PAGE_URL = new URL("/edits", MCP_RESOURCE).toString();

const SPLIT_SCREEN_GUIDE = [
    "Edits a raw talking-head video in the Tela dividida format: an example video in the top panel, the presenter in the bottom one, one-word captions on the seam.",
    "Before calling: read the transcript with get_video_transcript.",
    "Takes: keep only the last clean take of each sentence, drop restarts and false starts, and cut pauses longer than about 0.28 s; list the takes in the order they play.",
    "Panels: change the top panel at the start of a sentence. Use an example (another of the person's videos from list_my_videos, at a moment that matches what is being said) for most sentences.",
    "Use fullscreen for the turning-point sentence, a short joke or reaction, and the final call to action.",
    "Times in panels are seconds of the edited video (the takes played one after the other), starting at 0.",
    "Batches the person sent from Editor Oculto come from list_edit_queue: follow their adjustments in every video and pass the batch's sessionId.",
    "The render runs in the background; check it with get_edit.",
].join(" ");

const EDIT_QUEUE_GUIDE = [
    "Lists the batches the person prepared in Editor Oculto and sent to edit (they clicked Começar a editar), oldest first.",
    "Each batch has a format, the person's adjustments (apply them to every video of the batch) and its raw videos.",
    "Edit each video that is transcribed and has no edit yet: read its transcript with get_video_transcript, then call the format's edit tool with the batch's sessionId.",
    "Use create_split_screen_edit for split-screen (Tela dividida), create_contrast_edit for this-or-that (Contraste), and create_gamified_edit for generic (Dinâmico gamificado).",
    "A video that is not transcribed yet is still being prepared; edit it on a later call.",
].join(" ");

const CONTRAST_GUIDE = [
    "Edits a raw talking-head video in the Contraste format: a vertical presenter, a topic header, and BOM and RUIM markers beside each evaluated option.",
    "Read get_video_transcript. Keep clean takes in playback order and cut restarts and long pauses.",
    "Write a short topic and label each option using the presenter's own words. Set good or bad based on what they say. Never invent a verdict.",
    "Use non-overlapping comparisons in edited time, after subtracting the cuts. Leave the intro and closing clear of comparison labels unless the speaker is evaluating an option there.",
    "When the person sent a batch, follow its adjustments and pass its sessionId from list_edit_queue.",
    "The render runs in the background; check it with get_edit.",
].join(" ");

const GAMIFIED_GUIDE = [
    "Edits a talking-head video in Dinâmico gamificado: quick cuts, short captions with coloured keywords, and a brief zoom, icon and cue sound on selected highlights.",
    "Read get_video_transcript first. Keep clean takes in playback order. Drop restarts and long pauses without cutting words, reactions or the final call to action.",
    "Choose individual spoken keywords for the captions. Add a few short highlights grounded in the transcript. Use step for instructions, tip for useful advice, and emphasis for a turning point or result. Avoid repeating a caption verbatim in a highlight.",
    "Highlights use edited seconds, after subtracting the cuts. Keep them in order, without overlap, and use the speaker's language for labels.",
    "When the person sent a batch, follow its adjustments and pass its sessionId from list_edit_queue. Check the background render with get_edit.",
].join(" ");

const editIdInputSchema = z.object({
    editId: z.uuid().describe("The edit's id, from a create edit tool or list_my_edits."),
});

const transcriptInputSchema = z.object({
    videoId: z.uuid().describe("The id of one of the person's videos, from list_my_videos."),
});

function toJsonResult(value: unknown): CallToolResult {
    return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

function toErrorResult(message: string): CallToolResult {
    return { content: [{ type: "text", text: message }], isError: true };
}

function registerFormatTools(server: McpServer): void {
    server.registerTool(
        "list_viral_formats",
        {
            title: "Formatos Virais",
            description:
                "Lists the Editor Oculto viral formats and whether each one is available for editing.",
            annotations: { readOnlyHint: true },
        },
        () =>
            toJsonResult(
                VIRAL_FORMATS.map((format) => ({ ...format, isEditable: isEditFormat(format.id) })),
            ),
    );
}

function registerVideoTools(server: McpServer, userId: string): void {
    server.registerTool(
        "list_my_videos",
        {
            title: "Meus vídeos",
            description:
                "Lists the signed-in person's most recent videos on Editor Oculto, newest first.",
            inputSchema: listVideosInputSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ limit }) => {
            const page = await listUserVideosPage(userId, {
                query: "",
                filter: ALL_FILTER,
                sort: DEFAULT_VIDEO_SORT,
                cursor: null,
                limit,
            });

            return toJsonResult(
                page.items.map((video) => ({
                    id: video.id,
                    title: video.title,
                    status: video.status,
                    durationSeconds: video.durationSeconds,
                    readyClipCount: video.readyClipCount,
                    createdAt: video.createdAt,
                })),
            );
        },
    );

    server.registerTool(
        "get_video_transcript",
        {
            title: "Transcrição do vídeo",
            description:
                "Returns the word-by-word transcript of one of the person's videos, with start and end times in seconds.",
            inputSchema: transcriptInputSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ videoId }) => {
            // Another person's video and a missing one answer the same.
            if ((await findOwnedVideoOrNull(videoId, userId)) === null) {
                return toErrorResult("Video not found.");
            }

            const words = await findTranscriptWords(videoId);

            if (words === null) {
                return toErrorResult(
                    "This video has no transcript yet. Try again once it is processed.",
                );
            }

            return toJsonResult(words);
        },
    );
}

async function queueEditResult(
    userId: string,
    request: FormatEditRequest,
): Promise<CallToolResult> {
    try {
        const editId = await createFormatEdit(userId, request);
        return toJsonResult({ editId, status: "queued", editsPage: EDITS_PAGE_URL });
    } catch (error) {
        if (error instanceof InvalidEditPlanError) {
            return toErrorResult(error.message);
        }

        throw error;
    }
}

function registerEditTools(server: McpServer, userId: string): void {
    server.registerTool(
        "create_split_screen_edit",
        {
            title: "Editar em Tela dividida",
            description: SPLIT_SCREEN_GUIDE,
            inputSchema: splitScreenPlanSchema,
        },
        async (plan) => await queueEditResult(userId, { format: "split-screen", plan }),
    );

    server.registerTool(
        "create_contrast_edit",
        {
            title: "Editar em Contraste",
            description: CONTRAST_GUIDE,
            inputSchema: contrastPlanSchema,
        },
        async (plan) => await queueEditResult(userId, { format: "this-or-that", plan }),
    );

    server.registerTool(
        "create_gamified_edit",
        {
            title: "Editar em Dinâmico gamificado",
            description: GAMIFIED_GUIDE,
            inputSchema: gamifiedPlanSchema,
        },
        async (plan) => await queueEditResult(userId, { format: "generic", plan }),
    );

    server.registerTool(
        "get_edit",
        {
            title: "Andamento da edição",
            description:
                "Returns one edit's status (queued, rendering, done or failed). A done edit is watched and downloaded on the edits page.",
            inputSchema: editIdInputSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ editId }) => {
            const edit = await findUserEdit(userId, editId);

            if (edit === null) {
                return toErrorResult("Edit not found.");
            }

            return toJsonResult({ ...edit, editsPage: EDITS_PAGE_URL });
        },
    );

    server.registerTool(
        "list_my_edits",
        {
            title: "Minhas edições",
            description: "Lists the person's latest edits, newest first, with their status.",
            annotations: { readOnlyHint: true },
        },
        async () => toJsonResult(await listUserEdits(userId)),
    );

    server.registerTool(
        "list_edit_queue",
        {
            title: "Fila de edições",
            description: EDIT_QUEUE_GUIDE,
            annotations: { readOnlyHint: true },
        },
        async () => toJsonResult(await listQueuedEditSessions(userId)),
    );
}

/**
 * The MCP server a person's Claude talks to, built per request for the person the access token
 * names. Every tool reads only that person's data.
 */
export function buildMcpServer(userId: string): McpServer {
    if (userId.trim().length === 0) {
        throw new Error("An MCP server needs the signed-in person's id");
    }

    const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
    registerFormatTools(server);
    registerVideoTools(server, userId);
    registerEditTools(server, userId);
    return server;
}
