import { useCallback, useRef, useState } from "react";
import { buildCaptchaHeaders } from "#/modules/auth/client/captcha-headers";

export const CAPTCHA_PENDING_MESSAGE =
    "Aguarde a verificação de segurança terminar e tente de novo.";

export interface Captcha {
    /** null when Turnstile is not configured: no widget, no token required. */
    siteKey: string | null;
    /** Changing it remounts the widget, which asks Turnstile for a new token. */
    widgetKey: number;
    setToken: (token: string | null) => void;
    isWaitingForToken: () => boolean;
    buildHeaders: () => Record<string, string>;
    /** A token is single use: after any submit the next attempt needs a new one. */
    renew: () => void;
}

/** The token lives in a ref: the form's submit handler reads it, nothing renders from it. */
export function useCaptcha(siteKey: string | null): Captcha {
    const tokenRef = useRef<string | null>(null);
    const [widgetKey, setWidgetKey] = useState(0);
    const setToken = useCallback((token: string | null): void => {
        tokenRef.current = token;
    }, []);
    const isWaitingForToken = useCallback(
        (): boolean => siteKey !== null && tokenRef.current === null,
        [siteKey],
    );
    const buildHeaders = useCallback(
        (): Record<string, string> => buildCaptchaHeaders(tokenRef.current),
        [],
    );
    const renew = useCallback((): void => {
        tokenRef.current = null;
        setWidgetKey((key) => key + 1);
    }, []);

    return { siteKey, widgetKey, setToken, isWaitingForToken, buildHeaders, renew };
}
