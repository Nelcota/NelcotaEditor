import CircleAlertIcon from "~icons/lucide/circle-alert";

export function FormAlert({ message }: { message: string | null }) {
    if (message === null) {
        return null;
    }

    return (
        <p
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {message}
        </p>
    );
}
