import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { invalidateEditSessionQueries } from "#/modules/viral-formats/model/edit-session-queries";
import { addVideoToMyEditSession } from "#/modules/viral-formats/server/edit-session-functions";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

/** Sends one raw video for a format edit and resolves with the new video's id. */
export type UploadFormatVideo = (
    file: File,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
) => Promise<string>;

export interface PendingUpload {
    key: string;
    name: string;
    percent: number;
    errorMessage: string | null;
}

const FALLBACK_ERROR_MESSAGE = "Não foi possível enviar este vídeo. Tente de novo.";

function mergeWhenKey(
    item: PendingUpload,
    key: string,
    change: Partial<PendingUpload>,
): PendingUpload {
    if (item.key !== key) {
        return item;
    }

    return { ...item, ...change };
}

interface BatchUploadOptions {
    sessionId: string;
    uploadVideo: UploadFormatVideo;
}

/**
 * Sends the chosen files one after the other, so a batch of twenty does not split the connection
 * twenty ways, and puts each video in the batch as soon as it arrives. Leaving the page stops the
 * transfer under way.
 */
export function useBatchUpload({ sessionId, uploadVideo }: BatchUploadOptions): {
    pending: Array<PendingUpload>;
    addFiles: (files: ReadonlyArray<File>) => void;
    dismiss: (key: string) => void;
} {
    const queryClient = useQueryClient();
    const track = useTrackPromise();
    const [pending, setPending] = useState<Array<PendingUpload>>([]);
    const controllerRef = useRef(new AbortController());

    // A fresh controller per mount: React mounts twice in development, and an aborted one would
    // stop every later upload.
    useEffect(() => {
        const controller = new AbortController();
        controllerRef.current = controller;
        return () => controller.abort();
    }, []);

    function update(key: string, change: Partial<PendingUpload>): void {
        setPending((items) => items.map((item) => mergeWhenKey(item, key, change)));
    }

    async function sendOne(key: string, file: File): Promise<void> {
        const signal = controllerRef.current.signal;

        try {
            const videoId = await uploadVideo(file, (percent) => update(key, { percent }), signal);
            await addVideoToMyEditSession({ data: { sessionId, videoId } });
            setPending((items) => items.filter((item) => item.key !== key));
            await invalidateEditSessionQueries(queryClient);
        } catch (error) {
            update(key, { errorMessage: toErrorMessage(error, FALLBACK_ERROR_MESSAGE) });
        }
    }

    async function sendAll(entries: ReadonlyArray<{ key: string; file: File }>): Promise<void> {
        for (const entry of entries) {
            await sendOne(entry.key, entry.file);
        }
    }

    function addFiles(files: ReadonlyArray<File>): void {
        const entries = files.map((file) => ({ key: crypto.randomUUID(), file }));
        setPending((items) => [
            ...items,
            ...entries.map(({ key, file }) => ({
                key,
                name: file.name,
                percent: 0,
                errorMessage: null,
            })),
        ]);
        track(sendAll(entries));
    }

    function dismiss(key: string): void {
        setPending((items) => items.filter((item) => item.key !== key));
    }

    return { pending, addFiles, dismiss };
}
