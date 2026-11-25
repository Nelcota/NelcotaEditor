import { useId } from "react";
import type { ReactNode } from "react";
import { SettingsRow } from "#/shared/ui/settings-row";
import { useMascotAnimations } from "#/shared/ui/use-mascot-animations";

export function MascotAnimationSetting(): ReactNode {
    const inputId = useId();
    const { isEnabled, toggle } = useMascotAnimations();

    return (
        <SettingsRow
            label={<label htmlFor={inputId}>Animações dos mascotes</label>}
            description="Esta opção vale para este navegador."
        >
            <input
                id={inputId}
                type="checkbox"
                checked={isEnabled}
                onChange={toggle}
                className="size-6 rounded-sm accent-primary-solid focus-visible:ring-4 focus-visible:ring-ring"
            />
        </SettingsRow>
    );
}
