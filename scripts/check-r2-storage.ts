import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getR2FileStorage } from "#/shared/server/file-storage/get-file-storage.server";

// Checks the R2 behaviors the app relies on that R2's docs do not settle, against the real bucket
// from the R2_* settings. Writes only under checks/<random id>/ and deletes it at the end.
const SAMPLE_BYTES = 4096;
const RANGE_END = 99;
const HTTP_OK = 200;
const HTTP_PARTIAL_CONTENT = 206;
const HTTP_PRECONDITION_FAILED = 412;
const REQUEST_TIMEOUT_MILLISECONDS = 30_000;
const DOWNLOAD_DISPOSITION = 'attachment; filename="corte.mp4"';

class R2CheckFailedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "R2CheckFailedError";
    }
}

function expectCheck(isPassing: boolean, description: string): void {
    if (isPassing === false) {
        throw new R2CheckFailedError(`FAILED: ${description}`);
    }

    console.info(`ok: ${description}`);
}

async function followRedirect(key: string, headers: Headers): Promise<string> {
    const response = await getR2FileStorage().respondWithFile(new Request("http://localhost/"), {
        key,
        headers,
        linkLifetimeSeconds: 60,
    });

    return response.headers.get("Location") ?? "";
}

async function putBody(uploadUrl: string, byteCount: number): Promise<number> {
    const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "If-None-Match": "*" },
        body: new Uint8Array(byteCount),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS),
    });

    return response.status;
}

async function checkStoreAndMeasure(key: string, localFile: string): Promise<void> {
    const storage = getR2FileStorage();
    const storedBytes = await storage.storeLocalFile(key, localFile);

    expectCheck(storedBytes === SAMPLE_BYTES, "stores a local file with the SDK's checksum setup");
    expectCheck((await storage.measureFile(key)) === SAMPLE_BYTES, "measures the stored size");
}

async function checkSignedDownload(key: string): Promise<void> {
    const headers = new Headers({
        "Content-Type": "video/mp4",
        "Content-Disposition": DOWNLOAD_DISPOSITION,
    });
    const signedUrl = await followRedirect(key, headers);
    const whole = await fetch(signedUrl, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS),
    });
    await whole.arrayBuffer();

    expectCheck(whole.status === HTTP_OK, "serves a signed GET link");
    expectCheck(
        whole.headers.get("content-disposition") === DOWNLOAD_DISPOSITION,
        "honours response-content-disposition (the download button saves the file)",
    );
    expectCheck(whole.headers.get("content-type") === "video/mp4", "honours response-content-type");

    const partial = await fetch(signedUrl, {
        headers: { Range: `bytes=0-${RANGE_END}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS),
    });
    await partial.arrayBuffer();

    expectCheck(
        partial.status === HTTP_PARTIAL_CONTENT,
        "answers a Range request on a signed link (seeking)",
    );
}

async function checkSignedUpload(key: string): Promise<void> {
    const uploadUrl = await getR2FileStorage().createUploadUrl(key, {
        sizeBytes: SAMPLE_BYTES,
        lifetimeSeconds: 60,
    });

    if (uploadUrl === null) {
        throw new R2CheckFailedError("FAILED: the R2 adapter returned no upload link");
    }

    const largerStatus = await putBody(uploadUrl, SAMPLE_BYTES + 1);
    expectCheck(
        largerStatus >= 400,
        `refuses an upload larger than signed (status ${largerStatus})`,
    );

    const exactStatus = await putBody(uploadUrl, SAMPLE_BYTES);
    expectCheck(exactStatus === HTTP_OK, "takes an upload of the signed size");
    const repeatedStatus = await putBody(uploadUrl, SAMPLE_BYTES);
    expectCheck(
        repeatedStatus === HTTP_PRECONDITION_FAILED,
        "keeps the original on a repeated PUT",
    );
    expectCheck(
        (await getR2FileStorage().measureFile(key)) === SAMPLE_BYTES,
        "stores the uploaded body",
    );
}

async function checkR2Storage(): Promise<void> {
    const folder = `checks/${crypto.randomUUID()}`;
    const localDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-r2-check-"));
    const localFile = path.join(localDirectory, "sample.mp4");
    await writeFile(localFile, new Uint8Array(SAMPLE_BYTES));

    try {
        await checkStoreAndMeasure(`${folder}/stored.mp4`, localFile);
        await checkSignedDownload(`${folder}/stored.mp4`);
        await checkSignedUpload(`${folder}/uploaded.mp4`);
    } finally {
        await getR2FileStorage().deleteFolder(folder);
        await rm(localDirectory, { recursive: true, force: true });
    }

    expectCheck(
        (await getR2FileStorage().measureFile(`${folder}/stored.mp4`)) === 0,
        "deletes a folder",
    );
}

await checkR2Storage();
process.exit(0);
