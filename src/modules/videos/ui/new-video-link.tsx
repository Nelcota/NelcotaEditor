import AddIcon from "~icons/solar/add-linear";
import { Link } from "@tanstack/react-router";
import { Button } from "#/shared/ui/button";

type Emphasis = "primary" | "secondary";

const BUTTON_VARIANTS: Record<Emphasis, "default" | "secondary"> = {
    primary: "default",
    secondary: "secondary",
};

interface NewVideoLinkProps {
    emphasis: Emphasis;
    className?: string;
}

/** Opens the "Novo vídeo" dialog from anywhere. */
export function NewVideoLink({ emphasis, className }: NewVideoLinkProps) {
    return (
        <Button asChild variant={BUTTON_VARIANTS[emphasis]} className={className}>
            <Link to="/" search={{ newVideo: true }} preload="intent">
                <AddIcon aria-hidden="true" />
                Novo vídeo
            </Link>
        </Button>
    );
}
