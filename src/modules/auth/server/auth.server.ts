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
} from "#/modules/auth/model/auth-error-message";
import {
    LAST_ADMIN_CODE,
    LAST_ADMIN_DELETE_MESSAGE,
    LastAdminError,
} from "#/modules/auth/model/last-admin-error";
import { MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH } from "#/modules/auth/model/auth-forms";
import {
    ADMIN_ROLE,
    USER_ROLE,
    account,
    rateLimit,
    session,
    user,
    verification,
} from "#/modules/auth/auth.schema";
import {
    recordImpersonationStart,
    recordImpersonationStop,
} from "#/modules/admin/server/record-admin-action.server";
import { buildCaptchaPlugins } from "#/modules/auth/server/auth-captcha.server";
import {
    queueExistingAccountEmail,
    queueResetPasswordEmail,
    queueVerificationEmail,
} from "#/modules/auth/server/auth-email-callbacks.server";
import { AUTH_RATE_LIMIT } from "#/modules/auth/server/auth-rate-limit.server";
import { getClientIpHeaders } from "#/modules/auth/server/client-ip.server";
import { keepImpersonatedSessionExpiry } from "#/modules/auth/server/impersonation-session.server";
import {
    isHoneypotFilledInRequest,
    rejectHoneypotSignUp,
} from "#/modules/auth/server/sign-up-honeypot.server";
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
        // Nobody could open the admin panel again. Admins cannot delete each other from the panel,
        // so this is the only way the last one could go.
        if (error instanceof LastAdminError) {
            throw new APIError("BAD_REQUEST", {
                message: LAST_ADMIN_DELETE_MESSAGE,
                code: LAST_ADMIN_CODE,
            });
        }

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

/** The name is checked first, so a caught bot with a bad name gets the same error as a person. */
async function checkNewUser(
    newUser: { name?: unknown },
    context: { path?: string; body?: unknown } | null,
): Promise<{ data: { name: string } } | undefined> {
    const result = await trimNameWithinLimit(newUser);
    rejectHoneypotSignUp(context);
    return result;
}

async function notifyOwnerOfSignUpAttempt(
    attempt: { user: User },
    request: Request | undefined,
): Promise<void> {
    if ((await isHoneypotFilledInRequest(request)) === true) {
        return;
    }

    await queueExistingAccountEmail(attempt);
}

const DELETE_USER_PATH = "/delete-user";

const deleteUserBodySchema = z.object({ password: z.string().min(1) });

/**
 * Better Auth skips the password on /delete-user when the session is under a day old, so anyone
 * at an unlocked computer could erase the account. The password is required every time.
 */
function requirePasswordToDeleteUser(body: unknown): void {
    const result = deleteUserBodySchema.safeParse(body);

    if (result.success === false) {
        throw new APIError("BAD_REQUEST", { message: "Digite sua senha para excluir a conta." });
    }
}

const runBeforeAuthHooks = createAuthMiddleware(async (ctx) => {
    if (ctx.path === DELETE_USER_PATH) {
        requirePasswordToDeleteUser(ctx.body);
    }

    return undefined;
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
        schema: { user, session, account, verification, rateLimit },
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: MIN_PASSWORD_LENGTH,
        // No session until the address is confirmed: a public SaaS cannot have accounts on
        // emails their owners never saw. Also makes sign-up answer the same for a taken email.
        requireEmailVerification: true,
        sendResetPassword: queueResetPasswordEmail,
        revokeSessionsOnPasswordReset: true,
        onExistingUserSignUp: notifyOwnerOfSignUpAttempt,
    },
    emailVerification: {
        sendVerificationEmail: queueVerificationEmail,
        sendOnSignUp: true,
        // A person who lost the first link gets a new one by trying to sign in.
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
    },
    session: {
        // Every video range request reads the session; a signed cookie answers that for 5 minutes
        // instead of the database. Trade-off (decided 2026-11-21): a session ended elsewhere keeps
        // streaming media for up to 5 minutes. Server functions skip the cache (authMiddleware).
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
        before: runBeforeAuthHooks,
    },
    rateLimit: AUTH_RATE_LIMIT,
    advanced: {
        ipAddress: { ipAddressHeaders: getClientIpHeaders() },
    },
    databaseHooks: {
        user: {
            create: { before: checkNewUser },
            update: { before: trimNameWithinLimit },
        },
        session: {
            // "Entrar como cliente" is called by the browser straight to Better Auth, so its start
            // and end are recorded here, from the visit's session row.
            create: { after: recordImpersonationStart },
            update: { before: keepImpersonatedSessionExpiry },
            delete: { after: recordImpersonationStop },
        },
    },
    // tanstackStartCookies must stay last: it sets the cookies the other plugins produce.
    // The admin plugin comes first: after the captcha spread, TypeScript would lose the fields it
    // adds to the user and session types.
    plugins: [adminPlugin, ...buildCaptchaPlugins(), tanstackStartCookies()],
});
