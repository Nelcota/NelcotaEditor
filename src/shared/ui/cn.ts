import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The theme's own sizes, weights and tracking from `src/styles.css`. Unknown to tailwind-merge,
 * `text-title` would read as a colour: it would sit beside `text-xl` instead of replacing it, and
 * `text-meta` could replace `text-muted-foreground`.
 */
const mergeClasses = extendTailwindMerge({
    extend: {
        theme: {
            text: ["meta", "title", "logo", "display"],
            "font-weight": ["title", "title-strong"],
            tracking: ["display", "eyebrow"],
        },
    },
});

export function cn(...inputs: Array<ClassValue>): string {
    return mergeClasses(clsx(inputs));
}
