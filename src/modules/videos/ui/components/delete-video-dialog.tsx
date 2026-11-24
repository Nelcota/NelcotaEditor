import TrashIcon from "~icons/lucide/trash";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import type { ReactNode } from "react";
import { deleteVideo } from "#/modules/videos/server/video-functions";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import {
    invalidateVideoQueries,
    videoDetailsQueryOptions,
} from "#/modules/videos/model/video-queries";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
} from "#/shared/ui/alert-dialog";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { FormAlert } from "#/shared/ui/form-alert";
import { LossList } from "#/shared/ui/loss-list";
import type { LossItem } from "#/shared/ui/loss-list";
import { pluralize } from "#/shared/ui/pluralize";
import { StepBackButton } from "#/shared/ui/step-back-button";
import {
    STEP_ALERT_WIDE_CLASS,
    STEP_DIALOG_CONTENT_CLASS,
    StepDialogFrame,
} from "#/shared/ui/step-dialog-frame";
import { StepRail } from "#/shared/ui/step-rail";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { useSteps } from "#/shared/ui/use-steps";

const FALLBACK_ERROR_MESSAGE =
    "Não foi possível excluir o vídeo. Confira sua conexão e tente de novo.";

const STEPS = [
    {
        title: "O que some",
        hint: "Confira antes",
        heading: "Isto vai sumir",
        description: "Não tem lixeira. Os cortes que você já baixou continuam no seu aparelho.",
    },
    {
        title: "Confirmar",
        hint: "Sem volta",
        heading: "Excluir para sempre?",
        description: "O vídeo e os cortes dele são apagados agora.",
    },
] as const;

const CONFIRM_INDEX = 1;

/** The card and its menu button are gone after a delete, so focus goes to the page content. */
function focusMainContent(event: Event): void {
    const main = document.getElementById("main");

    if (main === null) {
        return;
    }

    event.preventDefault();
    main.focus();
}

function describeLosses(video: VideoSummary): Array<LossItem> {
    const clipCount = video.readyClipCount;
    const clipWord = pluralize(clipCount, "corte", "cortes");

    return [
        { label: "Vídeo", detail: video.title },
        { label: "Cortes prontos", detail: `${clipCount} ${clipWord}` },
        { label: "Links públicos dos cortes", detail: "param de abrir" },
    ];
}

interface DeleteFooterProps {
    isConfirmStep: boolean;
    isDeleting: boolean;
    onNext: () => void;
    onBack: () => void;
    onDelete: () => void;
}

/** Cancelar and Continuar first; Voltar and the delete itself only on the last step. */
function DeleteFooter(props: DeleteFooterProps): ReactNode {
    const { isConfirmStep, isDeleting, onNext, onBack, onDelete } = props;

    if (isConfirmStep === false) {
        return (
            <>
                <AlertDialogCancel variant="ghost" className="text-muted-foreground">
                    Cancelar
                </AlertDialogCancel>
                <Button
                    type="button"
                    size="lg"
                    variant="destructive"
                    className="ms-auto max-sm:flex-1"
                    onClick={onNext}
                >
                    Entendi, continuar
                </Button>
            </>
        );
    }

    return (
        <>
            <StepBackButton onClick={onBack} />
            <AlertDialogAction
                variant="destructive"
                size="lg"
                className="ms-auto max-sm:flex-1"
                disabled={isDeleting}
                aria-busy={isDeleting}
                onClick={(event) => {
                    // Stays open while it works, so a failure can be shown here.
                    event.preventDefault();
                    onDelete();
                }}
            >
                Excluir vídeo
            </AlertDialogAction>
        </>
    );
}

interface DeleteVideoStepsProps {
    video: VideoSummary;
    isDeleting: boolean;
    errorMessage: string | null;
    onDelete: () => void;
}

/** First what goes away, then the last word; the delete button only exists on the second step. */
function DeleteVideoSteps(props: DeleteVideoStepsProps): ReactNode {
    const { video, isDeleting, errorMessage, onDelete } = props;
    const steps = useSteps(STEPS);
    const step = steps.current;
    const isConfirmStep = steps.index === CONFIRM_INDEX;

    return (
        <StepDialogFrame
            kind="alert"
            rail={
                <StepRail
                    title="Excluir vídeo"
                    icon={TrashIcon}
                    tone="danger"
                    steps={STEPS}
                    currentIndex={steps.index}
                    reachableIndex={steps.reachableIndex}
                    onStepSelect={steps.goTo}
                />
            }
            progress={{ current: steps.index + 1, total: STEPS.length }}
            title={step.heading}
            description={step.description}
            footer={
                <DeleteFooter
                    isConfirmStep={isConfirmStep}
                    isDeleting={isDeleting}
                    onNext={steps.goNext}
                    onBack={steps.goBack}
                    onDelete={onDelete}
                />
            }
        >
            {isConfirmStep === false && <LossList items={describeLosses(video)} />}
            {isConfirmStep === true && (
                <p className="rounded-xl bg-card px-4 py-3 text-sm font-semibold break-words">
                    {video.title}
                </p>
            )}
            <FormAlert message={errorMessage} />
        </StepDialogFrame>
    );
}

interface DeleteVideoDialogProps {
    video: VideoSummary;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

/** Deleting is permanent, so it always asks first and names the video. */
export function DeleteVideoDialog({ video, isOpen, onOpenChange }: DeleteVideoDialogProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // A ref, not mutation state: the dialog closes inside onSuccess, before isSuccess turns true.
    const hasDeletedRef = useRef(false);
    const deletion = useMutation({
        mutationFn: () => deleteVideo({ data: { videoId: video.id } }),
        onSuccess: async () => {
            hasDeletedRef.current = true;
            onOpenChange(false);
            // Leave the page first, so no mounted screen fetches the video again; then drop its
            // cached page, or Back would show the deleted video.
            await navigate({ to: "/videos" });
            queryClient.removeQueries({
                queryKey: videoDetailsQueryOptions(video.id).queryKey,
                exact: true,
            });
            await invalidateVideoQueries(queryClient);
        },
    });
    let errorMessage: string | null = null;

    if (deletion.isError === true) {
        errorMessage = toErrorMessage(deletion.error, FALLBACK_ERROR_MESSAGE);
    }

    // A failure belongs to the attempt the person just closed; reopening starts clean.
    const changeOpen = (nextIsOpen: boolean): void => {
        if (nextIsOpen === false && deletion.isPending === false) {
            deletion.reset();
        }

        onOpenChange(nextIsOpen);
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={changeOpen}>
            <AlertDialogContent
                className={cn(STEP_DIALOG_CONTENT_CLASS, STEP_ALERT_WIDE_CLASS)}
                onCloseAutoFocus={(event) => {
                    if (hasDeletedRef.current === true) {
                        focusMainContent(event);
                    }
                }}
            >
                <DeleteVideoSteps
                    video={video}
                    isDeleting={deletion.isPending}
                    errorMessage={errorMessage}
                    onDelete={() => deletion.mutate()}
                />
            </AlertDialogContent>
        </AlertDialog>
    );
}
