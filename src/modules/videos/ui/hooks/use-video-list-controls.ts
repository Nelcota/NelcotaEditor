import { useState } from "react";
import { DEFAULT_VIDEO_SORT } from "#/modules/videos/model/video-sort";
import type { VideoSort } from "#/modules/videos/model/video-sort";
import { useSearchDraft } from "#/modules/videos/ui/hooks/use-search-draft";

export interface VideoListControls {
    /** What the field shows, answered on every key. */
    draft: string;
    /** What the server searches, once typing pauses. */
    query: string;
    sort: VideoSort;
    changeDraft: (draft: string) => void;
    changeSort: (sort: VideoSort) => void;
    clearQuery: () => void;
}

/** Search and order of the list; each change asks the server for a new first page. */
export function useVideoListControls(): VideoListControls {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<VideoSort>(DEFAULT_VIDEO_SORT);
    const searchDraft = useSearchDraft(query, setQuery);

    return {
        draft: searchDraft.draft,
        query,
        sort,
        changeDraft: searchDraft.setDraft,
        changeSort: setSort,
        clearQuery: () => {
            searchDraft.setDraft("");
            setQuery("");
        },
    };
}
