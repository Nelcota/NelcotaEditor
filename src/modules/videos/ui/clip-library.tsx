import SearchXIcon from "~icons/lucide/search-x";
import { useState } from "react";
import type { LibraryClip } from "#/modules/videos/video-views";
import { DEFAULT_CLIP_ORDER, sortLibraryClips } from "#/modules/videos/ui/clip-order";
import type { ClipOrder } from "#/modules/videos/ui/clip-order";
import { ClipsToolbar } from "#/modules/videos/ui/clips-toolbar";
import { ClipCard } from "#/modules/videos/ui/clip-card";
import { searchLibraryClips } from "#/modules/videos/ui/library-clip-search";
import { pluralize } from "#/shared/ui/pluralize";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";

function describeCount(visibleCount: number, totalCount: number): string {
    if (visibleCount === totalCount) {
        return `${totalCount} ${pluralize(totalCount, "corte", "cortes")}`;
    }

    return `${visibleCount} de ${totalCount}`;
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
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 @2xl/clips:grid-cols-3 @2xl/clips:gap-x-6 @4xl/clips:grid-cols-4 @6xl/clips:grid-cols-5">
                {items.map((item) => (
                    <ClipCard key={item.clip.id} item={item} />
                ))}
            </ul>
        </div>
    );
}

/** Every ready clip, searchable by its title or its video's, newest or best first. */
export function ClipLibrary({ items }: { items: Array<LibraryClip> }) {
    const [query, setQuery] = useState("");
    const [order, setOrder] = useState<ClipOrder>(DEFAULT_CLIP_ORDER);
    const visibleItems = sortLibraryClips(searchLibraryClips(items, query), order);

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
            <ClipsToolbar
                query={query}
                onQueryChange={setQuery}
                order={order}
                onOrderChange={setOrder}
                countLabel={describeCount(visibleItems.length, items.length)}
            />
            {visibleItems.length === 0 && (
                <NoClipMatch query={query} onClear={() => setQuery("")} />
            )}
            {visibleItems.length > 0 && <ClipGrid items={visibleItems} />}
        </div>
    );
}
