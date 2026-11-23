import { useQuery } from "@tanstack/react-query";
import { ClipLibrary } from "#/modules/videos/ui/clip-library";
import { ClipsLoadError, ClipsLoading, NoClipsYet } from "#/modules/videos/ui/clips-screen-states";
import { libraryClipsQueryOptions } from "#/modules/videos/ui/library-queries";
import { PageHeader } from "#/shared/ui/page-header";

function ClipsContent() {
    const clipsQuery = useQuery(libraryClipsQueryOptions());
    const items = clipsQuery.data;

    if (clipsQuery.isError === true && items === undefined) {
        return (
            <ClipsLoadError
                errorCount={clipsQuery.errorUpdateCount}
                onRetry={async () => {
                    await clipsQuery.refetch();
                }}
            />
        );
    }

    if (items === undefined) {
        return <ClipsLoading />;
    }

    if (items.length === 0) {
        return <NoClipsYet />;
    }

    return <ClipLibrary items={items} />;
}

export function ClipsScreen() {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <PageHeader
                title="Cortes"
                description="Os cortes prontos de todos os vídeos. Assista, baixe ou ajuste no Studio."
            />
            <ClipsContent />
        </div>
    );
}
