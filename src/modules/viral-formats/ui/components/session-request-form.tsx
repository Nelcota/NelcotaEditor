import ArrowRightIcon from "~icons/lucide/arrow-right";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { z } from "zod";
import {
    EDIT_SESSION_REQUEST_LABEL,
    MAX_SESSION_NOTE_LENGTH,
    MAX_SESSION_NOTES,
    sessionAdjustmentSchema,
} from "#/modules/viral-formats/model/edit-session";
import type { EditSessionView } from "#/modules/viral-formats/model/edit-session";
import { invalidateEditSessionQueries } from "#/modules/viral-formats/model/edit-session-queries";
import { queueMyEditSession } from "#/modules/viral-formats/server/edit-session-functions";
import { SessionAdjustments } from "#/modules/viral-formats/ui/components/session-adjustments";
import { Button } from "#/shared/ui/button";
import { ClaudeLogo } from "#/shared/ui/claude-logo";
import { cn } from "#/shared/ui/cn";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextAreaField } from "#/shared/ui/text-area-field";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { useUnsavedChangesGuard } from "#/shared/ui/use-unsaved-changes-guard";

const FORM_SCHEMA = z.object({ adjustment: sessionAdjustmentSchema });
const FIELD_NAMES = ["adjustment"] as const;
const FALLBACK_ERROR_MESSAGE = "Não foi possível preparar o pedido. Tente de novo.";
const UPLOADS_RUNNING_MESSAGE = "Aguarde o envio dos vídeos.";

function describeReadiness(videoCount: number, uploadsRunning: number): string {
    if (uploadsRunning > 0) {
        return UPLOADS_RUNNING_MESSAGE;
    }

    if (videoCount === 0) {
        return "Adicione pelo menos um vídeo para preparar o pedido.";
    }

    return "Depois, copie o pedido e envie no Claude.";
}

export function SessionRequestForm({
    session,
    uploadsRunning,
}: {
    session: EditSessionView;
    uploadsRunning: number;
}): ReactNode {
    const queryClient = useQueryClient();
    const track = useTrackPromise();
    const videoCount = session.videos.length;
    const canStart = videoCount > 0 && uploadsRunning === 0;
    const hasRoomForAdjustment = session.notes.length < MAX_SESSION_NOTES;
    const start = useMutation({
        mutationFn: async (adjustment: string) =>
            await queueMyEditSession({ data: { sessionId: session.id, adjustment } }),
        onSuccess: () => invalidateEditSessionQueries(queryClient),
    });
    const form = useForm({
        defaultValues: { adjustment: "" },
        validators: { onSubmit: FORM_SCHEMA },
        onSubmitInvalid: ({ formApi }) => focusFirstInvalidField(FIELD_NAMES, formApi),
        onSubmit: ({ value }): void => start.mutate(value.adjustment),
    });
    useUnsavedChangesGuard(useStore(form.store, (state) => state.isDirty));

    return (
        <form
            noValidate
            className="grid gap-5"
            onSubmit={(event) => {
                event.preventDefault();

                if (canStart && start.isPending === false) {
                    track(form.handleSubmit());
                }
            }}
        >
            <h2
                id="session-actions"
                className="flex items-center gap-2.5 text-lg leading-tight font-bold"
            >
                <ClaudeLogo className="size-5 shrink-0" />
                Editar com Claude
            </h2>
            {hasRoomForAdjustment && (
                <form.Field name="adjustment">
                    {(field) => (
                        <TextAreaField
                            id="adjustment"
                            label="Ajuste para o lote (opcional)"
                            placeholder="Ex.: mantenha as legendas em amarelo."
                            className="min-h-28 bg-background"
                            maxLength={MAX_SESSION_NOTE_LENGTH}
                            readOnly={start.isPending}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onValueChange={field.handleChange}
                            errors={toErrorMessages(field.state.meta.errors)}
                        />
                    )}
                </form.Field>
            )}
            <SessionAdjustments notes={session.notes} />
            {start.isError && (
                <FormAlert message={toErrorMessage(start.error, FALLBACK_ERROR_MESSAGE)} />
            )}
            <div className="grid gap-2">
                <Button
                    type="submit"
                    size="lg"
                    className={cn(
                        "h-auto min-h-11 py-2 text-center leading-snug font-bold whitespace-normal",
                        canStart === false &&
                            "disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100",
                    )}
                    aria-describedby="session-start-hint"
                    disabled={canStart === false}
                    isLoading={start.isPending}
                    loadingLabel="Preparando pedido…"
                >
                    {EDIT_SESSION_REQUEST_LABEL}
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Button>
                <p
                    id="session-start-hint"
                    role="status"
                    className="text-xs text-pretty text-muted-foreground"
                >
                    {describeReadiness(videoCount, uploadsRunning)}
                </p>
            </div>
        </form>
    );
}
