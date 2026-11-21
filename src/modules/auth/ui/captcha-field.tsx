import type { ReactNode } from "react";
import { TurnstileWidget } from "#/modules/auth/ui/turnstile-widget";
import type { Captcha } from "#/modules/auth/ui/use-captcha";

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
