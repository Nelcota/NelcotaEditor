import SquarePlusIcon from "~icons/lucide/square-plus";
import UploadIcon from "~icons/lucide/upload";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * The card under the logo (the reference's brand switcher): Nelcota's one main action, starting a
 * new video from a link or a file. Dots on the trailing side, as a flat texture.
 */
export function NewVideoCard(): ReactNode {
    return (
        <Link
            to="/videos"
            search={{ newVideo: true }}
            preload="intent"
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-card-border bg-card p-[11px] outline-none transition-[background-color,scale] hover:bg-accent focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
        >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-solid text-primary-foreground">
                <SquarePlusIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="grid min-w-0 flex-1">
                <span className="text-[0.6875rem] leading-4 font-bold tracking-[0.06em] text-primary-ink uppercase">
                    Novo vídeo
                </span>
                <span className="truncate text-sm font-semibold">Link ou arquivo</span>
            </span>
            <span
                aria-hidden="true"
                className="dot-texture absolute inset-y-0 end-0 w-16 opacity-60"
            />
            <UploadIcon aria-hidden="true" className="relative size-5 shrink-0 text-primary-ink" />
        </Link>
    );
}
