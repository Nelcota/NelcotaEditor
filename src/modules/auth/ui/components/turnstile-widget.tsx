import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { FormAlert } from "#/shared/ui/form-alert";

const TURNSTILE_SCRIPT_URL =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const LOAD_FAILED_MESSAGE =
    "Não foi possível carregar a verificação de segurança. Recarregue a página.";

interface TurnstileRenderOptions {
    sitekey: string;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
    theme: "dark";
    language: string;
    size: "flexible";
}

interface TurnstileApi {
    render: (container: HTMLElement, options: TurnstileRenderOptions) => string | undefined;
    remove: (widgetId: string) => void;
}

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

class TurnstileUnavailableError extends Error {
    constructor() {
        super("The Cloudflare Turnstile script did not load");
        this.name = "TurnstileUnavailableError";
    }
}

let turnstileLoading: Promise<TurnstileApi> | null = null;

/** One script tag for the whole app, however many times the widget mounts. */
function loadTurnstile(): Promise<TurnstileApi> {
    if (turnstileLoading !== null) {
        return turnstileLoading;
    }

    turnstileLoading = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = TURNSTILE_SCRIPT_URL;
        script.addEventListener("load", () => {
            const api = window.turnstile;

            if (api === undefined) {
                reject(new TurnstileUnavailableError());
                return;
            }

            resolve(api);
        });
        script.addEventListener("error", () => {
            // A later mount (the next attempt) tries again instead of reusing the failure.
            turnstileLoading = null;
            script.remove();
            reject(new TurnstileUnavailableError());
        });
        document.head.append(script);
    });

    return turnstileLoading;
}

interface TurnstileWidgetProps {
    siteKey: string;
    /** Must be stable (a state setter or a ref writer): a new function re-renders the widget. */
    onTokenChange: (token: string | null) => void;
}

/** Cloudflare Turnstile; reports a fresh token, or null while there is none to send. */
export function TurnstileWidget({ siteKey, onTokenChange }: TurnstileWidgetProps): ReactNode {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasLoadFailed, setHasLoadFailed] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        let widgetId: string | undefined = undefined;
        let isUnmounted = false;

        if (container === null) {
            return;
        }

        async function mountWidget(target: HTMLDivElement): Promise<void> {
            try {
                const api = await loadTurnstile();

                if (isUnmounted === true) {
                    return;
                }

                widgetId = api.render(target, {
                    sitekey: siteKey,
                    callback: onTokenChange,
                    "expired-callback": () => onTokenChange(null),
                    "error-callback": () => onTokenChange(null),
                    theme: "dark",
                    language: "pt-br",
                    size: "flexible",
                });
            } catch (error) {
                console.warn("Could not show the Turnstile check", error);
                setHasLoadFailed(true);
            }
        }

        void mountWidget(container);

        return () => {
            isUnmounted = true;
            const api = window.turnstile;

            if (widgetId !== undefined && api !== undefined) {
                api.remove(widgetId);
            }
        };
    }, [siteKey, onTokenChange]);

    if (hasLoadFailed === true) {
        return <FormAlert message={LOAD_FAILED_MESSAGE} />;
    }

    return <div ref={containerRef} className="min-h-[65px]" />;
}
