import { useState } from "react";
import { ClipCountSelect } from "#/modules/videos/ui/clip-count-select";
import { cn } from "#/shared/ui/cn";

/** The counts people pick most; anything else from 1 to 10 is under "Outro". */
const QUICK_COUNTS: ReadonlyArray<number> = [3, 5, 8, 10];

const OPTION_CLASS =
    "grid h-9 place-items-center rounded-[9px] text-sm font-bold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99] aria-pressed:bg-popover aria-pressed:text-foreground aria-pressed:shadow-sm disabled:cursor-not-allowed disabled:opacity-50";

interface ClipCountPickerProps {
    value: number;
    onValueChange: (count: number) => void;
    disabled: boolean;
}

export function ClipCountPicker({ value, onValueChange, disabled }: ClipCountPickerProps) {
    const [isOtherOpen, setIsOtherOpen] = useState(QUICK_COUNTS.includes(value) === false);

    return (
        <fieldset className="grid gap-2" disabled={disabled}>
            <legend className="mb-2 text-sm font-semibold">Quantos cortes?</legend>
            <div className="grid grid-cols-5 gap-1 rounded-xl bg-secondary p-1">
                {QUICK_COUNTS.map((count) => (
                    <button
                        key={count}
                        type="button"
                        aria-pressed={isOtherOpen === false && value === count}
                        onClick={() => {
                            setIsOtherOpen(false);
                            onValueChange(count);
                        }}
                        className={OPTION_CLASS}
                    >
                        {count}
                    </button>
                ))}
                <button
                    type="button"
                    aria-pressed={isOtherOpen}
                    onClick={() => setIsOtherOpen(true)}
                    className={cn(OPTION_CLASS, "font-semibold")}
                >
                    Outro
                </button>
            </div>
            {isOtherOpen === true && (
                <ClipCountSelect
                    id="new-video-clip-count"
                    label="Quantidade de cortes"
                    value={value}
                    onValueChange={onValueChange}
                    disabled={disabled}
                />
            )}
        </fieldset>
    );
}
