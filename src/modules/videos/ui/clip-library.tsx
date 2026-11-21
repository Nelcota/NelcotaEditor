import MagnifierCloseIcon from "~icons/solar/magnifier-close-linear";
import { useState } from "react";
import type { LibraryClip } from "#/modules/videos/video-views";
import { DEFAULT_CLIP_ORDER, sortLibraryClips } from "#/modules/videos/ui/clip-order";
import type { ClipOrder } from "#/modules/videos/ui/clip-order";
import { ClipsToolbar } from "#/modules/videos/ui/clips-toolbar";
import { CompactClipRow } from "#/modules/videos/ui/compact-clip-row";
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
            art={<MagnifierCloseIcon className="size-8 text-muted-foreground" aria-hidden="true" />}
            title={`Nenhum corte com “${query.trim()}”`}
            description="A busca olha o título do corte e o do vídeo."
            action={
                <Button variant="secondary" className="rounded-full" onClick={onClear}>
                    Limpar busca
                </Button>
            }
        />
    );
}

function ClipRows({ items }: { items: Array<LibraryClip> }) {
    return (
        <ul className="rounded-2xl border bg-popover px-4 sm:px-5">
            {items.map((item) => (
                <CompactClipRow key={item.clip.id} item={item} />
            ))}
        </ul>
    );
}

/** Every ready clip, searchable by its title or its video's, newest or best first. */
export function ClipLibrary({ items }: { items: Array<LibraryClip> }) {
    const [query, setQuery] = useState("");
    const [order, setOrder] = useState<ClipOrder>(DEFAULT_CLIP_ORDER);
    const visibleItems = sortLibraryClips(searchLibraryClips(items, query), order);

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
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
            {visibleItems.length > 0 && <ClipRows items={visibleItems} />}
        </div>
    );
}
