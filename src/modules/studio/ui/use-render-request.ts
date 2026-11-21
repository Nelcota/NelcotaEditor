import { useState } from "react";
import type { StudioEditor } from "#/modules/studio/ui/use-studio-editor";

export interface RenderRequest {
    /** Renders now, or first asks when the clip is shared (its link would show the new file). */
    request: () => void;
    send: () => Promise<void>;
    isConfirmingShare: boolean;
    setIsConfirmingShare: (isOpen: boolean) => void;
    /** The last render met a newer version saved elsewhere. */
    hasConflict: boolean;
    clearConflict: () => void;
}

/** Sending the draft to Brasa, with the share confirmation and the conflict it can run into. */
export function useRenderRequest(editor: StudioEditor, sharePath: string | null): RenderRequest {
    const [isConfirmingShare, setIsConfirmingShare] = useState(false);
    const [hasConflict, setHasConflict] = useState(false);

    const send = async (): Promise<void> => {
        const outcome = await editor.render();

        if (outcome === "conflict") {
            setHasConflict(true);
        }
    };

    const request = (): void => {
        if (sharePath !== null) {
            setIsConfirmingShare(true);
            return;
        }

        void send();
    };

    return {
        request,
        send,
        isConfirmingShare,
        setIsConfirmingShare,
        hasConflict,
        clearConflict: () => setHasConflict(false),
    };
}
