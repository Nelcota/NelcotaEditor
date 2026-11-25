import { McpServer } from "@modelcontextprotocol/server";
import type { CallToolResult } from "@modelcontextprotocol/server";
import { z } from "zod";
import { findOwnedVideoOrNull } from "#/modules/video-records/server/find-owned-video.server";
import { findTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import { ALL_FILTER } from "#/modules/videos/model/video-list-filter";
import { DEFAULT_VIDEO_SORT } from "#/modules/videos/model/video-sort";
import { listUserVideosPage } from "#/modules/videos/server/video-queries.server";
import { VIRAL_FORMATS } from "#/modules/viral-formats/model/viral-formats";

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
                "Lists the Editor Oculto viral formats a raw talking-head video can be edited into, with what each one does.",
            annotations: { readOnlyHint: true },
        },
        () => toJsonResult(VIRAL_FORMATS),
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
    return server;
}
