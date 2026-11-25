import { useState } from "react";
import type { ReactNode } from "react";
import { CountStepper } from "#/shared/ui/count-stepper";
import { SegmentedControl } from "#/shared/ui/segmented-control";

const OTHER_OPTION = "other";

interface QuickCountPickerProps {
    id: string;
    label: string;
    icon: ReactNode;
    /** The counts people pick most, as pills; anything else in range is under "Outro". */
    quickCounts: ReadonlyArray<number>;
    stepper: {
        min: number;
        max: number;
        formatValue: (value: number) => string;
        decreaseLabel: string;
        increaseLabel: string;
    };
    value: number;
    onValueChange: (count: number) => void;
}

/** The common counts as the same pills the other short choices use, with a stepper for the rest. */
export function QuickCountPicker(props: QuickCountPickerProps): ReactNode {
    const { id, label, icon, quickCounts, stepper, value, onValueChange } = props;
    const [isOtherOpen, setIsOtherOpen] = useState(quickCounts.includes(value) === false);
    const options = [
        ...quickCounts.map((count) => ({ value: String(count), label: String(count) })),
        { value: OTHER_OPTION, label: "Outro" },
    ];
    let selected = String(value);

    if (isOtherOpen === true) {
        selected = OTHER_OPTION;
    }

    const select = (option: string): void => {
        if (option === OTHER_OPTION) {
            setIsOtherOpen(true);
            return;
        }

        setIsOtherOpen(false);
        onValueChange(Number(option));
    };

    return (
        <div className="grid gap-2">
            <SegmentedControl
                label={label}
                value={selected}
                options={options}
                onValueChange={select}
            />
            {isOtherOpen === true && (
                <CountStepper
                    {...stepper}
                    icon={icon}
                    id={id}
                    label={label}
                    labelClassName="sr-only"
                    value={value}
                    onValueChange={onValueChange}
                />
            )}
        </div>
    );
}
