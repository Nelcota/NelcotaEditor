import SearchXIcon from "~icons/lucide/search-x";
import type { ReactNode } from "react";
import type { LibraryClip } from "#/modules/videos/model/video-views";
import type { ClipOrder } from "#/modules/videos/model/clip-order";
import type { ClipViewMode } from "#/modules/videos/model/clip-view-mode";
import { ClipsToolbar } from "#/modules/videos/ui/components/clips-toolbar";
import { ClipCard } from "#/modules/videos/ui/components/clip-card";
import { ClipTable } from "#/modules/videos/ui/components/clip-table";
import { pluralize } from "#/shared/ui/pluralize";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

/** The clip grid's columns, shared with the loading state so nothing jumps on arrival. */
export const CLIP_GRID_CLASS =
    "grid grid-cols-2 gap-x-4 gap-y-8 @2xl/clips:grid-cols-3 @2xl/clips:gap-x-6 @4xl/clips:grid-cols-4 @6xl/clips:grid-cols-5";

interface NextPage {
    hasNextPage: boolean;
    isFetching: boolean;
    hasFailed: boolean;
    onLoadMore: () => Promise<void>;
}

interface ClipLibraryProps {
    /** The pages loaded so far, in order. */
    items: Array<LibraryClip>;
    /** Every clip that matches the search, loaded or not. */
    totalCount: number;
    search: { draft: string; setDraft: (value: string) => void };
    order: { value: ClipOrder; onChange: (order: ClipOrder) => void };
    view: { value: ClipViewMode; onChange: (view: ClipViewMode) => void };
    nextPage: NextPage;
}

function describeCount(loadedCount: number, totalCount: number): string {
    if (loadedCount >= totalCount) {
        return `${totalCount} ${pluralize(totalCount, "corte", "cortes")}`;
    }

    return `${loadedCount} de ${totalCount}`;
}

function NoClipMatch({ query, onClear }: { query: string; onClear: () => void }) {
    return (
        <EmptyState
            art={<SearchXIcon className="size-8 text-muted-foreground" aria-hidden="true" />}
            title={`Nenhum corte com “${query.trim()}”`}
            description="A busca olha o título do corte e o do vídeo."
            action={
                <Button variant="secondary" onClick={onClear}>
                    Limpar busca
                </Button>
            }
        />
    );
}

/**
 * Columns follow the page's own width, not the window's: the sidebar and the panel's padding
 * take a third of a laptop screen, and six columns there left no room for a title or a label.
 */
function ClipGrid({ items }: { items: Array<LibraryClip> }) {
    return (
        <div className="@container/clips">
            <ul className={CLIP_GRID_CLASS}>
                {items.map((item) => (
                    <ClipCard key={item.clip.id} item={item} />
                ))}
            </ul>
        </div>
    );
}

function LoadMoreClips({ nextPage }: { nextPage: NextPage }): ReactNode {
    const track = useTrackPromise();

    if (nextPage.hasNextPage === false) {
        return null;
    }

    return (
        <div className="grid justify-items-center gap-2">
            {nextPage.hasFailed === true && (
                <p role="alert" className="text-sm text-destructive">
                    Não foi possível carregar mais cortes. Tente de novo.
                </p>
            )}
            <Button
                variant="secondary"
                disabled={nextPage.isFetching}
                aria-busy={nextPage.isFetching}
                onClick={() => track(nextPage.onLoadMore())}
            >
                Carregar mais cortes
            </Button>
        </div>
    );
}

/** The ready clips, searched by their title or their video's, newest or best first, as cards or rows. */
export function ClipLibrary(props: ClipLibraryProps) {
    const { items, totalCount, search, order, view, nextPage } = props;

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
            <ClipsToolbar
                query={search.draft}
                onQueryChange={search.setDraft}
                order={order}
                view={view}
                countLabel={describeCount(items.length, totalCount)}
            />
            {items.length === 0 && (
                <NoClipMatch query={search.draft} onClear={() => search.setDraft("")} />
            )}
            {items.length > 0 && view.value === "grid" && <ClipGrid items={items} />}
            {items.length > 0 && view.value === "table" && <ClipTable items={items} />}
            <LoadMoreClips nextPage={nextPage} />
        </div>
    );
}
