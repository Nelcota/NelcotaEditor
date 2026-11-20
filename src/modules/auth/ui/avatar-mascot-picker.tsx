import type { ReactNode } from "react";
import { AVATAR_MASCOT_COUNT } from "#/modules/auth/avatar";
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
    return (
        <fieldset disabled={isBusy} aria-busy={isBusy}>
            <legend className="float-left mb-4 w-full text-sm font-semibold">
                Ou escolha um mascote
            </legend>
            <div className="clear-both grid grid-cols-5 gap-3">
                {MASCOT_INDEXES.map((index) => (
                    <button
                        key={index}
                        type="button"
                        aria-label={`Mascote ${index + 1}`}
                        aria-pressed={selectedIndex === index}
                        onClick={() => onPick(index)}
                        className={cn(
                            "grid aspect-square place-items-center rounded-xl border bg-background outline-none transition-colors hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
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
