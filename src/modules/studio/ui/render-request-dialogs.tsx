import type { ReactNode } from "react";
import { ConflictDialog, SharedRenderDialog } from "#/modules/studio/ui/studio-dialogs";
import type { RenderRequest } from "#/modules/studio/ui/use-render-request";
import type { StudioEditor } from "#/modules/studio/ui/use-studio-editor";

interface RenderRequestDialogsProps {
    editor: StudioEditor;
    renderRequest: RenderRequest;
}

/** The choices a render or an autosave can need: whose version wins, and re-rendering a shared clip. */
export function RenderRequestDialogs({
    editor,
    renderRequest,
}: RenderRequestDialogsProps): ReactNode {
    return (
        <>
            <ConflictDialog
                isOpen={renderRequest.hasConflict === true || editor.autosave.status === "conflict"}
                onTakeTheirs={async () => {
                    renderRequest.clearConflict();
                    await editor.takeTheirs();
                }}
                onKeepMine={async () => {
                    renderRequest.clearConflict();
                    await editor.keepMine();
                }}
            />
            <SharedRenderDialog
                isOpen={renderRequest.isConfirmingShare}
                onOpenChange={renderRequest.setIsConfirmingShare}
                onConfirm={renderRequest.send}
            />
        </>
    );
}
