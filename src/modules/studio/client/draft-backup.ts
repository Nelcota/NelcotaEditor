import { z } from "zod";
import { studioDraftSchema } from "#/modules/clips/model/clip-studio";

const STORAGE_KEY_PREFIX = "nelcota:studio-draft:";
// A backup this old is of a clip long since saved, deleted or abandoned; without pruning they
// pile up until the browser's ~5 MB quota is full and new backups silently stop being kept.
const BACKUP_MAX_AGE_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;

const backupSchema = z.object({
    /** The server version the edits were made on top of. */
    baseVersion: z.number().int().min(0),
    draft: studioDraftSchema,
    /** When it was written (epoch ms); absent in backups from before pruning existed. */
    savedAt: z.number().int().min(0).optional(),
});

export type DraftBackup = z.infer<typeof backupSchema>;

const savedAtSchema = z.object({ savedAt: z.number().int().min(0) });

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

function parseStored(stored: string): unknown {
    try {
        return JSON.parse(stored);
    } catch {
        // Not JSON: a corrupted entry that no read could ever use.
        return null;
    }
}

/** Old enough to drop; a corrupted entry counts as expired, one without a date does not. */
function isExpiredBackup(stored: string, now: number): boolean {
    const parsed = parseStored(stored);

    if (parsed === null) {
        return true;
    }

    const result = savedAtSchema.safeParse(parsed);

    if (result.success === false) {
        return false;
    }

    return now - result.data.savedAt > BACKUP_MAX_AGE_MILLISECONDS;
}

/** Removes Studio backups older than the age limit; ones without a date are left alone. */
function pruneExpiredBackups(now: number): void {
    const storage = window.localStorage;
    const backupKeys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
        .filter((key) => key !== null)
        .filter((key) => key.startsWith(STORAGE_KEY_PREFIX));

    for (const key of backupKeys) {
        const stored = storage.getItem(key);

        if (stored !== null && isExpiredBackup(stored, now) === true) {
            storage.removeItem(key);
        }
    }
}

export function writeDraftBackup(clipId: string, backup: DraftBackup): void {
    try {
        const now = Date.now();
        pruneExpiredBackups(now);
        window.localStorage.setItem(
            storageKey(clipId),
            JSON.stringify({ ...backup, savedAt: now }),
        );
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
