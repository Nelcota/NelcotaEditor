import { Link } from "@tanstack/react-router";
import { pluralize } from "#/shared/ui/pluralize";

/** Always mounted, so a change in the count is announced; with nothing running it is empty. */
export function InProgressNotice({ count }: { count: number }) {
    return (
        <p
            className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground empty:sr-only"
            role="status"
        >
            {count > 0 && <InProgressText count={count} />}
        </p>
    );
}

function InProgressText({ count }: { count: number }) {
    return (
        <>
            <span
                className="size-2 rounded-full bg-primary motion-safe:animate-pulse"
                aria-hidden="true"
            />
            {count}{" "}
            {pluralize(
                count,
                "vídeo em andamento ainda não entra",
                "vídeos em andamento ainda não entram",
            )}{" "}
            nos números ·
            <Link
                to="/"
                search={{ status: "processing" }}
                className="rounded font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
            >
                ver em Vídeos
            </Link>
        </>
    );
}
