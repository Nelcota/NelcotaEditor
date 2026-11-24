import LinkIcon from "~icons/lucide/link";
import { useState } from "react";
import { SourceProblem } from "#/modules/videos/ui/components/source-problem";
import { describeYoutubeLinkProblem } from "#/modules/videos/model/youtube-url";
import { focusWhenShown } from "#/shared/ui/focus-when-shown";

export const YOUTUBE_LINK_INPUT_ID = "new-video-link";
const LINK_PROBLEM_ID = "new-video-link-problem";
const MISSING_SOURCE_MESSAGE = "Cole o link do vídeo ou escolha um arquivo.";

interface YoutubeLinkInputProps {
    value: string;
    disabled: boolean;
    isSubmitAttempted: boolean;
    onValueChange: (text: string) => void;
}

function describeProblem(value: string, isSubmitAttempted: boolean): string | null {
    if (value.trim().length === 0 && isSubmitAttempted === true) {
        return MISSING_SOURCE_MESSAGE;
    }

    return describeYoutubeLinkProblem(value);
}

export function YoutubeLinkInput({
    value,
    disabled,
    isSubmitAttempted,
    onValueChange,
}: YoutubeLinkInputProps) {
    // Judged only once the person is done with the text (left the field, pasted it or tried to
    // send), so the field does not turn red and speak up on every keystroke.
    const [isTouched, setIsTouched] = useState(false);
    const problem = describeProblem(value, isSubmitAttempted);
    let visibleProblem: string | null = null;

    if (isTouched === true || isSubmitAttempted === true) {
        visibleProblem = problem;
    }

    return (
        <div className="grid gap-2">
            <label htmlFor={YOUTUBE_LINK_INPUT_ID} className="sr-only">
                Link do YouTube
            </label>
            <div className="flex h-12 items-center gap-2.5 rounded-xl border border-input bg-background px-3.5 focus-within:border-ring focus-within:ring-4 focus-within:ring-ring has-[[aria-invalid=true]]:border-destructive">
                <LinkIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                    id={YOUTUBE_LINK_INPUT_ID}
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    autoCapitalize="none"
                    enterKeyHint="go"
                    // The person opened this dialog to paste; the field is ready for it.
                    ref={focusWhenShown}
                    placeholder="Cole o link do YouTube"
                    value={value}
                    disabled={disabled}
                    aria-invalid={visibleProblem !== null}
                    aria-describedby={LINK_PROBLEM_ID}
                    onBlur={() => setIsTouched(true)}
                    onPaste={() => setIsTouched(true)}
                    onChange={(event) => onValueChange(event.target.value)}
                    className="w-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
            </div>
            <SourceProblem id={LINK_PROBLEM_ID} message={visibleProblem} />
        </div>
    );
}
