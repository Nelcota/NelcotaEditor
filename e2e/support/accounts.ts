import { randomInt, randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

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
export async function useOwnClientAddress(page: Page): Promise<void> {
    const address = `10.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}`;
    await page.setExtraHTTPHeaders({ "x-real-ip": address });
}

/**
 * Opens a page and waits until its scripts have loaded: a form used before React hydrates would
 * be sent by the browser itself instead of by the app.
 */
export async function openPage(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: "networkidle" });
}

export async function signUp(page: Page, account: TestAccount): Promise<void> {
    await openPage(page, "/sign-up");
    await page.getByLabel("Nome").fill(account.name);
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Senha", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL("/");
}
