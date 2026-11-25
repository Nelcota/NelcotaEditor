import { useRef, useState } from "react";

export const CAPTCHA_PENDING_MESSAGE =
    "Aguarde a verificação de segurança terminar e tente de novo.";

export interface Captcha {
    /** null when Turnstile is not configured: no widget, no token required. */
    siteKey: string | null;
    /** Changing it remounts the widget, which asks Turnstile for a new token. */
    widgetKey: number;
    setToken: (token: string | null) => void;
    isWaitingForToken: () => boolean;
    /** The current token, or null before the widget solved; the form sends it its own way. */
    readToken: () => string | null;
    /** A token is single use: after any submit the next attempt needs a new one. */
    renew: () => void;
}

/** The token lives in a ref: the form's submit handler reads it, nothing renders from it. */
export function useCaptcha(siteKey: string | null): Captcha {
    const tokenRef = useRef<string | null>(null);
    const [widgetKey, setWidgetKey] = useState(0);
    const setToken = (token: string | null): void => {
        tokenRef.current = token;
    };
    const isWaitingForToken = (): boolean => siteKey !== null && tokenRef.current === null;
    const readToken = (): string | null => tokenRef.current;
    const renew = (): void => {
        tokenRef.current = null;
        setWidgetKey((key) => key + 1);
    };

    return { siteKey, widgetKey, setToken, isWaitingForToken, readToken, renew };
}
