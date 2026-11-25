import { APIError } from "better-auth/api";
import { z } from "zod";
import { SIGN_UP_HONEYPOT_FIELD } from "#/modules/auth/model/auth-forms";
import { logger } from "#/shared/server/logger.server";

const SIGN_UP_PATH = "/sign-up/email";

const honeypotBodySchema = z.object({
    [SIGN_UP_HONEYPOT_FIELD]: z.string().trim().min(1),
});

export function isHoneypotFilled(body: unknown): boolean {
    return honeypotBodySchema.safeParse(body).success;
}

/**
 * Called from the user create hook, which Better Auth reaches only after the captcha, the body
 * validation, the password length check and the password hash, so a caught bot gets the same
 * errors and about the same wait as a person. With requireEmailVerification on, sign-up answers a
 * 403 from user creation exactly as it answers a taken email, in the same shape a new account has,
 * so nothing is stored and the bot cannot tell.
 */
export function rejectHoneypotSignUp(context: { path?: string; body?: unknown } | null): void {
    if (context === null || context.path !== SIGN_UP_PATH) {
        return;
    }

    if (isHoneypotFilled(context.body) === false) {
        return;
    }

    logger.warn("Sign-up honeypot filled");
    throw new APIError("FORBIDDEN");
}

async function readJsonBody(request: Request): Promise<unknown> {
    try {
        return await request.json();
    } catch (error) {
        // Better Auth also accepts form posts, which the sign-up page never sends; such a body
        // carries no trap this check can read, so the sign-up is treated as any other.
        if (error instanceof SyntaxError) {
            return null;
        }

        throw error;
    }
}

/**
 * A taken email skips user creation, so the trap is read again before the owner is emailed: a bot
 * must not make the app write to a stranger.
 */
export async function isHoneypotFilledInRequest(request: Request | undefined): Promise<boolean> {
    if (request === undefined) {
        return false;
    }

    if (isHoneypotFilled(await readJsonBody(request)) === false) {
        return false;
    }

    logger.warn("Sign-up honeypot filled");
    return true;
}
