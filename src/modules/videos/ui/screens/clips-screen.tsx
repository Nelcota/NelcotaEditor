import { useInfiniteQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ClipLibrary } from "#/modules/videos/ui/components/clip-library";
import {
    ClipsLoadError,
    ClipsLoading,
    NoClipsYet,
} from "#/modules/videos/ui/components/clips-screen-states";
import { DEFAULT_CLIP_ORDER } from "#/modules/videos/model/clip-order";
import type { ClipOrder } from "#/modules/videos/model/clip-order";
import { DEFAULT_CLIP_VIEW_MODE } from "#/modules/videos/model/clip-view-mode";
import type { ClipViewMode } from "#/modules/videos/model/clip-view-mode";
import { toClipsSearch } from "#/modules/videos/model/clips-search";
import type { ClipsSearch } from "#/modules/videos/model/clips-search";
import { libraryClipsQueryOptions } from "#/modules/videos/model/library-queries";
import { useSearchDraft } from "#/modules/videos/ui/hooks/use-search-draft";
import { PageHeader } from "#/shared/ui/page-header";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

interface ClipsScreenProps {
    search: ClipsSearch;
    onSearchChange: (search: ClipsSearch) => Promise<void>;
}

function ClipsContent({ search, onSearchChange }: ClipsScreenProps): ReactNode {
    const track = useTrackPromise();
    const query = search.q ?? "";
    const order = search.order ?? DEFAULT_CLIP_ORDER;
    const view = search.view ?? DEFAULT_CLIP_VIEW_MODE;
    const clipsQuery = useInfiniteQuery(libraryClipsQueryOptions({ query, order }));
    const searchDraft = useSearchDraft(query, (next: string) =>
        track(onSearchChange(toClipsSearch({ query: next, order, view }))),
    );
    const pages = clipsQuery.data?.pages;
    const firstPage = pages?.[0];

    if (clipsQuery.isError === true && firstPage === undefined) {
        return (
            <ClipsLoadError
                errorCount={clipsQuery.errorUpdateCount}
                onRetry={async () => {
                    await clipsQuery.refetch();
                }}
            />
        );
    }

    if (pages === undefined || firstPage === undefined) {
        return <ClipsLoading view={view} />;
    }

    if (firstPage.totalCount === 0 && query.length === 0) {
        return <NoClipsYet />;
    }

    return (
        <ClipLibrary
            items={pages.flatMap((page) => page.items)}
            totalCount={firstPage.totalCount}
            search={searchDraft}
            order={{
                value: order,
                onChange: (next: ClipOrder) =>
                    track(onSearchChange(toClipsSearch({ query, order: next, view }))),
            }}
            view={{
                value: view,
                onChange: (next: ClipViewMode) =>
                    track(onSearchChange(toClipsSearch({ query, order, view: next }))),
            }}
            nextPage={{
                hasNextPage: clipsQuery.hasNextPage,
                isFetching: clipsQuery.isFetchingNextPage,
                hasFailed: clipsQuery.isFetchNextPageError,
                onLoadMore: async () => {
                    await clipsQuery.fetchNextPage();
                },
            }}
        />
    );
}

export function ClipsScreen(props: ClipsScreenProps) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <PageHeader
                title="Cortes"
                description="Os cortes prontos de todos os vídeos. Assista, baixe ou ajuste no Studio."
            />
            <ClipsContent search={props.search} onSearchChange={props.onSearchChange} />
        </div>
    );
}
