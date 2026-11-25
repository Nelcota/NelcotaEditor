import ArrowRightIcon from "~icons/lucide/arrow-right";
import CircleCheckIcon from "~icons/lucide/circle-check";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { ViralFormat } from "#/modules/viral-formats/model/viral-formats";
import { FormatCover } from "#/modules/viral-formats/ui/components/format-cover";
import { Button } from "#/shared/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "#/shared/ui/dialog";

interface FormatDialogProps {
    format: ViralFormat;
    onClose: () => void;
}

/**
 * A format up close: its layout, what it does and the way on. Editing needs the person's Claude,
 * so choosing a format leads to Etapa 1 until the connection exists.
 */
export function FormatDialog({ format, onClose }: FormatDialogProps): ReactNode {
    function closeOnDismiss(isOpen: boolean): void {
        if (isOpen === true) {
            return;
        }

        onClose();
    }

    return (
        <Dialog open onOpenChange={closeOnDismiss}>
            <DialogContent className="sm:max-w-3xl sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-8">
                <FormatCover formatId={format.id} className="max-sm:hidden" />
                <div className="grid content-start gap-4">
                    <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                        Formato
                    </p>
                    <DialogTitle className="text-title font-extrabold">{format.name}</DialogTitle>
                    <DialogDescription>{format.description}</DialogDescription>
                    <ul className="grid gap-2.5">
                        {format.highlights.map((highlight) => (
                            <li key={highlight} className="flex items-start gap-2.5">
                                <CircleCheckIcon
                                    aria-hidden="true"
                                    className="mt-0.5 size-5 shrink-0 text-primary-ink"
                                />
                                {highlight}
                            </li>
                        ))}
                    </ul>
                    <p className="text-sm text-muted-foreground">
                        Para editar neste formato, conecte o seu Claude na Etapa 1.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild size="lg" className="font-bold">
                            <Link to="/claude">
                                Ir para a Etapa 1
                                <ArrowRightIcon aria-hidden="true" className="size-4" />
                            </Link>
                        </Button>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" size="lg">
                                Voltar
                            </Button>
                        </DialogClose>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
