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
import { NewVideoPreview } from "#/modules/videos/ui/new-video-preview";
import { ClipsStepFields, VideoStepFields } from "#/modules/videos/ui/new-video-step-fields";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { UploadProgress } from "#/modules/videos/ui/upload-progress";
import { useIsLinkBlocked } from "#/modules/videos/ui/use-is-link-blocked";
import { useVideoSubmission } from "#/modules/videos/ui/use-video-submission";
import { YOUTUBE_LINK_INPUT_ID } from "#/modules/videos/ui/youtube-link-input";
import { EMPTY_SOURCE, hasUsableSource } from "#/modules/videos/ui/video-source";
import type { VideoSource } from "#/modules/videos/ui/video-source";
import { Button } from "#/shared/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "#/shared/ui/dialog";
import { FormAlert } from "#/shared/ui/form-alert";

const FALLBACK_ERROR_MESSAGE = "Não foi possível adicionar o vídeo. Tente de novo.";

interface NewVideoWizardProps {
    defaultClipCount: number;
    defaultClipLength: ClipLength;
    defaultLanguage: TranscriptionLanguage;
}

/**
 * The new video dialog on a single screen: the video first, then the clip count and the spoken
 * language, both already filled from the account's preferences. One button sends it, and the
 * preview fills in as you go. Opens the new video when it is created.
 */
export function NewVideoWizard({
    defaultClipCount,
    defaultClipLength,
    defaultLanguage,
}: NewVideoWizardProps): ReactNode {
    const [source, setSource] = useState<VideoSource>(EMPTY_SOURCE);
    const [clipCount, setClipCount] = useState(defaultClipCount);
    const [clipLength, setClipLength] = useState<ClipLength>(defaultClipLength);
    const [title, setTitle] = useState("");
    const [language, setLanguage] = useState<TranscriptionLanguage>(defaultLanguage);
    const languageLabel = TRANSCRIPTION_LANGUAGE_LABELS[language];
    const isLinkBlocked = useIsLinkBlocked(source);
    const { submission, uploadPercent } = useVideoSubmission();
    const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);
    const isBusy = submission.isPending;

    const changeSource = (nextSource: VideoSource): void => {
        setIsSubmitAttempted(false);
        setSource(nextSource);
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (isLinkBlocked === true || isBusy === true) {
            return;
        }

        if (hasUsableSource(source) === false) {
            // Rendered first, so the problem the field points at exists when focus lands there.
            flushSync(() => setIsSubmitAttempted(true));
            document.getElementById(YOUTUBE_LINK_INPUT_ID)?.focus();
            return;
        }

        submission.mutate({ source, clipCount, clipLength, title, language });
    };

    return (
        <form
            noValidate
            onSubmit={submit}
            className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]"
        >
            <DialogHeader className="border-b py-4 pr-16 pl-5 sm:py-5 sm:pr-16 sm:pl-7">
                <DialogTitle>Novo vídeo</DialogTitle>
                <DialogDescription>
                    Cole o link ou envie o arquivo. O resto já vem preenchido; mude só se quiser.
                </DialogDescription>
            </DialogHeader>
            <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <section className="grid min-h-0 grid-cols-[minmax(0,1fr)] content-start gap-8 overflow-y-auto p-5 sm:p-7 [@media(max-height:560px)]:overflow-visible">
                    <VideoStepFields
                        source={source}
                        title={title}
                        isSubmitAttempted={isSubmitAttempted}
                        onTitleChange={setTitle}
                        onSourceChange={changeSource}
                    />
                    <ClipsStepFields
                        clipCount={clipCount}
                        clipLength={clipLength}
                        onClipCountChange={setClipCount}
                        onClipLengthChange={setClipLength}
                    />
                    <LanguageStepFields language={language} onLanguageChange={setLanguage} />
                    <UploadProgress percent={uploadPercent} />
                    {submission.isError === true && (
                        <FormAlert
                            message={toErrorMessage(submission.error, FALLBACK_ERROR_MESSAGE)}
                        />
                    )}
                </section>
                <NewVideoPreview
                    source={source}
                    title={title}
                    clipCount={clipCount}
                    clipLengthLabel={CLIP_LENGTH_LABELS[clipLength]}
                    languageLabel={languageLabel}
                />
            </div>
            <footer className="flex items-center justify-end gap-3 border-t px-5 py-4 sm:px-7">
                <Button
                    type="submit"
                    size="lg"
                    className="font-semibold max-sm:flex-1 sm:min-w-40"
                    disabled={isBusy === true || isLinkBlocked === true}
                    aria-busy={isBusy}
                >
                    Gerar cortes
                </Button>
            </footer>
        </form>
    );
}
