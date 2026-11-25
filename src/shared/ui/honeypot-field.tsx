import type { ReactNode } from "react";

interface HoneypotFieldProps {
    name: string;
    value: string;
    onValueChange: (value: string) => void;
}

/**
 * Off screen instead of display: none, which some bots skip. Hidden from screen readers and the
 * Tab key, so only a bot that fills every input fills it; the server then fakes a success.
 */
export function HoneypotField({ name, value, onValueChange }: HoneypotFieldProps): ReactNode {
    return (
        <div aria-hidden="true" className="sr-only">
            <label htmlFor={name}>Site</label>
            <input
                id={name}
                name={name}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
            />
        </div>
    );
}
