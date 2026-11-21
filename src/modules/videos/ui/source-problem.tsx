import DangerCircleIcon from "~icons/solar/danger-circle-linear";

interface SourceProblemProps {
    id: string;
    message: string | null;
}

/**
 * What is wrong with the link or the file, right under it; nothing when all is fine. The field
 * points at it with aria-describedby, so it is read when the field gets focus.
 */
export function SourceProblem({ id, message }: SourceProblemProps) {
    if (message === null) {
        return null;
    }

    return (
        <p id={id} className="flex items-start gap-1.5 text-sm text-destructive">
            <DangerCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {message}
        </p>
    );
}
