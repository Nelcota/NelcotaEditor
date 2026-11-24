/** A whole video played and sought by its owner fits well inside an hour. */
export const OWNER_LINK_LIFETIME_SECONDS = 60 * 60;

export interface ServedFile {
    key: string;
    /** Content-Type, Content-Disposition and caching for the file itself. */
    headers: Headers;
    /**
     * How long a signed link to a remote file stays valid. Long enough to play and seek a whole
     * video; turning sharing off takes this long to cut a link already handed out.
     */
    linkLifetimeSeconds: number;
}

/**
 * Where stored files live. Keys are storage-relative paths with forward slashes
 * ("videos/<id>/source.mp4"), the same values the database keeps, so the app and the worker agree
 * whatever the adapter.
 */
export interface FileStorage {
    /** Copies a finished local file in and returns its size; the caller keeps the local file. */
    storeLocalFile: (key: string, localPath: string) => Promise<number>;
    /** Writes the stream as the file and returns its size; a failed stream leaves nothing behind. */
    storeStream: (key: string, stream: ReadableStream<Uint8Array>) => Promise<number>;
    /**
     * A local path ffmpeg can read the file from. A store that is not on this disk downloads it
     * into `workDirectory`, which the caller removes when done.
     */
    getLocalFile: (key: string, workDirectory: string) => Promise<string>;
    /** The file's size; 0 when it is gone, which is the space it takes. */
    measureFile: (key: string) => Promise<number>;
    deleteFile: (key: string) => Promise<void>;
    /** Deletes every file whose key starts with `prefix` (a folder such as "videos/<id>"). */
    deleteFolder: (prefix: string) => Promise<void>;
    /**
     * Serves the file to a reader the caller already authorized: the disk streams it (ranges for
     * seeking, 404 when gone), a remote store redirects to a short-lived signed link.
     */
    respondWithFile: (request: Request, file: ServedFile) => Promise<Response>;
}
