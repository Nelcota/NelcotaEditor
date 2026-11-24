import { useEffect, useState } from "react";

const SEARCH_DELAY_MILLISECONDS = 300;

interface SearchDraft {
    draft: string;
    setDraft: (value: string) => void;
}

/**
 * The field answers every key at once; the search itself (a URL change and a server query) waits
 * until typing pauses. A query that arrives from elsewhere (back button, a link) replaces the draft,
 * but the echo of our own search does not, so letters typed meanwhile are kept.
 */
export function useSearchDraft(query: string, onSearch: (query: string) => void): SearchDraft {
    const [draft, setDraft] = useState(query);
    const [seenQuery, setSeenQuery] = useState(query);
    const [requestedQuery, setRequestedQuery] = useState(query);

    if (query !== seenQuery) {
        setSeenQuery(query);

        // An outside query also ends our own request, so a later return to that same query
        // (Back, then Forward) counts as outside too and fills the field.
        if (query !== requestedQuery) {
            setDraft(query);
            setRequestedQuery(query);
        }
    }

    useEffect(() => {
        const trimmed = draft.trim();

        if (trimmed === query) {
            return undefined;
        }

        const timeout = window.setTimeout(() => {
            setRequestedQuery(trimmed);
            onSearch(trimmed);
        }, SEARCH_DELAY_MILLISECONDS);

        return () => window.clearTimeout(timeout);
    }, [draft, query, onSearch]);

    return { draft, setDraft };
}
