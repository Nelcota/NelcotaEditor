import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ticketVideoOptionsQueryOptions } from "#/modules/support/model/support-queries";
import { Label } from "#/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";

/** Radix Select needs a non-empty value for every item, so "no video" has its own. */
const NO_VIDEO_VALUE = "none";

interface TicketVideoFieldProps {
    id: string;
    value: string;
    disabled: boolean;
    onValueChange: (videoId: string) => void;
}

function toOptionValue(fieldValue: string): string {
    if (fieldValue.length === 0) {
        return NO_VIDEO_VALUE;
    }

    return fieldValue;
}

function toFieldValue(optionValue: string): string {
    if (optionValue === NO_VIDEO_VALUE) {
        return "";
    }

    return optionValue;
}

/** Optional: the video the ticket is about, from the person's newest ones. */
export function TicketVideoField({
    id,
    value,
    disabled,
    onValueChange,
}: TicketVideoFieldProps): ReactNode {
    const { data: videos } = useQuery(ticketVideoOptionsQueryOptions());

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>Vídeo (opcional)</Label>
            <Select
                value={toOptionValue(value)}
                disabled={disabled}
                onValueChange={(optionValue) => onValueChange(toFieldValue(optionValue))}
            >
                <SelectTrigger id={id} className="h-11 w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                    <SelectItem value={NO_VIDEO_VALUE}>Nenhum vídeo</SelectItem>
                    {(videos ?? []).map((video) => (
                        <SelectItem key={video.id} value={video.id}>
                            {video.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
