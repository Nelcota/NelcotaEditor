import AddIcon from "~icons/solar/add-linear";
import { Link } from "@tanstack/react-router";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";

type Emphasis = "primary" | "secondary";

const BUTTON_VARIANTS: Record<Emphasis, "default" | "secondary"> = {
    primary: "default",
    secondary: "secondary",
};

interface NewVideoLinkProps {
    emphasis: Emphasis;
    /** Icon only, for the collapsed sidebar; the label stays for screen readers. */
    isCompact?: boolean;
}

/** Opens the "Novo vídeo" dialog from anywhere. */
export function NewVideoLink({ emphasis, isCompact = false }: NewVideoLinkProps) {
    return (
        <Button
            asChild
            variant={BUTTON_VARIANTS[emphasis]}
            size="lg"
            className={cn(
                // A longer label (another language) wraps inside the pill instead of spilling out.
                "h-auto min-h-11 w-full rounded-full py-2 text-center font-semibold whitespace-normal",
                isCompact === true && "mx-auto size-11 w-11 p-0 has-[>svg]:px-0",
            )}
        >
            <Link to="/" search={{ newVideo: true }} preload="intent">
                <AddIcon aria-hidden="true" />
                <span className={cn(isCompact === true && "sr-only")}>Novo vídeo</span>
            </Link>
        </Button>
    );
}
