import type { SignInSearch } from "#/modules/auth/model/sign-in-search";

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
