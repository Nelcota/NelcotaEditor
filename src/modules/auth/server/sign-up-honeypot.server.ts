import { z } from "zod";
import { SIGN_UP_HONEYPOT_FIELD } from "#/modules/auth/model/auth-forms";

const honeypotBodySchema = z.object({
    [SIGN_UP_HONEYPOT_FIELD]: z.string().trim().min(1),
});

const fakeSignUpBodySchema = z
    .object({
        name: z.string().catch(""),
        email: z.string().toLowerCase().catch(""),
    })
    .catch({ name: "", email: "" });

export function isHoneypotFilled(body: unknown): boolean {
    return honeypotBodySchema.safeParse(body).success;
}

interface FakeSignUpRequest {
    body: unknown;
    userId: string;
    now: Date;
}

/**
 * What a real sign-up answers while the email waits for confirmation, so a bot cannot tell it was
 * caught. Nothing is stored and no email is sent.
 */
export function buildFakeSignUpResponse(request: FakeSignUpRequest): {
    token: null;
    user: Record<string, unknown>;
} {
    const fields = fakeSignUpBodySchema.parse(request.body);
    const now = request.now;

    return {
        token: null,
        user: {
            id: request.userId,
            name: fields.name,
            email: fields.email,
            emailVerified: false,
            image: null,
            createdAt: now,
            updatedAt: now,
        },
    };
}
