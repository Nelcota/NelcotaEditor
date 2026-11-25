import { useId } from "react";
import type { ReactNode } from "react";
import { SettingsRow } from "#/shared/ui/settings-row";
import { Switch } from "#/shared/ui/switch";
import { useMascotAnimations } from "#/shared/ui/use-mascot-animations";

export function MascotAnimationSetting(): ReactNode {
    const labelId = useId();
    const descriptionId = `${labelId}-description`;
    const { isEnabled, toggle } = useMascotAnimations();

    return (
        <SettingsRow
            labelId={labelId}
            label="Animações dos mascotes"
            description={<span id={descriptionId}>Esta opção vale para este navegador.</span>}
        >
            <Switch
                aria-labelledby={labelId}
                aria-describedby={descriptionId}
                checked={isEnabled}
                onCheckedChange={toggle}
            />
        </SettingsRow>
    );
}
