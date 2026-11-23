import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { UploadReservations } from "#/modules/videos/server/upload-reservations.server";

const USER_ID = "user-1";
const GIGABYTE = 1024 * 1024 * 1024;

describe("UploadReservations", () => {
    test("adds up the uploads a user is still writing", () => {
        const reservations = new UploadReservations();

        reservations.reserve(USER_ID, 5 * GIGABYTE);
        reservations.reserve(USER_ID, 2 * GIGABYTE);

        assert.deepEqual(reservations.summarize(USER_ID), { count: 2, bytes: 7 * GIGABYTE });
    });

    test("keeps each user's uploads apart", () => {
        const reservations = new UploadReservations();

        reservations.reserve(USER_ID, GIGABYTE);

        assert.deepEqual(reservations.summarize("user-2"), { count: 0, bytes: 0 });
    });

    test("frees the space of a released upload only once", () => {
        const reservations = new UploadReservations();
        const release = reservations.reserve(USER_ID, 5 * GIGABYTE);
        reservations.reserve(USER_ID, GIGABYTE);

        release();
        release();

        assert.deepEqual(reservations.summarize(USER_ID), { count: 1, bytes: GIGABYTE });
    });

    test("forgets a user once every upload is released", () => {
        const reservations = new UploadReservations();
        const release = reservations.reserve(USER_ID, GIGABYTE);

        release();

        assert.deepEqual(reservations.summarize(USER_ID), { count: 0, bytes: 0 });
    });

    test("rejects an invalid byte count", () => {
        const reservations = new UploadReservations();

        assert.throws(() => reservations.reserve(USER_ID, Number.NaN), RangeError);
        assert.throws(() => reservations.reserve(USER_ID, -1), RangeError);
    });

    test("rejects an empty user id", () => {
        const reservations = new UploadReservations();

        assert.throws(() => reservations.reserve(" ", GIGABYTE), RangeError);
    });
});
