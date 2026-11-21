import MagniferIcon from "~icons/solar/magnifer-linear";

interface SearchFieldProps {
    /** Read by screen readers; the placeholder can say something shorter or more specific. */
    label: string;
    placeholder: string;
    value: string;
    onValueChange: (value: string) => void;
}

/** The rounded search box used above every searchable list. */
export function SearchField({ label, placeholder, value, onValueChange }: SearchFieldProps) {
    return (
        <label className="flex h-10 w-full items-center gap-2 rounded-full border border-input bg-popover px-3.5 text-muted-foreground transition-colors hover:border-ring/60 focus-within:ring-4 focus-within:ring-ring/70 sm:w-72">
            <MagniferIcon className="size-5 shrink-0" aria-hidden="true" />
            <span className="sr-only">{label}</span>
            <input
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                placeholder={placeholder}
                className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
        </label>
    );
}
