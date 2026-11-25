import { QueryClient } from "@tanstack/react-query";
import { isNotFound, notFound } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminUserQueryOptions } from "#/modules/admin/model/admin-queries";
import { loadAdminUser } from "#/modules/admin/model/load-admin-user";
import { getAdminUserDetails } from "#/modules/admin/server/admin-user-functions";

// Server functions are the network calls to the server; the loader decides what a failure means.
vi.mock("#/modules/admin/server/admin-user-functions", () => ({
    getAdminUserDetails: vi.fn(),
    getAdminUsers: vi.fn(),
}));
vi.mock("#/modules/admin/server/admin-video-functions", () => ({}));
vi.mock("#/modules/admin/server/admin-app-switch-functions", () => ({}));

const USER_ID = "user-1";

async function captureFailure(run: () => Promise<void>): Promise<unknown> {
    try {
        await run();
    } catch (error) {
        return error;
    }

    return null;
}

afterEach(() => {
    vi.clearAllMocks();
});

describe("loadAdminUser", () => {
    it("answers not found for an account that does not exist", async () => {
        vi.mocked(getAdminUserDetails).mockRejectedValue(notFound());
        const queryClient = new QueryClient();

        const failure = await captureFailure(() => loadAdminUser(queryClient, USER_ID));

        expect(isNotFound(failure)).toBe(true);
    });

    it("asks only once for an account that does not exist", async () => {
        vi.mocked(getAdminUserDetails).mockRejectedValue(notFound());
        const queryClient = new QueryClient();

        await captureFailure(() => loadAdminUser(queryClient, USER_ID));

        expect(getAdminUserDetails).toHaveBeenCalledTimes(1);
    });

    it("answers not found for an id no account can have", async () => {
        const queryClient = new QueryClient();

        const failure = await captureFailure(() => loadAdminUser(queryClient, "   "));

        expect(isNotFound(failure)).toBe(true);
        expect(getAdminUserDetails).not.toHaveBeenCalled();
    });

    it("asks only once for any failure while rendering on the server", async () => {
        vi.mocked(getAdminUserDetails).mockRejectedValue(new Error("offline"));
        const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });

        await captureFailure(() => loadAdminUser(queryClient, USER_ID));

        expect(getAdminUserDetails).toHaveBeenCalledTimes(1);
    });

    it("leaves any other failure to the screen", async () => {
        vi.mocked(getAdminUserDetails).mockRejectedValue(new Error("offline"));
        const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });

        const failure = await captureFailure(() => loadAdminUser(queryClient, USER_ID));

        expect(failure).toBeNull();
        expect(queryClient.getQueryState(adminUserQueryOptions(USER_ID).queryKey)?.status).toBe(
            "error",
        );
    });
});
