import type { ReactNode } from "react";
import { TurnstileWidget } from "#/shared/ui/turnstile-widget";
import type { Captcha } from "#/shared/ui/use-captcha";

export function CaptchaField({ captcha }: { captcha: Captcha }): ReactNode {
    const siteKey = captcha.siteKey;

    if (siteKey === null) {
        return null;
    }

    return (
        <TurnstileWidget
            key={captcha.widgetKey}
            siteKey={siteKey}
            onTokenChange={captcha.setToken}
        />
    );
}
