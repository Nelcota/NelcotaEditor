import { describe, expect, it } from "vitest";

process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
process.env.STORAGE_DIR = "storage-unused";
process.env.WHISPER_URL = "http://127.0.0.1:1";
process.env.WHISPER_MODEL = "test-model";
process.env.STORAGE_DRIVER = "r2";
process.env.R2_ACCOUNT_ID = "0123456789abcdef0123456789abcdef";
process.env.R2_ACCESS_KEY_ID = "test-access-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
process.env.R2_BUCKET = "nelcota-media";
process.env.BETTER_AUTH_SECRET = "test-auth-secret-0123456789abcdef";

const { receiveUploadFile } = await import("#/modules/videos/server/receive-upload-file.server");

const UPLOAD_ID = "0190a4b2-7c1e-7a00-8000-000000000001";

describe("receiveUploadFile", () => {
    it("answers 404 when the store takes uploads through signed links", async () => {
        const request = new Request(`http://localhost/api/videos/uploads/${UPLOAD_ID}/file`, {
            method: "PUT",
            body: new Uint8Array(16),
        });

        const response = await receiveUploadFile(request, UPLOAD_ID);

        expect(response.status).toBe(404);
    });
});
