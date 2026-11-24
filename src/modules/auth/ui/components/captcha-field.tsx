import type { ReactNode } from "react";
import { TurnstileWidget } from "#/modules/auth/ui/components/turnstile-widget";
import type { Captcha } from "#/modules/auth/ui/hooks/use-captcha";

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
