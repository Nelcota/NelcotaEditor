const PASSWORD_INPUT_TYPE = "password";

interface PasswordVisibilityCopy {
    buttonText: string;
    buttonLabel: string;
    announcement: string;
}

const HIDDEN_PASSWORD_COPY: PasswordVisibilityCopy = {
    buttonText: "Mostrar",
    buttonLabel: "Mostrar senha",
    announcement: "A senha está escondida.",
};

const VISIBLE_PASSWORD_COPY: PasswordVisibilityCopy = {
    buttonText: "Esconder",
    buttonLabel: "Esconder senha",
    announcement: "A senha está aparecendo.",
};

export function isPasswordInputType(type: string | undefined): boolean {
    return type === PASSWORD_INPUT_TYPE;
}

/** A shown password becomes a plain text input; every other field keeps the type it was given. */
export function resolveInputType(
    type: string | undefined,
    isPasswordVisible: boolean,
): string | undefined {
    if (isPasswordInputType(type) === false) {
        return type;
    }

    if (isPasswordVisible === true) {
        return "text";
    }

    return PASSWORD_INPUT_TYPE;
}

export function getPasswordVisibilityCopy(isPasswordVisible: boolean): PasswordVisibilityCopy {
    if (isPasswordVisible === true) {
        return VISIBLE_PASSWORD_COPY;
    }

    return HIDDEN_PASSWORD_COPY;
}
