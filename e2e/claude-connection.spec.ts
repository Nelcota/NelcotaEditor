import { createHash, randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";
import { z } from "zod";
import { expectNoAccessibilityViolations } from "./support/accessibility";
import { createTestAccount, openPage, signUp, useOwnClientAddress } from "./support/accounts";

const CLAUDE_CALLBACK = "https://claude.ai/api/mcp/auth_callback";
const registeredClientSchema = z.object({ client_id: z.string() });

/** What claude.ai does on "Add custom connector": register itself, then send the person here. */
async function startClaudeAuthorization(
    request: APIRequestContext,
    origin: string,
    clientAddress: string,
): Promise<string> {
    const registration = await request.post(`${origin}/api/auth/oauth2/register`, {
        headers: { "x-real-ip": clientAddress },
        data: {
            client_name: "Claude",
            redirect_uris: [CLAUDE_CALLBACK],
            token_endpoint_auth_method: "none",
            grant_types: ["authorization_code", "refresh_token"],
            response_types: ["code"],
        },
    });
    await expect(registration).toBeOK();
    const { client_id: clientId } = registeredClientSchema.parse(await registration.json());
    const verifier = randomBytes(32).toString("base64url");
    const query = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: CLAUDE_CALLBACK,
        scope: "openid profile offline_access",
        state: "state-1",
        code_challenge: createHash("sha256").update(verifier).digest("base64url"),
        code_challenge_method: "S256",
        resource: `${origin}/api/mcp`,
    });

    return `${origin}/api/auth/oauth2/authorize?${query}`;
}

/** claude.ai stands in for itself: the callback is answered here, never sent out. */
async function catchClaudeCallbacks(page: Page): Promise<Array<string>> {
    const callbacks: Array<string> = [];
    await page.route("https://claude.ai/**", async (route) => {
        callbacks.push(route.request().url());
        await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: "<title>Claude</title>",
        });
    });

    return callbacks;
}

test("connects Claude after consent and disconnects it from Etapa 1", async ({ page, request }) => {
    const clientAddress = await useOwnClientAddress(page);
    await signUp(page, createTestAccount());
    const origin = new URL(page.url()).origin;
    const callbacks = await catchClaudeCallbacks(page);

    await page.goto(await startClaudeAuthorization(request, origin, clientAddress), {
        waitUntil: "networkidle",
    });
    await expect(page.getByRole("heading", { name: "Conectar o Claude" })).toBeVisible();
    await expectNoAccessibilityViolations(page);
    await page.getByRole("button", { name: "Permitir acesso" }).click();
    await expect.poll(() => callbacks.length).toBeGreaterThan(0);
    expect(callbacks[0]).toContain("code=");

    await openPage(page, "/claude");
    await expect(page.getByText("Claude conectado")).toBeVisible();
    await expectNoAccessibilityViolations(page);
    await page.getByRole("button", { name: "Desconectar" }).click();
    await page.getByRole("button", { name: "Desconectar Claude" }).click();
    await expect(page.getByText("Esperando o Claude se conectar")).toBeVisible();
});

test("signs a signed-out person in before asking for consent", async ({
    page,
    browser,
    request,
}) => {
    await useOwnClientAddress(page);
    const account = createTestAccount();
    await signUp(page, account);
    const origin = new URL(page.url()).origin;
    const signedOut = await browser.newContext();
    const signedOutPage = await signedOut.newPage();
    const clientAddress = await useOwnClientAddress(signedOutPage);

    await signedOutPage.goto(await startClaudeAuthorization(request, origin, clientAddress), {
        waitUntil: "networkidle",
    });
    await expect(
        signedOutPage.getByRole("heading", { name: "Entre para conectar o Claude" }),
    ).toBeVisible();
    await expectNoAccessibilityViolations(signedOutPage);
    await signedOutPage.getByLabel("Email").fill(account.email);
    await signedOutPage.getByLabel("Senha", { exact: true }).fill(account.password);
    await signedOutPage.getByRole("button", { name: "Entrar" }).click();

    await expect(signedOutPage.getByRole("heading", { name: "Conectar o Claude" })).toBeVisible();
    await signedOut.close();
});

const EDITABLE_FORMATS = ["Contraste", "Dinâmico gamificado", "Hacking", "Ranking"] as const;

for (const format of EDITABLE_FORMATS) {
    test(`opens a ${format} batch and sends its uploaded video to Claude`, async ({
        page,
        request,
    }) => {
        const clientAddress = await useOwnClientAddress(page);
        await signUp(page, createTestAccount());
        const origin = new URL(page.url()).origin;
        const callbacks = await catchClaudeCallbacks(page);
        await page.goto(await startClaudeAuthorization(request, origin, clientAddress), {
            waitUntil: "networkidle",
        });
        await page.getByRole("button", { name: "Permitir acesso" }).click();
        await expect.poll(() => callbacks.length).toBeGreaterThan(0);

        await openPage(page, "/formats");
        await page.getByRole("button", { name: format, exact: true }).click();
        await page.getByRole("button", { name: "Escolher formato" }).click();

        await expect(page.getByRole("heading", { name: `${format} #1` })).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Começar a editar", exact: true }),
        ).toBeDisabled();
        if (format === "Dinâmico gamificado") {
            await page.setViewportSize({ width: 320, height: 780 });
            await page.getByLabel("Ajuste para o lote (opcional)").fill("Use legendas amarelas.");
        }

        await expectNoAccessibilityViolations(page);
        await page
            .getByLabel("Selecionar vídeos")
            .setInputFiles("public/viral-formats/contrast-example.mp4");
        await expect(page.getByLabel("Adicionar vídeos")).toBeVisible();
        await page.getByRole("button", { name: "Começar a editar 1 vídeo" }).click();
        await expect(page.getByRole("button", { name: "Copiar pedido" })).toBeVisible();
        if (format === "Dinâmico gamificado") {
            await expect(page.getByRole("heading", { name: "Continue no Claude" })).toBeFocused();
            await expect(page.getByText("Use legendas amarelas.")).toBeVisible();
            await page.reload({ waitUntil: "networkidle" });
            await expect(page.getByText("Use legendas amarelas.")).toBeVisible();
            await expectNoAccessibilityViolations(page);
        }
    });
}

test("refuses a consent page whose request was changed", async ({ page }) => {
    await useOwnClientAddress(page);
    await signUp(page, createTestAccount());

    await openPage(page, "/oauth/consent?client_id=outro&sig=forjada");

    await expect(page.getByRole("heading", { name: "Este pedido expirou" })).toBeVisible();
});
