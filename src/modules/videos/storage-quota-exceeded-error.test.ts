import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { StorageQuotaExceededError } from "#/modules/videos/storage-quota-exceeded-error";

const MEGABYTE = 1024 * 1024;
const NO_BREAK_SPACE = " ";

function megabytes(value: string): string {
    return `${value}${NO_BREAK_SPACE}MB`;
}

describe("StorageQuotaExceededError", () => {
    test("says how big the video is and how much is left when there is some room", () => {
        const error = new StorageQuotaExceededError({
            usedBytes: 30 * MEGABYTE,
            incomingBytes: 30 * MEGABYTE,
            quotaBytes: 50 * MEGABYTE,
        });

        assert.equal(
            error.message,
            `Este vídeo tem ${megabytes("30,0")} e só restam ${megabytes("20,0")} livres de ${megabytes("50,0")}. Exclua vídeos antigos para liberar espaço.`,
        );
    });

    test("says the space is over when the account is full", () => {
        const error = new StorageQuotaExceededError({
            usedBytes: 50 * MEGABYTE,
            incomingBytes: 10 * MEGABYTE,
            quotaBytes: 50 * MEGABYTE,
        });

        assert.equal(
            error.message,
            `Seu espaço acabou (${megabytes("50,0")} de ${megabytes("50,0")}). Exclua vídeos antigos para liberar espaço.`,
        );
    });

    test("says the space is over when the size of the video is not known", () => {
        const error = new StorageQuotaExceededError({
            usedBytes: 49 * MEGABYTE,
            incomingBytes: 0,
            quotaBytes: 50 * MEGABYTE,
        });

        assert.match(error.message, /^Seu espaço acabou/);
    });
});
