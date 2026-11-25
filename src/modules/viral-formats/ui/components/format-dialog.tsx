import ArrowRightIcon from "~icons/lucide/arrow-right";
import CircleCheckIcon from "~icons/lucide/circle-check";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { ViralFormat } from "#/modules/viral-formats/model/viral-formats";
import { ChooseFormatButton } from "#/modules/viral-formats/ui/components/choose-format-button";
import { FormatPreview } from "#/modules/viral-formats/ui/components/format-preview";
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
    isClaudeConnected: boolean;
    onClose: () => void;
}

function BackButton(): ReactNode {
    return (
        <DialogClose asChild>
            <Button type="button" variant="secondary" size="lg">
                Voltar
            </Button>
        </DialogClose>
    );
}

/** Without Claude there is nothing to edit with yet, so the way on is Etapa 1. */
function ConnectFirst(): ReactNode {
    return (
        <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">
                Para editar neste formato, conecte o seu Claude na Etapa 1.
            </p>
            <div className="flex flex-wrap gap-2">
                <Button asChild size="lg" className="font-bold">
                    <Link to="/claude">
                        Conectar o Claude
                        <ArrowRightIcon aria-hidden="true" className="size-4" />
                    </Link>
                </Button>
                <BackButton />
            </div>
        </div>
    );
}

/**
 * A format up close: its layout on one side, what it does and the way on beside it. Editing
 * happens in the person's Claude; choosing a format opens a batch for the raw videos.
 */
export function FormatDialog({ format, isClaudeConnected, onClose }: FormatDialogProps): ReactNode {
    function closeOnDismiss(isOpen: boolean): void {
        if (isOpen === true) {
            return;
        }

        onClose();
    }

    return (
        <Dialog open onOpenChange={closeOnDismiss}>
            <DialogContent className="gap-0 p-0 [--dialog-padding:--spacing(5)] sm:max-w-3xl sm:grid-cols-2">
                <FormatPreview format={format} />
                <div className="grid grid-rows-[1fr_auto] gap-8 p-6 sm:p-8">
                    <div className="grid content-start gap-4">
                        <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                            Formato
                        </p>
                        <DialogTitle className="text-title font-extrabold tracking-[-0.02em]">
                            {format.name}
                        </DialogTitle>
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
                    </div>
                    {isClaudeConnected === false && <ConnectFirst />}
                    {isClaudeConnected === true && (
                        <ChooseFormatButton format={format}>
                            <BackButton />
                        </ChooseFormatButton>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
