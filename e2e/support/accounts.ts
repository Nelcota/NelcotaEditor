import { randomInt, randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { Client } from "pg";
import { z } from "zod";

const queuedLinkRowSchema = z.object({ url: z.url() });

export interface TestAccount {
    name: string;
    email: string;
    password: string;
}

const IP_OCTET_LIMIT = 255;

/** A new account for each test, so tests never share data. */
export function createTestAccount(): TestAccount {
    const id = randomUUID();

    return { name: "Ana Teste", email: `e2e-${id}@example.com`, password: `senha-${id}` };
}

/**
 * The test app trusts x-real-ip (see .env.test), so each test counts against the sign-up and
 * sign-in limits on its own address instead of all of them sharing one.
 */
export async function useOwnClientAddress(page: Page): Promise<string> {
    const address = `10.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}`;
    await page.setExtraHTTPHeaders({ "x-real-ip": address });

    return address;
}

/**
 * Opens a page and waits until its scripts have loaded: a form used before React hydrates would
 * be sent by the browser itself instead of by the app.
 */
export async function openPage(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: "networkidle" });
}

const QUEUED_LINK_QUERY =
    "select data->>'url' as url from pgboss.job where name = 'send-auth-email' and data->>'kind' = $1 and data->>'to' = $2 order by created_on desc limit 1";

/**
 * The test app runs no worker, so emails are never sent; the link is read from the queued job,
 * exactly as the email would carry it.
 */
export async function readEmailedLink(
    email: string,
    kind: "verify-email" | "reset-password",
): Promise<string> {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const result = await client.query(QUEUED_LINK_QUERY, [kind, email]);
        return queuedLinkRowSchema.parse(result.rows[0]).url;
    } finally {
        await client.end();
    }
}

/** Signs up, follows the confirmation link and ends signed in on the home page. */
export async function signUp(page: Page, account: TestAccount): Promise<void> {
    await openPage(page, "/sign-up");
    await page.getByLabel("Nome").fill(account.name);
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Senha", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("confirmar seu email");

    await page.goto(await readEmailedLink(account.email, "verify-email"));
    await expect(page).toHaveURL("/getting-started");
    await openPage(page, "/");
}
