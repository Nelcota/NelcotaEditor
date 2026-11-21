import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ALL_FILTER } from "#/modules/videos/ui/video-list-filter";
import type { VideoFilter } from "#/modules/videos/ui/video-list-filter";

interface LibraryFilter {
    filter: VideoFilter;
    changeFilter: (filter: VideoFilter) => void;
}

/**
 * The list pane stays mounted while videos open beside it, so its filter is local state. A link
 * that asks for a status (Painel's "ver com erro") still sets it, through the home page's address.
 */
export function useLibraryFilter(): LibraryFilter {
    const requestedFilter = useSearch({ strict: false, select: (search) => search.status });
    const [filter, setFilter] = useState<VideoFilter>(requestedFilter ?? ALL_FILTER);
    const [seenRequest, setSeenRequest] = useState(requestedFilter);

    // Adjusting state while rendering (React's documented pattern) avoids an effect pass.
    if (requestedFilter !== seenRequest) {
        setSeenRequest(requestedFilter);

        if (requestedFilter !== undefined) {
            setFilter(requestedFilter);
        }
    }

    return { filter, changeFilter: setFilter };
}
