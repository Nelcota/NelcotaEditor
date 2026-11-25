import { FEATURE_TURNED_OFF_MESSAGES } from "#/modules/app-switches/model/feature-turned-off-error";
import { MIN_PASSWORD_LENGTH } from "#/modules/auth/model/auth-forms";
import { LAST_ADMIN_CODE, LAST_ADMIN_DELETE_MESSAGE } from "#/modules/auth/model/last-admin-error";

export const VIDEOS_STILL_PROCESSING_CODE = "VIDEOS_STILL_PROCESSING";

export const SIGN_UP_CLOSED_CODE = "SIGN_UP_CLOSED";

export const SIGN_UP_CLOSED_MESSAGE = FEATURE_TURNED_OFF_MESSAGES["sign-up"];

export const BANNED_USER_MESSAGE =
    "Esta conta foi bloqueada. Fale com o suporte se achar que é um engano.";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: "Email ou senha incorretos. Confira os dois e tente de novo.",
    USER_ALREADY_EXISTS: "Já existe uma conta com este email. Tente entrar.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com este email. Tente entrar.",
    PASSWORD_TOO_SHORT: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    INVALID_EMAIL: "Este email não parece válido.",
    INVALID_PASSWORD: "A senha atual não confere.",
    PASSWORD_TOO_LONG: "A senha nova é longa demais.",
    CREDENTIAL_ACCOUNT_NOT_FOUND: "Esta conta não tem senha para trocar.",
    [VIDEOS_STILL_PROCESSING_CODE]: "Cancele os vídeos em processamento antes de excluir a conta.",
    [LAST_ADMIN_CODE]: LAST_ADMIN_DELETE_MESSAGE,
    [SIGN_UP_CLOSED_CODE]: SIGN_UP_CLOSED_MESSAGE,
    MISSING_RESPONSE: "Aguarde a verificação de segurança terminar e tente de novo.",
    BANNED_USER: BANNED_USER_MESSAGE,
    VERIFICATION_FAILED: "A verificação de segurança falhou. Tente de novo.",
    EMAIL_NOT_VERIFIED:
        "Confirme seu email para entrar. Enviamos um novo link, confira sua caixa de entrada e o spam.",
    INVALID_TOKEN: "Este link expirou ou já foi usado. Peça um novo.",
};

const HTTP_TOO_MANY_REQUESTS = 429;
const TOO_MANY_ATTEMPTS_MESSAGE =
    "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";

const FALLBACK_MESSAGE = "Não foi possível concluir. Confira sua conexão e tente de novo.";

/** The rate limit answers 429 without a code, so the status decides that one. */
export function toAuthErrorMessage(code: string | undefined, status?: number): string {
    if (status === HTTP_TOO_MANY_REQUESTS) {
        return TOO_MANY_ATTEMPTS_MESSAGE;
    }

    if (code === undefined) {
        return FALLBACK_MESSAGE;
    }

    return AUTH_ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
}
