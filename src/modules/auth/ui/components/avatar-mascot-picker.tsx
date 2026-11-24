import type { ReactNode } from "react";
import { AVATAR_MASCOT_COUNT } from "#/modules/auth/model/avatar";
import { cn } from "#/shared/ui/cn";
import { Mascot } from "#/shared/ui/mascot";

const MASCOT_INDEXES = Array.from({ length: AVATAR_MASCOT_COUNT }, (_, index) => index);

interface AvatarMascotPickerProps {
    /** The mascot in use, or null when the avatar is a photo or initials. */
    selectedIndex: number | null;
    isBusy: boolean;
    onPick: (index: number) => void;
}

export function AvatarMascotPicker({
    selectedIndex,
    isBusy,
    onPick,
}: AvatarMascotPickerProps): ReactNode {
    // aria-disabled instead of disabled: a disabled button drops keyboard focus mid-change.
    const handlePick = (index: number): void => {
        if (isBusy === true) {
            return;
        }

        onPick(index);
    };

    return (
        <fieldset aria-busy={isBusy}>
            <legend className="float-left mb-4 w-full text-sm font-medium">
                Ou escolha um mascote
            </legend>
            <div className="clear-both grid grid-cols-5 gap-3">
                {MASCOT_INDEXES.map((index) => (
                    <button
                        key={index}
                        type="button"
                        aria-label={`Mascote ${index + 1}`}
                        aria-pressed={selectedIndex === index}
                        aria-disabled={isBusy}
                        onClick={() => handlePick(index)}
                        className={cn(
                            "grid aspect-square place-items-center rounded-xl border bg-background outline-none transition-[color,background-color,border-color,box-shadow,scale] hover:not-aria-disabled:bg-secondary focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] aria-disabled:opacity-50",
                            "aria-pressed:border-primary aria-pressed:bg-primary/10",
                        )}
                    >
                        <Mascot index={index} className="size-[64%]" />
                    </button>
                ))}
            </div>
        </fieldset>
    );
}
