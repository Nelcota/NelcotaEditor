import { Link } from "@tanstack/react-router";
import { pluralize } from "#/modules/videos/ui/pluralize";

export function InProgressNotice({ count }: { count: number }) {
    if (count === 0) {
        return null;
    }

    return (
        <p
            className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground"
            role="status"
        >
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
                className="rounded font-semibold text-foreground underline-offset-4 hover:underline focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                ver no Início
            </Link>
        </p>
    );
}
