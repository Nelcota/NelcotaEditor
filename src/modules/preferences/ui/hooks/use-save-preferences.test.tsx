// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Preferences } from "#/modules/preferences/model/preferences";
import { PREFERENCES_QUERY_KEY } from "#/modules/preferences/model/preferences-queries";
import {
    getPreferences,
    savePreferences,
} from "#/modules/preferences/server/preferences-functions";
import { useSavePreferences } from "#/modules/preferences/ui/hooks/use-save-preferences";

type SavePreferences = ReturnType<typeof useSavePreferences>;

// Server functions are the network calls to the server; the hook decides what is sent and when.
vi.mock("#/modules/preferences/server/preferences-functions", () => ({
    getPreferences: vi.fn(),
    savePreferences: vi.fn(),
}));

const SAVED_PREFERENCES: Preferences = {
    defaultClipCount: 3,
    defaultClipLength: "short",
    transcriptionLanguage: "",
};

interface PendingSave {
    resolve: () => void;
    reject: (error: Error) => void;
}

function holdSaves(): Array<PendingSave> {
    const pendingSaves: Array<PendingSave> = [];
    vi.mocked(savePreferences).mockImplementation(
        async () =>
            await new Promise<void>((resolve, reject) => {
                pendingSaves.push({ resolve, reject });
            }),
    );

    return pendingSaves;
}

function renderSave(queryClient: QueryClient): RenderHookResult<SavePreferences, unknown> {
    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHook(() => useSavePreferences(), { wrapper });
}

function createQueryClient(): QueryClient {
    const queryClient = new QueryClient();
    queryClient.setQueryData(PREFERENCES_QUERY_KEY, SAVED_PREFERENCES);

    return queryClient;
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("useSavePreferences", () => {
    it("sends only the field that changed", async () => {
        vi.mocked(savePreferences).mockResolvedValue(undefined);
        vi.mocked(getPreferences).mockResolvedValue(SAVED_PREFERENCES);
        const rendered = renderSave(createQueryClient());

        act(() => rendered.result.current.mutate({ defaultClipCount: 5 }));

        await waitFor(() => expect(rendered.result.current.isSuccess).toBe(true));
        expect(savePreferences).toHaveBeenCalledWith({ data: { defaultClipCount: 5 } });
    });

    it("waits for the earlier save before sending the next one", async () => {
        const pendingSaves = holdSaves();
        const rendered = renderSave(createQueryClient());

        act(() => rendered.result.current.mutate({ defaultClipCount: 4 }));
        act(() => rendered.result.current.mutate({ defaultClipCount: 5 }));

        await waitFor(() => expect(savePreferences).toHaveBeenCalledTimes(1));
        expect(savePreferences).toHaveBeenLastCalledWith({ data: { defaultClipCount: 4 } });
        pendingSaves[0]?.resolve();
        await waitFor(() => expect(savePreferences).toHaveBeenCalledTimes(2));
        expect(savePreferences).toHaveBeenLastCalledWith({ data: { defaultClipCount: 5 } });
    });

    it("keeps the newest value on screen when an earlier save finishes", async () => {
        const pendingSaves = holdSaves();
        const queryClient = createQueryClient();
        const rendered = renderSave(queryClient);

        act(() => rendered.result.current.mutate({ defaultClipCount: 4 }));
        act(() => rendered.result.current.mutate({ defaultClipCount: 5 }));
        await waitFor(() => expect(savePreferences).toHaveBeenCalledTimes(1));
        pendingSaves[0]?.resolve();
        await waitFor(() => expect(savePreferences).toHaveBeenCalledTimes(2));

        expect(queryClient.getQueryData(PREFERENCES_QUERY_KEY)).toEqual({
            ...SAVED_PREFERENCES,
            defaultClipCount: 5,
        });
        expect(getPreferences).not.toHaveBeenCalled();
    });

    it("puts back a failed change without undoing a later one", async () => {
        const pendingSaves = holdSaves();
        const queryClient = createQueryClient();
        const rendered = renderSave(queryClient);

        act(() => rendered.result.current.mutate({ defaultClipCount: 4 }));
        act(() => rendered.result.current.mutate({ transcriptionLanguage: "pt" }));
        await waitFor(() => expect(savePreferences).toHaveBeenCalledTimes(1));
        pendingSaves[0]?.reject(new Error("offline"));
        await waitFor(() => expect(savePreferences).toHaveBeenCalledTimes(2));

        expect(queryClient.getQueryData(PREFERENCES_QUERY_KEY)).toEqual({
            ...SAVED_PREFERENCES,
            transcriptionLanguage: "pt",
        });
    });
});
