import type { ReactNode } from "react";
import type { IconComponent } from "#/shared/ui/icon-component";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";

export interface ToolbarSelectOption<Value extends string> {
    value: Value;
    label: ReactNode;
}

interface ToolbarSelectProps<Value extends string> {
    /** Read by screen readers: the trigger only shows the option in use. */
    label: string;
    icon: IconComponent;
    value: Value;
    options: ReadonlyArray<ToolbarSelectOption<Value>>;
    onValueChange: (value: Value) => void;
}

/** The reference's "Filtros" and "Colunas" buttons: a filled box with blue text and icon. */
const TRIGGER_CLASS =
    "h-10 w-full rounded-xl border-transparent bg-card font-semibold text-primary-ink hover:border-input/40 hover:bg-accent sm:w-auto";

/** A filter, order or view choice beside a list's search box, the same on every list. */
export function ToolbarSelect<Value extends string>(props: ToolbarSelectProps<Value>): ReactNode {
    const { label, icon: Icon, value, options, onValueChange } = props;

    return (
        <Select
            value={value}
            onValueChange={(selected) => {
                const option = options.find((candidate) => candidate.value === selected);

                if (option === undefined) {
                    return;
                }

                onValueChange(option.value);
            }}
        >
            <SelectTrigger aria-label={label} className={TRIGGER_CLASS}>
                <Icon aria-hidden="true" className="size-4 text-primary-ink" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
