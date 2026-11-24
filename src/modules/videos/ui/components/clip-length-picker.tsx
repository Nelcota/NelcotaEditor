import TimerIcon from "~icons/lucide/timer";
import type { ReactNode } from "react";
import {
    CLIP_LENGTH_HINTS,
    CLIP_LENGTH_LABEL,
    CLIP_LENGTH_OPTIONS,
} from "#/modules/preferences/model/preferences";
import type { ClipLength } from "#/modules/video-records/model/clip-length";
import { SegmentedControl } from "#/shared/ui/segmented-control";

interface ClipLengthPickerProps {
    value: ClipLength;
    onValueChange: (clipLength: ClipLength) => void;
}

/** Three fixed choices side by side; the line below says what the chosen one means. */
export function ClipLengthPicker({ value, onValueChange }: ClipLengthPickerProps): ReactNode {
    return (
        <div className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
                <TimerIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                {CLIP_LENGTH_LABEL}
            </span>
            <SegmentedControl
                label={CLIP_LENGTH_LABEL}
                value={value}
                options={CLIP_LENGTH_OPTIONS}
                onValueChange={onValueChange}
            />
            <p aria-live="polite" className="text-sm text-muted-foreground">
                {CLIP_LENGTH_HINTS[value]}
            </p>
        </div>
    );
}
