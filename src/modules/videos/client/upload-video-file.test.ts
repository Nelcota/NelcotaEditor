import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadVideoFile } from "#/modules/videos/client/upload-video-file";
import type { UploadVideoInput } from "#/modules/videos/client/upload-video-file";
import { UploadCancelledError } from "#/modules/videos/model/upload-cancelled-error";
import {
    cancelVideoUpload,
    completeVideoUpload,
    startVideoUpload,
} from "#/modules/videos/server/video-upload-functions";

// Server functions are the network calls; outside the app's build they load the server's
// environment.
vi.mock("#/modules/videos/server/video-upload-functions", () => ({
    startVideoUpload: vi.fn(),
    completeVideoUpload: vi.fn(),
    cancelVideoUpload: vi.fn(),
}));

const UPLOAD_ID = "upload-1";

/** A transfer that never finishes on its own, like a large file on a slow connection. */
class PendingRequest extends EventTarget {
    static latest: PendingRequest | null = null;
    upload = new EventTarget();
    status = 0;
    responseText = "";

    constructor() {
        super();
        PendingRequest.latest = this;
    }

    open(): void {}

    send(): void {}

    abort(): void {
        this.dispatchEvent(new Event("abort"));
        this.dispatchEvent(new Event("loadend"));
    }
}

function buildInput(): UploadVideoInput {
    return {
        file: new File([new Uint8Array(16)], "gravação.mp4"),
        title: "",
        clipCount: 3,
        clipLength: "minute",
        language: "pt",
    };
}

beforeEach(() => {
    vi.stubGlobal("XMLHttpRequest", PendingRequest);
    vi.mocked(startVideoUpload).mockResolvedValue({
        uploadId: UPLOAD_ID,
        uploadUrl: "/api/uploads/upload-1",
    });
    vi.mocked(cancelVideoUpload).mockResolvedValue(undefined);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    PendingRequest.latest = null;
});

describe("uploadVideoFile", () => {
    it("stops the transfer and frees the reservation when cancelled", async () => {
        const controller = new AbortController();
        const upload = uploadVideoFile(buildInput(), () => {}, controller.signal);
        await vi.waitFor(() => expect(PendingRequest.latest).not.toBeNull());

        controller.abort();

        await expect(upload).rejects.toBeInstanceOf(UploadCancelledError);
        expect(cancelVideoUpload).toHaveBeenCalledWith({ data: { uploadId: UPLOAD_ID } });
        expect(completeVideoUpload).not.toHaveBeenCalled();
    });

    it("reserves nothing when cancelled before it starts", async () => {
        const controller = new AbortController();
        controller.abort();

        const upload = uploadVideoFile(buildInput(), () => {}, controller.signal);

        await expect(upload).rejects.toBeInstanceOf(UploadCancelledError);
        expect(startVideoUpload).not.toHaveBeenCalled();
    });
});
