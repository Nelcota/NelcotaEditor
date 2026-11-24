const MILLISECONDS_PER_SECOND = 1000;

interface FirstRunTimes {
    createdAt: Date;
    firstFinishedAt: Date | null;
}

/**
 * Seconds from the upload to the first time the video was done, dated on that day; null when it
 * never got there. Later retries and Studio renders do not move it, so a 40 s re-render never
 * replaces the first 12 minutes.
 */
export function measureFirstRun(video: FirstRunTimes): { date: Date; value: number } | null {
    const firstFinishedAt = video.firstFinishedAt;

    if (firstFinishedAt === null) {
        return null;
    }

    const elapsed = firstFinishedAt.getTime() - video.createdAt.getTime();

    return { date: firstFinishedAt, value: elapsed / MILLISECONDS_PER_SECOND };
}
