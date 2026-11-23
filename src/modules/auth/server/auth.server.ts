import { betterAuth } from "better-auth";
import type { User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { z } from "zod";
import { db } from "#/db/database.server";
import {
    BANNED_USER_MESSAGE,
    VIDEOS_STILL_PROCESSING_CODE,
} from "#/modules/auth/auth-error-message";
import { MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH } from "#/modules/auth/auth-forms.schema";
import {
    ADMIN_ROLE,
    USER_ROLE,
    account,
    session,
    user,
    verification,
} from "#/modules/auth/auth.schema";
import { buildCaptchaPlugins } from "#/modules/auth/server/auth-captcha.server";
import { AUTH_RATE_LIMIT } from "#/modules/auth/server/auth-rate-limit.server";
import { getClientIpHeaders } from "#/modules/auth/server/client-ip.server";
import { keepImpersonatedSessionExpiry } from "#/modules/auth/server/impersonation-session.server";
import {
    AccountHasWorkingVideosError,
    deleteAccountWithFiles,
} from "#/modules/video-records/server/delete-user-videos.server";
import { getEnvironment, InvalidEnvironmentError } from "#/shared/server/env.server";

const MIN_SECRET_LENGTH = 32;
const SESSION_COOKIE_CACHE_SECONDS = 5 * 60;

const environment = getEnvironment();

function readAuthSecret(): string {
    const secret = environment.BETTER_AUTH_SECRET;

    if (secret === undefined || secret.length < MIN_SECRET_LENGTH) {
        throw new InvalidEnvironmentError(["BETTER_AUTH_SECRET"]);
    }

    return secret;
}

/**
 * Deletes the account in the same transaction as its videos, so a video started meanwhile cannot
 * leave files behind. Better Auth's own delete, which runs next, then finds nothing left to remove.
 */
async function deleteAccountBeforeBetterAuth(deletedUser: User): Promise<void> {
    try {
        await deleteAccountWithFiles(deletedUser.id);
    } catch (error) {
        if (error instanceof AccountHasWorkingVideosError) {
            throw new APIError("BAD_REQUEST", {
                message: "Cancele os vídeos em processamento antes de excluir a conta.",
                code: VIDEOS_STILL_PROCESSING_CODE,
            });
        }

        throw error;
    }
}

/**
 * Better Auth's sign-up and update-user endpoints accept a name of any length; the form's limit is
 * only for the user's convenience, so the server enforces it too and stores the name trimmed, as
 * it was measured. Updates without a name pass unchanged.
 */
async function trimNameWithinLimit(fields: {
    name?: unknown;
}): Promise<{ data: { name: string } } | undefined> {
    const name = fields.name;

    if (name === undefined) {
        return undefined;
    }

    if (typeof name !== "string" || name.trim().length === 0) {
        throw new APIError("BAD_REQUEST", { message: "Digite seu nome." });
    }

    const trimmedName = name.trim();

    if (Array.from(trimmedName).length > MAX_NAME_LENGTH) {
        throw new APIError("BAD_REQUEST", { message: "Nome muito longo." });
    }

    return { data: { name: trimmedName } };
}

const DELETE_USER_PATH = "/delete-user";

const deleteUserBodySchema = z.object({ password: z.string().min(1) });

/**
 * Better Auth skips the password on /delete-user when the session is under a day old, so anyone
 * at an unlocked computer could erase the account. The password is required every time.
 */
const requirePasswordToDeleteUser = createAuthMiddleware(async (ctx) => {
    if (ctx.path !== DELETE_USER_PATH) {
        return;
    }

    const result = deleteUserBodySchema.safeParse(ctx.body);

    if (result.success === false) {
        throw new APIError("BAD_REQUEST", { message: "Digite sua senha para excluir a conta." });
    }
});

const adminPlugin = admin({
    defaultRole: USER_ROLE,
    adminRoles: [ADMIN_ROLE],
    bannedUserMessage: BANNED_USER_MESSAGE,
});

/** The only admin routes the browser calls; the admin screens reach the rest through server code. */
const ADMIN_PATHS_FOR_THE_BROWSER = ["/admin/impersonate-user", "/admin/stop-impersonating"];

/**
 * Better Auth serves every endpoint over HTTP, but server code calls them directly and never
 * through these paths. Open, they let an admin skip the panel's checks (set another admin's
 * password, create a hidden admin, delete an account and leave its files) and let anyone holding
 * a session guess its password 100 times a minute. Built from the plugin, so admin routes added by
 * an upgrade start closed.
 */
const PATHS_CLOSED_TO_THE_BROWSER = [
    ...Object.values(adminPlugin.endpoints)
        .map((endpoint) => endpoint.path)
        .filter((path) => ADMIN_PATHS_FOR_THE_BROWSER.includes(path) === false),
    "/verify-password",
];

export const auth = betterAuth({
    baseURL: environment.BETTER_AUTH_URL,
    disabledPaths: PATHS_CLOSED_TO_THE_BROWSER,
    secret: readAuthSecret(),
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user, session, account, verification },
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: MIN_PASSWORD_LENGTH,
    },
    session: {
        // Every server function and every video range request reads the session; a signed cookie
        // answers that for 5 minutes instead of the database. Trade-off (decided 2026-11-21): a
        // session ended elsewhere keeps working here for up to 5 minutes.
        cookieCache: { enabled: true, maxAge: SESSION_COOKIE_CACHE_SECONDS },
    },
    user: {
        // The before hook requires a password, and Better Auth checks it before calling beforeDelete.
        deleteUser: {
            enabled: true,
            beforeDelete: deleteAccountBeforeBetterAuth,
        },
    },
    hooks: {
        before: requirePasswordToDeleteUser,
    },
    rateLimit: AUTH_RATE_LIMIT,
    advanced: {
        ipAddress: { ipAddressHeaders: getClientIpHeaders() },
    },
    databaseHooks: {
        user: {
            create: { before: trimNameWithinLimit },
            update: { before: trimNameWithinLimit },
        },
        session: {
            update: { before: keepImpersonatedSessionExpiry },
        },
    },
    // tanstackStartCookies must stay last: it sets the cookies the other plugins produce.
    // The admin plugin comes first: after the captcha spread, TypeScript would lose the fields it
    // adds to the user and session types.
    plugins: [adminPlugin, ...buildCaptchaPlugins(), tanstackStartCookies()],
});
