import ScissorsIcon from "~icons/solar/scissors-linear";
import { MAX_CLIP_COUNT, MIN_CLIP_COUNT } from "#/modules/videos/video-status";
import { pluralize } from "#/modules/videos/ui/pluralize";
import { Label } from "#/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";

const CLIP_COUNT_OPTIONS = Array.from(
    { length: MAX_CLIP_COUNT - MIN_CLIP_COUNT + 1 },
    (_, index) => MIN_CLIP_COUNT + index,
);

function describeCount(count: number): string {
    return `${count} ${pluralize(count, "corte", "cortes")}`;
}

interface ClipCountSelectProps {
    id: string;
    label?: string;
    value: number;
    onValueChange: (value: number) => void;
    disabled?: boolean;
}

export function ClipCountSelect({
    id,
    label = "Cortes",
    value,
    onValueChange,
    disabled,
}: ClipCountSelectProps) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                <ScissorsIcon aria-hidden="true" className="size-[18px] text-muted-foreground" />
                {label}
            </Label>
            <Select
                value={String(value)}
                onValueChange={(selected) => onValueChange(Number(selected))}
                disabled={disabled}
            >
                <SelectTrigger id={id} className="h-11 w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {CLIP_COUNT_OPTIONS.map((count) => (
                        <SelectItem key={count} value={String(count)}>
                            {describeCount(count)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
