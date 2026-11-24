import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_PREFERENCES } from "#/modules/preferences/model/preferences";
import { preferencesQueryOptions } from "#/modules/preferences/ui/hooks/preferences-queries";
import { NewVideoWizard } from "#/modules/videos/ui/components/new-video-wizard";
import { cn } from "#/shared/ui/cn";
import { Dialog, DialogContent } from "#/shared/ui/dialog";
import { STEP_DIALOG_CONTENT_CLASS, STEP_DIALOG_WIDE_CLASS } from "#/shared/ui/step-dialog-frame";

interface NewVideoDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

/** The element that had focus, if any; <body> means nothing did (a reload on ?newVideo=true). */
function findFocusedElement(): HTMLElement | null {
    const active = document.activeElement;

    if (active instanceof HTMLElement && active !== document.body) {
        return active;
    }

    return null;
}

/**
 * Opened from the URL, the dialog has no Radix trigger, so on close Radix would drop focus on
 * <body>. This goes back to whatever opened it, or to the page content when nothing did.
 */
function useReturnFocus(isOpen: boolean): (event: Event) => void {
    const [wasOpen, setWasOpen] = useState(isOpen);
    const [opener, setOpener] = useState<HTMLElement | null>(null);

    // Read while rendering the opening, since the wizard's autofocused field takes focus as soon
    // as it mounts. Adjusting state while rendering is React's documented pattern for this.
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);

        if (isOpen === true) {
            setOpener(findFocusedElement());
        }
    }

    return (event: Event) => {
        event.preventDefault();

        if (opener !== null && opener.isConnected === true) {
            opener.focus();
            return;
        }

        const main = document.getElementById("main");

        if (main === null) {
            return;
        }

        main.focus();
    };
}

/** The wizard opens the new video's page when it finishes, which also closes this dialog. */
export function NewVideoDialog({ isOpen, onOpenChange }: NewVideoDialogProps): ReactNode {
    const preferencesQuery = useQuery(preferencesQueryOptions());
    // The form starts from the saved preferences; until they load, the app defaults.
    const preferences = preferencesQuery.data ?? DEFAULT_PREFERENCES;
    const defaultClipCount = preferences.defaultClipCount;
    const defaultClipLength = preferences.defaultClipLength;
    const defaultLanguage = preferences.transcriptionLanguage;
    const returnFocus = useReturnFocus(isOpen);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {/* A fixed height, so the dialog never jumps from one step to the next. */}
            <DialogContent
                onCloseAutoFocus={returnFocus}
                className={cn(STEP_DIALOG_CONTENT_CLASS, STEP_DIALOG_WIDE_CLASS)}
            >
                <NewVideoWizard
                    key={`${defaultClipCount}-${defaultClipLength}-${defaultLanguage}`}
                    defaultClipCount={defaultClipCount}
                    defaultClipLength={defaultClipLength}
                    defaultLanguage={defaultLanguage}
                />
            </DialogContent>
        </Dialog>
    );
}
