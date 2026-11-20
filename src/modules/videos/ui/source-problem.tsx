import DangerCircleIcon from "~icons/solar/danger-circle-linear";

/** What is wrong with the link or the file, right under it; nothing when all is fine. */
export function SourceProblem({ message }: { message: string | null }) {
    if (message === null) {
        return null;
    }

    return (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
            <DangerCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {message}
        </p>
    );
}
