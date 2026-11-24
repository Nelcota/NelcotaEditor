/** The person closed the dialog that was sending the file, so nobody is left to show it to. */
export class UploadCancelledError extends Error {
    constructor() {
        super("The upload was cancelled before the video was created");
        this.name = "UploadCancelledError";
    }
}
