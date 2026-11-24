/** Where the original video's captions are served (see serve-video-captions.server.ts). */
export function toCaptionsUrl(videoId: string): string {
    if (videoId.trim().length === 0) {
        throw new RangeError("A captions URL needs a video id.");
    }

    return `/api/videos/${encodeURIComponent(videoId)}/captions`;
}
