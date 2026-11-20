export interface MediaState {
    isPlaying: boolean;
    /** Playing was asked for, but the browser is still fetching enough to continue. */
    isWaiting: boolean;
    currentSeconds: number;
    durationSeconds: number;
    bufferedSeconds: number;
    volume: number;
    isMuted: boolean;
    playbackRate: number;
}

export const INITIAL_MEDIA_STATE: MediaState = {
    isPlaying: false,
    isWaiting: false,
    currentSeconds: 0,
    durationSeconds: 0,
    bufferedSeconds: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
};

/** The end of the buffered stretch the playhead is in; the playhead itself when none is. */
function readBufferedEnd(video: HTMLVideoElement): number {
    const ranges = video.buffered;
    const currentSeconds = video.currentTime;

    for (let index = 0; index < ranges.length; index += 1) {
        if (ranges.start(index) <= currentSeconds && currentSeconds <= ranges.end(index)) {
            return ranges.end(index);
        }
    }

    return currentSeconds;
}

/** A duration is NaN before the metadata arrives and Infinity for live streams; both read as 0. */
function readDuration(video: HTMLVideoElement): number {
    const durationSeconds = video.duration;

    if (Number.isFinite(durationSeconds) === false) {
        return 0;
    }

    return durationSeconds;
}

export function readMediaState(video: HTMLVideoElement, isWaiting: boolean): MediaState {
    return {
        isPlaying: video.paused === false,
        isWaiting,
        currentSeconds: video.currentTime,
        durationSeconds: readDuration(video),
        bufferedSeconds: readBufferedEnd(video),
        volume: video.volume,
        isMuted: video.muted,
        playbackRate: video.playbackRate,
    };
}

/** What the volume slider shows: muted reads as silent whatever the level underneath. */
export function toAudibleVolume(media: MediaState): number {
    if (media.isMuted === true) {
        return 0;
    }

    return media.volume;
}
