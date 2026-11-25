import type { StudioDraft } from "#/modules/clips/model/clip-studio";
import { countDraftChanges } from "#/modules/studio/model/draft-changes";

interface ServerDraft {
    /** The saved draft, or the applied one when nothing is saved. */
    savedDraft: StudioDraft;
    draftVersion: number;
}

interface BackupDraft {
    baseVersion: number;
    draft: StudioDraft;
}

export interface StartingDraft {
    draft: StudioDraft;
    /** The server version the draft was made on; saving it on an older one raises the conflict. */
    version: number;
}

/**
 * The newest edits win. A backup made on an older version (the person left during a conflict, or
 * the page closed before its save) is kept on that version, so its first save meets the conflict
 * and the person picks between their edits and the other tab's instead of losing either.
 */
export function pickStartingDraft(server: ServerDraft, backup: BackupDraft | null): StartingDraft {
    const serverStart = { draft: server.savedDraft, version: server.draftVersion };

    if (backup === null || countDraftChanges(backup.draft, server.savedDraft) === 0) {
        return serverStart;
    }

    return { draft: backup.draft, version: backup.baseVersion };
}
