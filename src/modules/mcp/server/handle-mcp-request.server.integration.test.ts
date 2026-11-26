import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { MCP_RESOURCE, auth } from "#/modules/auth/server/auth.server";
import { getClientIpHeaders } from "#/modules/auth/server/client-ip.server";
import { disconnectClaude } from "#/modules/auth/server/claude-connection.server";
import { handleMcpRequest } from "#/modules/mcp/server/handle-mcp-request.server";
import { transcripts } from "#/modules/transcription/transcription.schema";
import { videos } from "#/modules/video-records/video-records.schema";

// Runs against the test database from .env.test: bun run test:integration

const CLAUDE_CALLBACK = "https://claude.ai/api/mcp/auth_callback";
const APP_ORIGIN = new URL(MCP_RESOURCE).origin;
const HTTP_FOUND = 302;
const HTTP_UNAUTHORIZED = 401;
const SSE_DATA_PREFIX = "data: ";
// randomInt excludes its upper bound, so 255 is never drawn.
const LAST_HOST_OCTET = 255;
const [CLIENT_IP_HEADER = "x-forwarded-for"] = getClientIpHeaders();

/** Each call from its own address, so the auth rate limits stay on without the tests sharing one. */
function uniqueClientIp(): string {
    const [first = 1, second = 1] = randomBytes(2);

    // The last octet keeps clear of 0 and 255, which are not host addresses.
    return `10.${first}.${second}.${randomInt(1, LAST_HOST_OCTET)}`;
}

interface SignedInPerson {
    userId: string;
    cookies: Headers;
}

const registeredClientSchema = z.object({ client_id: z.string() });
const consentAnswerSchema = z.object({ url: z.string() });
const tokenSchema = z.object({ access_token: z.string() });
const toolResultSchema = z.object({
    result: z.object({
        content: z.array(z.object({ type: z.literal("text"), text: z.string() })),
        isError: z.boolean().optional(),
    }),
});

const EDIT_TOOL_CASES = [
    {
        format: "this-or-that",
        tool: "create_contrast_edit",
        fields: {
            topic: "Fones de ouvido",
            comparisons: [{ start: 1, end: 3, label: "Com fio", verdict: "good" }],
        },
    },
    {
        format: "generic",
        tool: "create_gamified_edit",
        fields: {
            keywords: ["Bom"],
            highlights: [{ start: 1, end: 3, label: "Primeira dica", kind: "tip" }],
        },
    },
] as const;

function toCookieHeaders(setCookieHeaders: Headers): Headers {
    const cookie = setCookieHeaders
        .getSetCookie()
        .map((setCookie) => setCookie.split(";")[0] ?? "")
        .join("; ");

    return new Headers({ cookie, origin: APP_ORIGIN, [CLIENT_IP_HEADER]: uniqueClientIp() });
}

async function signIn(): Promise<SignedInPerson> {
    const id = randomUUID();
    const email = `mcp-${id}@example.com`;
    const password = `senha-${id}`;
    const ipHeaders = new Headers({ [CLIENT_IP_HEADER]: uniqueClientIp() });
    const signedUp = await auth.api.signUpEmail({
        body: { name: "Ana Teste", email, password },
        headers: ipHeaders,
    });
    await db.update(user).set({ emailVerified: true }).where(eq(user.email, email));
    const signedIn = await auth.api.signInEmail({
        body: { email, password },
        headers: ipHeaders,
        returnHeaders: true,
    });

    return { userId: signedUp.user.id, cookies: toCookieHeaders(signedIn.headers) };
}

async function registerClaude(): Promise<string> {
    const response = await auth.handler(
        new Request(`${APP_ORIGIN}/api/auth/oauth2/register`, {
            method: "POST",
            headers: { "content-type": "application/json", [CLIENT_IP_HEADER]: uniqueClientIp() },
            body: JSON.stringify({
                client_name: "Claude",
                redirect_uris: [CLAUDE_CALLBACK],
                token_endpoint_auth_method: "none",
                grant_types: ["authorization_code", "refresh_token"],
                response_types: ["code"],
            }),
        }),
    );

    return registeredClientSchema.parse(await response.json()).client_id;
}

/** The consent page's signed query, from where the authorize endpoint sends the browser. */
async function authorize(person: SignedInPerson, clientId: string, challenge: string) {
    const query = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: CLAUDE_CALLBACK,
        scope: "openid profile offline_access",
        state: "state-1",
        code_challenge: challenge,
        code_challenge_method: "S256",
        resource: MCP_RESOURCE,
    });
    const response = await auth.handler(
        new Request(`${APP_ORIGIN}/api/auth/oauth2/authorize?${query}`, {
            headers: person.cookies,
        }),
    );
    const location = new URL(response.headers.get("location") ?? "", APP_ORIGIN);

    return {
        status: response.status,
        pathname: location.pathname,
        query: location.search.slice(1),
    };
}

async function approve(person: SignedInPerson, signedQuery: string): Promise<string> {
    const headers = new Headers(person.cookies);
    headers.set("content-type", "application/json");
    const response = await auth.handler(
        new Request(`${APP_ORIGIN}/api/auth/oauth2/consent`, {
            method: "POST",
            headers,
            body: JSON.stringify({ accept: true, oauth_query: signedQuery }),
        }),
    );
    const callback = new URL(consentAnswerSchema.parse(await response.json()).url);

    return callback.searchParams.get("code") ?? "";
}

async function exchangeCode(clientId: string, code: string, verifier: string): Promise<string> {
    const response = await auth.handler(
        new Request(`${APP_ORIGIN}/api/auth/oauth2/token`, {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                [CLIENT_IP_HEADER]: uniqueClientIp(),
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: CLAUDE_CALLBACK,
                client_id: clientId,
                code_verifier: verifier,
                resource: MCP_RESOURCE,
            }),
        }),
    );

    return tokenSchema.parse(await response.json()).access_token;
}

/** Claude's whole first connection: register, authorize, consent and the code exchange. */
async function connectClaude(person: SignedInPerson): Promise<string> {
    const clientId = await registerClaude();
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const consent = await authorize(person, clientId, challenge);
    const code = await approve(person, consent.query);

    return await exchangeCode(clientId, code, verifier);
}

function callTool(accessToken: string | null, name: string, args: Record<string, unknown>) {
    const headers = new Headers({
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
    });

    if (accessToken !== null) {
        headers.set("authorization", `Bearer ${accessToken}`);
    }

    return handleMcpRequest(
        new Request(MCP_RESOURCE, {
            method: "POST",
            headers,
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "tools/call",
                params: { name, arguments: args },
            }),
        }),
    );
}

/** The tool's text, from a JSON body or the one event of a short SSE response. */
async function readToolText(response: Response): Promise<{ text: string; isError: boolean }> {
    const body = await response.text();
    let json = body;

    if (body.startsWith("{") === false) {
        const eventLine = body.split("\n").find((line) => line.startsWith(SSE_DATA_PREFIX)) ?? "";
        json = eventLine.slice(SSE_DATA_PREFIX.length);
    }

    const result = toolResultSchema.parse(JSON.parse(json)).result;

    return { text: result.content[0]?.text ?? "", isError: result.isError === true };
}

async function createVideo(userId: string, title: string): Promise<string> {
    const videoId = randomUUID();
    await db.insert(videos).values({
        id: videoId,
        userId,
        title,
        source: "upload",
        requestedClipCount: 1,
        status: "done",
    });

    return videoId;
}

afterAll(async () => {
    await db.$client.end();
});

describe("connecting Claude", () => {
    it("asks the signed-in person for consent before Claude gets a code", async () => {
        const person = await signIn();
        const clientId = await registerClaude();

        const consent = await authorize(person, clientId, "a".repeat(43));

        expect(consent.status).toBe(HTTP_FOUND);
        expect(consent.pathname).toBe("/oauth/consent");
    });
});

describe("handleMcpRequest", () => {
    it("answers a call without a token with the sign-in challenge", async () => {
        const response = await callTool(null, "list_my_videos", {});

        expect(response.status).toBe(HTTP_UNAUTHORIZED);
        expect(response.headers.get("www-authenticate")).toContain("resource_metadata");
    });

    it("lists only the person's own videos", async () => {
        const person = await signIn();
        const stranger = await signIn();
        await createVideo(person.userId, "Podcast da Ana");
        await createVideo(stranger.userId, "Vídeo de outra pessoa");
        const accessToken = await connectClaude(person);

        const { text } = await readToolText(await callTool(accessToken, "list_my_videos", {}));

        expect(text).toContain("Podcast da Ana");
        expect(text).not.toContain("Vídeo de outra pessoa");
    });

    it("refuses another person's transcript as if the video did not exist", async () => {
        const person = await signIn();
        const stranger = await signIn();
        const strangerVideoId = await createVideo(stranger.userId, "Vídeo de outra pessoa");
        const accessToken = await connectClaude(person);

        const answer = await readToolText(
            await callTool(accessToken, "get_video_transcript", { videoId: strangerVideoId }),
        );

        expect(answer).toEqual({ text: "Video not found.", isError: true });
    });

    it("stops answering a disconnected Claude at once", async () => {
        const person = await signIn();
        const accessToken = await connectClaude(person);
        await disconnectClaude(person.userId);

        const response = await callTool(accessToken, "list_my_videos", {});

        expect(response.status).toBe(HTTP_UNAUTHORIZED);
    });

    for (const { format, tool, fields } of EDIT_TOOL_CASES) {
        it(`queues ${format} through the connected Claude tool`, async () => {
            const person = await signIn();
            const videoId = await createVideo(person.userId, "Comparison");
            await db
                .update(videos)
                .set({ sourcePath: `videos/${videoId}/source.mp4`, durationSeconds: 10 })
                .where(eq(videos.id, videoId));
            await db
                .insert(transcripts)
                .values({ videoId, words: [{ text: "Bom", startSeconds: 1, endSeconds: 1.5 }] });
            const accessToken = await connectClaude(person);
            const answer = await readToolText(
                await callTool(accessToken, tool, {
                    videoId,
                    title: "Comparison",
                    takes: [{ start: 0, end: 5 }],
                    ...fields,
                }),
            );

            expect(answer.isError).toBe(false);
            const result = z
                .object({ editId: z.uuid(), status: z.literal("queued") })
                .parse(JSON.parse(answer.text));
            const edit = await readToolText(
                await callTool(accessToken, "get_edit", { editId: result.editId }),
            );
            expect(JSON.parse(edit.text)).toMatchObject({ format, status: "queued" });
        });
    }
});
