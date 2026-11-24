import TimerIcon from "~icons/lucide/timer";
import type { ReactNode } from "react";
import { CLIP_LENGTH_HINTS, CLIP_LENGTH_LABELS } from "#/modules/preferences/preferences";
import { CLIP_LENGTHS } from "#/modules/video-records/clip-length";
import type { ClipLength } from "#/modules/video-records/clip-length";
import { SegmentedControl } from "#/shared/ui/segmented-control";

const LABEL = "Duração dos cortes";

const CLIP_LENGTH_OPTIONS = CLIP_LENGTHS.map((clipLength) => ({
    value: clipLength,
    label: CLIP_LENGTH_LABELS[clipLength],
}));

interface ClipLengthPickerProps {
    /** In a settings row the row names it and says the hint, so both step aside here. */
    isInline?: boolean;
    value: ClipLength;
    onValueChange: (clipLength: ClipLength) => void;
}

/** Three fixed choices side by side; the line below says what the chosen one means. */
export function ClipLengthPicker({
    isInline = false,
    value,
    onValueChange,
}: ClipLengthPickerProps): ReactNode {
    if (isInline === true) {
        return (
            <SegmentedControl
                label={LABEL}
                value={value}
                options={CLIP_LENGTH_OPTIONS}
                onValueChange={onValueChange}
                className="flex-nowrap [&>button]:whitespace-nowrap"
            />
        );
    }

    return (
        <div className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
                <TimerIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                {LABEL}
            </span>
            <SegmentedControl
                label={LABEL}
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
