import { useForm, useStore } from "@tanstack/react-form";
import ArrowRightIcon from "~icons/lucide/arrow-right";
import SquarePlusIcon from "~icons/lucide/square-plus";
import { useState } from "react";
import { flushSync } from "react-dom";
import type { FormEvent, ReactNode } from "react";
import {
    CLIP_LENGTH_LABELS,
    TRANSCRIPTION_LANGUAGE_LABELS,
} from "#/modules/preferences/preferences";
import type { TranscriptionLanguage } from "#/modules/preferences/preferences";
import type { ClipLength } from "#/modules/video-records/clip-length";
import { LanguageStepFields } from "#/modules/videos/ui/language-step-fields";
import { NewVideoReview } from "#/modules/videos/ui/new-video-review";
import { ClipsStepFields, VideoStepFields } from "#/modules/videos/ui/new-video-step-fields";
import { UploadProgress } from "#/modules/videos/ui/upload-progress";
import { useIsLinkBlocked } from "#/modules/videos/ui/use-is-link-blocked";
import { useVideoSubmission } from "#/modules/videos/ui/use-video-submission";
import type { Submission } from "#/modules/videos/ui/use-video-submission";
import { YOUTUBE_LINK_INPUT_ID } from "#/modules/videos/ui/youtube-link-input";
import { EMPTY_SOURCE, hasUsableSource } from "#/modules/videos/ui/video-source";
import type { VideoSource } from "#/modules/videos/ui/video-source";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { StepBackButton } from "#/shared/ui/step-back-button";
import { StepDialogFrame } from "#/shared/ui/step-dialog-frame";
import { StepRail } from "#/shared/ui/step-rail";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { useSteps } from "#/shared/ui/use-steps";

const FALLBACK_ERROR_MESSAGE = "Não foi possível adicionar o vídeo. Tente de novo.";

const STEPS = [
    {
        title: "Vídeo",
        hint: "Link ou arquivo",
        heading: "Qual vídeo vamos cortar?",
        description: "Cole o link do YouTube ou envie um arquivo do computador.",
    },
    {
        title: "Cortes",
        hint: "Quantos e de que tamanho",
        heading: "Como você quer os cortes?",
        description: "Já deixamos o que funciona melhor. Mude só se quiser.",
    },
    {
        title: "Idioma",
        hint: "Para a legenda",
        heading: "Em que idioma as pessoas falam?",
        description: "Escolher o idioma certo deixa a legenda mais precisa.",
    },
    {
        title: "Revisar",
        hint: "Conferir e gerar",
        heading: "Tudo certo?",
        description: "Confira e gere os cortes. A turma avisa quando ficarem prontos.",
    },
] as const;

const REVIEW_INDEX = STEPS.length - 1;

interface WizardFooterProps {
    isFirst: boolean;
    isReview: boolean;
    isBusy: boolean;
    onBack: () => void;
}

/** Voltar from the second step on; Continuar until the review, which sends with Gerar cortes. */
function WizardFooter({ isFirst, isReview, isBusy, onBack }: WizardFooterProps): ReactNode {
    let label: ReactNode = (
        <>
            Continuar
            <ArrowRightIcon aria-hidden="true" />
        </>
    );

    if (isReview === true) {
        label = "Gerar cortes";
    }

    return (
        <>
            {isFirst === false && <StepBackButton onClick={onBack} isDisabled={isBusy} />}
            <Button
                type="submit"
                size="lg"
                className="ms-auto font-medium max-sm:flex-1 sm:min-w-40"
                disabled={isBusy}
                aria-busy={isBusy}
            >
                {label}
            </Button>
        </>
    );
}

interface NewVideoWizardProps {
    defaultClipCount: number;
    defaultClipLength: ClipLength;
    defaultLanguage: TranscriptionLanguage;
}

/**
 * The new video dialog in four steps: the video, the clips, the spoken language, then a review that
 * sends it. Everything after the video starts from the account's preferences, so most people only
 * paste a link and press Continuar. Opens the new video when it is created.
 */
export function NewVideoWizard({
    defaultClipCount,
    defaultClipLength,
    defaultLanguage,
}: NewVideoWizardProps): ReactNode {
    const defaultValues: Submission = {
        source: EMPTY_SOURCE,
        clipCount: defaultClipCount,
        clipLength: defaultClipLength,
        title: "",
        language: defaultLanguage,
    };
    const { submission, uploadPercent } = useVideoSubmission();
    const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);
    const steps = useSteps(STEPS.length);
    const step = STEPS[steps.index];
    const isReview = steps.index === REVIEW_INDEX;
    const isBusy = submission.isPending;
    const form = useForm({
        defaultValues,
        onSubmit: ({ value }) => {
            if (isBusy === true || checkSource(value.source) === false) {
                return;
            }

            if (isReview === false) {
                steps.goNext();
                return;
            }

            submission.mutate(value);
        },
    });
    const values = useStore(form.store, (state) => state.values);
    const { source, clipCount, clipLength, title, language } = values;
    const isLinkBlocked = useIsLinkBlocked(source);

    const changeSource = (nextSource: VideoSource): void => {
        setIsSubmitAttempted(false);
        form.setFieldValue("source", nextSource);
    };

    /** False, with the video step open to show why, when there is nothing usable to send yet. */
    function checkSource(sourceToSend: VideoSource): boolean {
        if (isLinkBlocked === true) {
            steps.goTo(0);
            return false;
        }

        if (hasUsableSource(sourceToSend) === true) {
            return true;
        }

        // Rendered first, so the problem the field points at exists when focus lands there.
        flushSync(() => {
            setIsSubmitAttempted(true);
            steps.goTo(0);
        });
        document.getElementById(YOUTUBE_LINK_INPUT_ID)?.focus();
        return false;
    }

    const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        await form.handleSubmit();
    };

    const stepFields = [
        <VideoStepFields
            key="video"
            source={source}
            title={title}
            isSubmitAttempted={isSubmitAttempted}
            onTitleChange={(nextTitle) => form.setFieldValue("title", nextTitle)}
            onSourceChange={changeSource}
        />,
        <ClipsStepFields
            key="clips"
            clipCount={clipCount}
            clipLength={clipLength}
            onClipCountChange={(count) => form.setFieldValue("clipCount", count)}
            onClipLengthChange={(length) => form.setFieldValue("clipLength", length)}
        />,
        <LanguageStepFields
            key="language"
            language={language}
            onLanguageChange={(nextLanguage) => form.setFieldValue("language", nextLanguage)}
        />,
        <NewVideoReview
            key="review"
            source={source}
            title={title}
            clipCount={clipCount}
            clipLengthLabel={CLIP_LENGTH_LABELS[clipLength]}
            languageLabel={TRANSCRIPTION_LANGUAGE_LABELS[language]}
            onEditStep={steps.goTo}
        />,
    ];

    // While the video is being sent, changing an earlier step would be ignored and hide the upload.
    let reachableIndex = steps.reachableIndex;

    if (isBusy === true) {
        reachableIndex = steps.index;
    }

    return (
        <form noValidate onSubmit={submit} className="grid min-h-0">
            <StepDialogFrame
                kind="dialog"
                rail={
                    <StepRail
                        title="Novo vídeo"
                        icon={SquarePlusIcon}
                        tone="default"
                        steps={STEPS}
                        currentIndex={steps.index}
                        reachableIndex={reachableIndex}
                        onStepSelect={steps.goTo}
                    />
                }
                progress={{ current: steps.index + 1, total: STEPS.length }}
                title={step.heading}
                description={step.description}
                footer={
                    <WizardFooter
                        isFirst={steps.isFirst}
                        isReview={isReview}
                        isBusy={isBusy}
                        onBack={steps.goBack}
                    />
                }
            >
                {stepFields[steps.index]}
                {isReview === true && <UploadProgress percent={uploadPercent} />}
                {isReview === true && submission.isError === true && (
                    <FormAlert message={toErrorMessage(submission.error, FALLBACK_ERROR_MESSAGE)} />
                )}
            </StepDialogFrame>
        </form>
    );
}
