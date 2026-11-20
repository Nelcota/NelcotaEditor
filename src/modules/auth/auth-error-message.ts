import { MIN_PASSWORD_LENGTH } from "#/modules/auth/auth-forms.schema";

export const VIDEOS_STILL_PROCESSING_CODE = "VIDEOS_STILL_PROCESSING";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: "Email ou senha incorretos.",
    USER_ALREADY_EXISTS: "Já existe uma conta com este email. Tente entrar.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com este email. Tente entrar.",
    PASSWORD_TOO_SHORT: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    INVALID_EMAIL: "Este email não parece válido.",
    INVALID_PASSWORD: "A senha atual não confere.",
    PASSWORD_TOO_LONG: "A senha nova é longa demais.",
    CREDENTIAL_ACCOUNT_NOT_FOUND: "Esta conta não tem senha para trocar.",
    [VIDEOS_STILL_PROCESSING_CODE]: "Cancele os vídeos em processamento antes de excluir a conta.",
};

const FALLBACK_MESSAGE = "Não foi possível continuar. Tente novamente.";

export function toAuthErrorMessage(code: string | undefined): string {
    if (code === undefined) {
        return FALLBACK_MESSAGE;
    }

    return AUTH_ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
}
