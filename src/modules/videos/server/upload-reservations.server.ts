interface PendingUploads {
    count: number;
    bytes: number;
}

const NO_PENDING_UPLOADS: PendingUploads = { count: 0, bytes: 0 };

/**
 * Uploads that passed the limits and are still writing their file. They have no video row yet, so
 * without this the checks of a parallel upload would not see them.
 */
export class UploadReservations {
    private readonly pendingByUser = new Map<string, PendingUploads>();

    summarize(userId: string): PendingUploads {
        return this.pendingByUser.get(userId) ?? NO_PENDING_UPLOADS;
    }

    /** Returns the release; calling it again does nothing, so it is safe in a finally. */
    reserve(userId: string, bytes: number): () => void {
        if (userId.trim().length === 0) {
            throw new RangeError("Cannot reserve upload space for a user without an id");
        }

        if (Number.isSafeInteger(bytes) === false || bytes < 0) {
            throw new RangeError(`Invalid upload byte count: ${String(bytes)}`);
        }

        const pending = this.summarize(userId);
        this.pendingByUser.set(userId, { count: pending.count + 1, bytes: pending.bytes + bytes });
        let isReleased = false;

        return () => {
            if (isReleased === true) {
                return;
            }

            isReleased = true;
            this.release(userId, bytes);
        };
    }

    private release(userId: string, bytes: number): void {
        const pending = this.summarize(userId);

        if (pending.count <= 1) {
            this.pendingByUser.delete(userId);
            return;
        }

        this.pendingByUser.set(userId, { count: pending.count - 1, bytes: pending.bytes - bytes });
    }
}

/** Lives in this process: it holds while the site runs as a single process, as it does today. */
export const uploadReservations = new UploadReservations();
