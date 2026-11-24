import RotateCwIcon from "~icons/lucide/rotate-cw";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";
import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import { Mascot } from "#/shared/ui/mascot";

const SKELETON_ROW_COUNT = 6;

export function AdminLoading({ label }: { label: string }): ReactNode {
    return (
        <div role="status" className="grid gap-3">
            <span className="sr-only">{label}</span>
            {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
        </div>
    );
}

interface AdminLoadErrorProps {
    title: string;
    message: string;
    onRetry: () => void;
}

export function AdminLoadError({ title, message, onRetry }: AdminLoadErrorProps): ReactNode {
    return (
        <EmptyState
            art={<Mascot index={STAGE_CREW.failed} className="size-14" />}
            title={title}
            description={message}
            action={
                <Button variant="outline" onClick={onRetry}>
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </Button>
            }
        />
    );
}
