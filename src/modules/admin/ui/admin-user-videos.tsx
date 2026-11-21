import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_ADMIN_VIDEO_FILTER } from "#/modules/admin/admin-search";
import { AdminPager } from "#/modules/admin/ui/admin-pager";
import { adminVideosQueryOptions } from "#/modules/admin/ui/admin-queries";
import { AdminLoadError, AdminLoading } from "#/modules/admin/ui/admin-states";
import { AdminVideoList } from "#/modules/admin/ui/admin-video-list";

/** The account's own videos, newest first, with the same actions as the global list. */
export function AdminUserVideos({ userId }: { userId: string }): ReactNode {
    const [page, setPage] = useState(1);
    const videosQuery = useQuery(
        adminVideosQueryOptions({
            query: "",
            page,
            filter: DEFAULT_ADMIN_VIDEO_FILTER,
            ownerId: userId,
        }),
    );
    const result = videosQuery.data;

    if (videosQuery.isError === true && result === undefined) {
        return (
            <AdminLoadError
                title="Não foi possível carregar os vídeos"
                message="Tente de novo; se continuar, recarregue a página."
                onRetry={async () => {
                    await videosQuery.refetch();
                }}
            />
        );
    }

    if (result === undefined) {
        return <AdminLoading label="Carregando vídeos da conta" />;
    }

    if (result.videos.length === 0) {
        return (
            <p className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                Esta conta ainda não enviou nenhum vídeo.
            </p>
        );
    }

    return (
        <div className="grid gap-3">
            <AdminVideoList videos={result.videos} showOwner={false} />
            <AdminPager page={page} totalCount={result.totalCount} onPageChange={setPage} />
        </div>
    );
}
