import type { AppSwitchKey } from "#/modules/app-switches/model/app-switch";
import { UserFacingError } from "#/shared/server/user-facing-error";

type RefusableSwitchKey = Exclude<AppSwitchKey, "video-processing" | "email-verification">;

/** Shown both when the server refuses and where the screen explains the missing control. */
export const FEATURE_TURNED_OFF_MESSAGES: Readonly<Record<RefusableSwitchKey, string>> = {
    "sign-up": "Os cadastros estão fechados no momento.",
    "youtube-links": "O envio por link do YouTube está pausado no momento. Tente mais tarde.",
    "file-uploads": "O envio de arquivos está pausado no momento. Tente mais tarde.",
    "clip-sharing": "O compartilhamento de cortes está pausado no momento.",
    support: "O suporte está pausado no momento. Tente mais tarde.",
    "maintenance-mode": "O Editor Oculto está em manutenção. Volte em instantes.",
};

export class FeatureTurnedOffError extends UserFacingError {
    readonly switchKey: RefusableSwitchKey;

    constructor(switchKey: RefusableSwitchKey) {
        super(FEATURE_TURNED_OFF_MESSAGES[switchKey]);
        this.name = "FeatureTurnedOffError";
        this.switchKey = switchKey;
    }
}
