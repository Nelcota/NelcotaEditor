import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateVideoTitle } from "#/modules/videos/server/video-edit-functions";
import { renameVideoFormSchema } from "#/modules/videos/video-title";
import type { VideoSummary } from "#/modules/videos/video-views";
import { toErrorMessage } from "#/modules/videos/ui/to-error-message";
import { invalidateVideoQueries } from "#/modules/videos/ui/video-queries";
import { Button } from "#/shared/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "#/shared/ui/dialog";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextField } from "#/shared/ui/text-field";

const FALLBACK_ERROR_MESSAGE =
    "Não foi possível renomear o vídeo. Confira sua conexão e tente de novo.";

const TITLE_FIELD_ID = "video-title";

/** The field id is known up front; aria-invalid only reaches the DOM a render later. */
function focusTitleField(): void {
    const titleField = document.getElementById(TITLE_FIELD_ID);

    if (titleField === null) {
        return;
    }

    titleField.focus();
}

interface RenameVideoFormProps {
    video: VideoSummary;
    onDone: () => void;
}

function RenameVideoForm({ video, onDone }: RenameVideoFormProps) {
    const queryClient = useQueryClient();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { title: video.title },
        validators: { onSubmit: renameVideoFormSchema },
        onSubmit: async ({ value }) => {
            setErrorMessage(null);

            try {
                await updateVideoTitle({ data: { videoId: video.id, title: value.title } });
            } catch (error) {
                setErrorMessage(toErrorMessage(error, FALLBACK_ERROR_MESSAGE));
                return;
            }

            await invalidateVideoQueries(queryClient);
            onDone();
        },
        onSubmitInvalid: () => {
            focusTitleField();
        },
    });

    return (
        <form
            noValidate
            className="grid gap-4"
            onSubmit={async (event) => {
                event.preventDefault();
                await form.handleSubmit();
            }}
        >
            <form.Field name="title">
                {(field) => (
                    <TextField
                        id={TITLE_FIELD_ID}
                        label="Título"
                        autoComplete="off"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={field.handleChange}
                        errors={toErrorMessages(field.state.meta.errors)}
                    />
                )}
            </form.Field>
            <FormAlert message={errorMessage} />
            <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                    <Button
                        type="submit"
                        size="lg"
                        className="justify-self-end font-semibold"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                    >
                        Salvar título
                    </Button>
                )}
            </form.Subscribe>
        </form>
    );
}

interface RenameVideoDialogProps {
    video: VideoSummary;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

/** The title only names the video here; the clips keep the titles Brilho wrote. */
export function RenameVideoDialog({ video, isOpen, onOpenChange }: RenameVideoDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Renomear vídeo</DialogTitle>
                    <DialogDescription>
                        O título aparece na lista e na busca. Os títulos dos cortes não mudam.
                    </DialogDescription>
                </DialogHeader>
                <RenameVideoForm video={video} onDone={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
