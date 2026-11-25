import { useStoredFlag } from "#/shared/ui/use-stored-flag";

const MASCOT_ANIMATIONS_DISABLED_KEY = "nelcota:mascot-animations-disabled";

export function useMascotAnimations(): { isEnabled: boolean; toggle: () => void } {
    // Wait for the browser preference before starting any animation.
    const { isOn, toggle } = useStoredFlag(MASCOT_ANIMATIONS_DISABLED_KEY, true);
    return { isEnabled: isOn === false, toggle };
}
