import MagnifierCloseIcon from "~icons/solar/magnifier-close-linear";
import { useState } from "react";
import type { LibraryClip } from "#/modules/videos/video-views";
import { DEFAULT_CLIP_ORDER, sortLibraryClips } from "#/modules/videos/ui/clip-order";
import type { ClipOrder } from "#/modules/videos/ui/clip-order";
import { ClipRow } from "#/modules/videos/ui/clip-row";
import { ClipsToolbar } from "#/modules/videos/ui/clips-toolbar";
import { searchLibraryClips } from "#/modules/videos/ui/library-clip-search";
import { pluralize } from "#/modules/videos/ui/pluralize";
import { SourceVideoLink } from "#/modules/videos/ui/source-video-link";
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
        <div className="grid gap-3">
            {items.map((item) => (
                <ClipRow
                    key={item.clip.id}
                    clip={item.clip}
                    videoId={item.videoId}
                    lead={<SourceVideoLink item={item} />}
                />
            ))}
        </div>
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
