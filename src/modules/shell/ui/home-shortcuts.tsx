import ChartNoAxesColumnIcon from "~icons/lucide/chart-no-axes-column";
import ScissorsIcon from "~icons/lucide/scissors";
import UploadIcon from "~icons/lucide/upload";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const SHORTCUT_CLASS =
    "inline-flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-medium text-secondary-foreground outline-none transition-[color,background-color,scale] hover:bg-accent focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] [&>svg]:size-4 [&>svg]:text-muted-foreground";

/** The three chips under the link box: the other ways in besides pasting a link. */
export function HomeShortcuts(): ReactNode {
    return (
        <nav aria-label="Atalhos" className="flex flex-wrap justify-center gap-2">
            <Link to="/videos" search={{ newVideo: true }} className={SHORTCUT_CLASS}>
                <UploadIcon aria-hidden="true" />
                Enviar um arquivo
            </Link>
            <Link to="/clips" className={SHORTCUT_CLASS}>
                <ScissorsIcon aria-hidden="true" />
                Ver meus cortes
            </Link>
            <Link to="/overview" className={SHORTCUT_CLASS}>
                <ChartNoAxesColumnIcon aria-hidden="true" />
                Analisar meus resultados
            </Link>
        </nav>
    );
}
