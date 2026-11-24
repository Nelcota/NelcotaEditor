import { z } from "zod";

/**
 * Why a person lands on the sign-in page from a link: Better Auth adds `error` when an email
 * confirmation link fails, and the reset screen adds `reset` after a new password is saved.
 */
export const signInSearchSchema = z.object({
    error: z.string().max(64).optional().catch(undefined),
    reset: z.literal("done").optional().catch(undefined),
});

export type SignInSearch = z.infer<typeof signInSearchSchema>;

const PASSWORD_RESET_NOTICE = "Senha alterada. Entre com a nova senha.";
const CONFIRMATION_LINK_FAILED_NOTICE =
    "O link de confirmação expirou ou já foi usado. Entre com seu email e senha para receber outro.";

export function toSignInNotice(search: SignInSearch): string | null {
    if (search.reset === "done") {
        return PASSWORD_RESET_NOTICE;
    }

    if (search.error !== undefined) {
        return CONFIRMATION_LINK_FAILED_NOTICE;
    }

    return null;
}
