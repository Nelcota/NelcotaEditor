import { useInfiniteQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ClipLibrary } from "#/modules/videos/ui/components/clip-library";
import { RecentVideos } from "#/modules/videos/ui/components/recent-videos";
import { ClipMaker } from "#/modules/videos/ui/components/clip-maker";
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

/** Meus cortes: make clips from a link on top, the last videos, then every clip ready so far. */
export function ClipsScreen(props: ClipsScreenProps) {
    return (
        <div className="grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10">
            <div className="grid gap-6">
                <header className="grid max-w-2xl gap-2">
                    <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                        Cortes
                    </p>
                    <h1 className="text-title font-extrabold tracking-[-0.02em] sm:text-4xl">
                        Cole um link. O Editor corta.
                    </h1>
                    <p className="text-muted-foreground">
                        Transforme um vídeo longo em vários cortes verticais com legenda, prontos
                        para postar.
                    </p>
                </header>
                <ClipMaker />
            </div>
            <RecentVideos />
            <section aria-labelledby="my-clips-title" className="grid gap-4">
                <h2 id="my-clips-title" className="text-lg font-bold">
                    Seus cortes
                </h2>
                <ClipsContent search={props.search} onSearchChange={props.onSearchChange} />
            </section>
        </div>
    );
}
