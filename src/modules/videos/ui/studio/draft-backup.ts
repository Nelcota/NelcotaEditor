import { z } from "zod";
import { studioDraftSchema } from "#/modules/clips/clip-studio.schema";

const STORAGE_KEY_PREFIX = "nelcota:studio-draft:";

const backupSchema = z.object({
    /** The server version the edits were made on top of. */
    baseVersion: z.number().int().min(0),
    draft: studioDraftSchema,
});

export type DraftBackup = z.infer<typeof backupSchema>;

function storageKey(clipId: string): string {
    return `${STORAGE_KEY_PREFIX}${clipId}`;
}

/**
 * Edits made offline (or before the session expired) wait here until the server takes them.
 * Storage can be blocked or edited by hand, so what comes back is checked before it is used.
 */
export function readDraftBackup(clipId: string): DraftBackup | null {
    try {
        const stored = window.localStorage.getItem(storageKey(clipId));

        if (stored === null) {
            return null;
        }

        const result = backupSchema.safeParse(JSON.parse(stored));

        if (result.success === false) {
            return null;
        }

        return result.data;
    } catch (error) {
        console.warn("Could not read the Studio backup", error);
        return null;
    }
}

export function writeDraftBackup(clipId: string, backup: DraftBackup): void {
    try {
        window.localStorage.setItem(storageKey(clipId), JSON.stringify(backup));
    } catch (error) {
        console.warn("Could not keep the Studio backup", error);
    }
}

export function clearDraftBackup(clipId: string): void {
    try {
        window.localStorage.removeItem(storageKey(clipId));
    } catch (error) {
        console.warn("Could not clear the Studio backup", error);
    }
}
