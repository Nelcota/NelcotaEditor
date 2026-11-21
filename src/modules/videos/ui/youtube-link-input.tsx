import LinkIcon from "~icons/solar/link-linear";
import { SourceProblem } from "#/modules/videos/ui/source-problem";
import { describeYoutubeLinkProblem } from "#/modules/videos/youtube-url";

interface YoutubeLinkInputProps {
    value: string;
    disabled: boolean;
    onValueChange: (text: string) => void;
}

export function YoutubeLinkInput({ value, disabled, onValueChange }: YoutubeLinkInputProps) {
    const linkProblem = describeYoutubeLinkProblem(value);

    return (
        <div className="grid gap-2">
            <label htmlFor="new-video-link" className="sr-only">
                Link do YouTube
            </label>
            <div className="flex h-12 items-center gap-2.5 rounded-xl border border-input bg-background px-3.5 focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/70 has-[[aria-invalid=true]]:border-destructive">
                <LinkIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                    id="new-video-link"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    autoCapitalize="none"
                    enterKeyHint="go"
                    // The person opened this dialog to paste; the field is ready for it.
                    autoFocus
                    placeholder="Cole o link do YouTube"
                    value={value}
                    disabled={disabled}
                    aria-invalid={linkProblem !== null}
                    onChange={(event) => onValueChange(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
            </div>
            <SourceProblem message={linkProblem} />
        </div>
    );
}
