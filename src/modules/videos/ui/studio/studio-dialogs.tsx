import type { ReactNode } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "#/shared/ui/alert-dialog";

interface ConflictDialogProps {
    isOpen: boolean;
    onTakeTheirs: () => Promise<void>;
    onKeepMine: () => Promise<void>;
}

/** Another tab saved this clip first; nothing is overwritten until the person chooses. */
export function ConflictDialog({ isOpen, onTakeTheirs, onKeepMine }: ConflictDialogProps) {
    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Este corte mudou em outra aba</AlertDialogTitle>
                    <AlertDialogDescription>
                        Outra aba salvou alterações neste corte. Se você mantiver as suas, as
                        daquela aba se perdem.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={async () => {
                            await onTakeTheirs();
                        }}
                    >
                        Ver a outra versão
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={async () => {
                            await onKeepMine();
                        }}
                    >
                        Manter as minhas
                    </AlertDialogAction>
                </AlertDialogFooter>
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
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Renderizar o corte de novo?</AlertDialogTitle>
                    <AlertDialogDescription>
                        O arquivo atual é substituído pelo novo. Este corte tem link público: quem
                        abrir o link verá a versão nova depois que a Brasa terminar.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={async () => {
                            await props.onConfirm();
                        }}
                    >
                        Renderizar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
