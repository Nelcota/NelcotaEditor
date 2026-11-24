// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSearchDraft } from "#/modules/admin/ui/hooks/use-search-draft";

type SearchDraft = ReturnType<typeof useSearchDraft>;

interface DraftProps {
    query: string;
}

const PAST_SEARCH_DELAY_MILLISECONDS = 1000;

function renderDraft(onSearch: (query: string) => void): RenderHookResult<SearchDraft, DraftProps> {
    return renderHook(({ query }: DraftProps) => useSearchDraft(query, onSearch), {
        initialProps: { query: "" },
    });
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe("useSearchDraft", () => {
    it("searches once typing pauses", () => {
        const onSearch = vi.fn();
        const rendered = renderDraft(onSearch);

        act(() => rendered.result.current.setDraft("ana "));
        act(() => {
            vi.advanceTimersByTime(PAST_SEARCH_DELAY_MILLISECONDS);
        });

        expect(onSearch).toHaveBeenCalledExactlyOnceWith("ana");
    });

    it("keeps letters typed while its own search arrives", () => {
        const onSearch = vi.fn();
        const rendered = renderDraft(onSearch);
        act(() => rendered.result.current.setDraft("ana"));
        act(() => {
            vi.advanceTimersByTime(PAST_SEARCH_DELAY_MILLISECONDS);
        });
        act(() => rendered.result.current.setDraft("anab"));

        rendered.rerender({ query: "ana" });

        expect(rendered.result.current.draft).toBe("anab");
    });

    it("shows the search again when Forward returns to it after Back", () => {
        const onSearch = vi.fn();
        const rendered = renderDraft(onSearch);
        act(() => rendered.result.current.setDraft("ana"));
        act(() => {
            vi.advanceTimersByTime(PAST_SEARCH_DELAY_MILLISECONDS);
        });
        rendered.rerender({ query: "ana" });
        rendered.rerender({ query: "" });

        rendered.rerender({ query: "ana" });

        expect(rendered.result.current.draft).toBe("ana");
    });

    it("does not undo Forward with a search of its own", () => {
        const onSearch = vi.fn();
        const rendered = renderDraft(onSearch);
        act(() => rendered.result.current.setDraft("ana"));
        act(() => {
            vi.advanceTimersByTime(PAST_SEARCH_DELAY_MILLISECONDS);
        });
        rendered.rerender({ query: "ana" });
        rendered.rerender({ query: "" });
        rendered.rerender({ query: "ana" });

        act(() => {
            vi.advanceTimersByTime(PAST_SEARCH_DELAY_MILLISECONDS);
        });

        expect(onSearch).toHaveBeenCalledExactlyOnceWith("ana");
    });
});
