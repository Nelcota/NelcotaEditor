import type { ReactNode } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
} from "#/shared/ui/alert-dialog";
import { cn } from "#/shared/ui/cn";
import {
    STEP_DIALOG_CONTENT_CLASS,
    STEP_DIALOG_SINGLE_CLASS,
    StepDialogFrame,
} from "#/shared/ui/step-dialog-frame";

const CONTENT_CLASS = cn(STEP_DIALOG_CONTENT_CLASS, STEP_DIALOG_SINGLE_CLASS);
const ACTION_CLASS = "ms-auto font-medium max-sm:flex-1";

interface ConflictDialogProps {
    isOpen: boolean;
    onTakeTheirs: () => Promise<void>;
    onKeepMine: () => Promise<void>;
}

/** Another tab saved this clip first; nothing is overwritten until the person chooses. */
export function ConflictDialog({ isOpen, onTakeTheirs, onKeepMine }: ConflictDialogProps) {
    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent className={CONTENT_CLASS}>
                <StepDialogFrame
                    kind="alert"
                    rail={null}
                    progress={null}
                    title="Este corte mudou em outra aba"
                    description="Outra aba salvou alterações neste corte. Se você mantiver as suas, as daquela aba se perdem."
                    footer={
                        <>
                            <AlertDialogCancel
                                variant="ghost"
                                onClick={async () => {
                                    await onTakeTheirs();
                                }}
                            >
                                Ver a outra versão
                            </AlertDialogCancel>
                            <AlertDialogAction
                                size="lg"
                                className={ACTION_CLASS}
                                onClick={async () => {
                                    await onKeepMine();
                                }}
                            >
                                Manter as minhas
                            </AlertDialogAction>
                        </>
                    }
                />
            </AlertDialogContent>
        </AlertDialog>
    );
}

interface SharedRenderDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => Promise<void>;
}

/** Only a shared clip asks first: someone else is watching the file that will change. */
export function SharedRenderDialog(props: SharedRenderDialogProps): ReactNode {
    return (
        <AlertDialog open={props.isOpen} onOpenChange={props.onOpenChange}>
            <AlertDialogContent className={CONTENT_CLASS}>
                <StepDialogFrame
                    kind="alert"
                    rail={null}
                    progress={null}
                    title="Renderizar o corte de novo?"
                    description="O arquivo atual é substituído pelo novo. Este corte tem link público: quem abrir o link verá a versão nova depois que a Brasa terminar."
                    footer={
                        <>
                            <AlertDialogCancel variant="ghost" className="text-muted-foreground">
                                Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                size="lg"
                                className={ACTION_CLASS}
                                onClick={async () => {
                                    await props.onConfirm();
                                }}
                            >
                                Renderizar
                            </AlertDialogAction>
                        </>
                    }
                />
            </AlertDialogContent>
        </AlertDialog>
    );
}
