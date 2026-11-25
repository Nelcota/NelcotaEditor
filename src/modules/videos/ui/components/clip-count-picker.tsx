import ScissorsIcon from "~icons/lucide/scissors";
import type { ReactNode } from "react";
import { CLIP_COUNT_STEPPER, QUICK_CLIP_COUNTS } from "#/modules/preferences/model/preferences";
import { QuickCountPicker } from "#/shared/ui/quick-count-picker";

interface ClipCountPickerProps {
    value: number;
    onValueChange: (count: number) => void;
}

export function ClipCountPicker({ value, onValueChange }: ClipCountPickerProps): ReactNode {
    return (
        <div className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
                <ScissorsIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                Quantos cortes
            </span>
            <QuickCountPicker
                id="new-video-clip-count"
                label="Quantos cortes"
                icon={<ScissorsIcon aria-hidden="true" className="size-5 text-muted-foreground" />}
                quickCounts={QUICK_CLIP_COUNTS}
                stepper={CLIP_COUNT_STEPPER}
                value={value}
                onValueChange={onValueChange}
            />
        </div>
    );
}
