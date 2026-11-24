import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { TranscriptionLanguage } from "#/modules/preferences/model/preferences";
import type { ClipLength } from "#/modules/video-records/model/clip-length";
import { uploadVideoFile } from "#/modules/videos/client/upload-video-file";
import { createYoutubeVideo } from "#/modules/videos/server/video-functions";
import { NoSourceError } from "#/modules/videos/model/no-source-error";
import { toLinkVideoId } from "#/modules/videos/model/video-source";
import type { VideoSource } from "#/modules/videos/model/video-source";
import { invalidateVideoQueries } from "#/modules/videos/model/video-queries";

export interface Submission {
    source: VideoSource;
    clipCount: number;
    clipLength: ClipLength;
    title: string;
    language: TranscriptionLanguage;
}

interface SubmissionHandlers {
    onUploadProgress: (percent: number) => void;
    signal: AbortSignal;
}

/** Creates the video from a link, or uploads the file with progress; returns the new video's id. */
async function createVideo(
    { source, clipCount, clipLength, title, language }: Submission,
    { onUploadProgress, signal }: SubmissionHandlers,
): Promise<string> {
    if (source.kind === "file") {
        onUploadProgress(0);
        return uploadVideoFile(
            { file: source.file, clipCount, clipLength, title, language },
            onUploadProgress,
            signal,
        );
    }

    if (toLinkVideoId(source) === null) {
        throw new NoSourceError();
    }

    const created = await createYoutubeVideo({
        data: { url: source.text.trim(), clipCount, clipLength, language },
    });

    return created.videoId;
}

/**
 * A signal aborted when the form unmounts (its dialog closed): an upload in flight stops and frees
 * its reservation, and a video created anyway does not pull the person away from where they went.
 * One controller per mount, since React's strict mode mounts twice.
 */
function useUnmountSignal(): () => AbortSignal {
    const controllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        controllerRef.current = controller;
        return () => controller.abort();
    }, []);

    return () => {
        const controller = controllerRef.current;

        if (controller === null) {
            throw new Error("A video was submitted before its form was mounted");
        }

        return controller.signal;
    };
}

interface VideoSubmission {
    submission: UseMutationResult<string, Error, Submission>;
    uploadPercent: number | null;
}

/** Sends the form and opens the new video's page; the upload percent is null when not uploading. */
export function useVideoSubmission(): VideoSubmission {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [uploadPercent, setUploadPercent] = useState<number | null>(null);
    const readSignal = useUnmountSignal();
    const submission = useMutation({
        mutationFn: (input: Submission) =>
            createVideo(input, { onUploadProgress: setUploadPercent, signal: readSignal() }),
        onSuccess: async (videoId) => {
            await invalidateVideoQueries(queryClient);

            if (readSignal().aborted === true) {
                return;
            }

            await navigate({ to: "/videos/$videoId", params: { videoId } });
        },
        onError: () => setUploadPercent(null),
    });

    return { submission, uploadPercent };
}
