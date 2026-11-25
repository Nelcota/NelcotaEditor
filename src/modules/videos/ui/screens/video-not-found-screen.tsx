import ArrowLeftIcon from "~icons/lucide/arrow-left";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";
import { NotFoundScreen } from "#/shared/ui/not-found-screen";

/** A missing video leads back to the library it would have been in. */
export function VideoNotFoundScreen(): ReactNode {
    return (
        <NotFoundScreen
            returnLink={
                <Button asChild variant="secondary">
                    <Link to="/videos">
                        <ArrowLeftIcon aria-hidden="true" />
                        Voltar para Vídeos
                    </Link>
                </Button>
            }
        />
    );
}
