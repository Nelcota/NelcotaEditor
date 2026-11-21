import DangerTriangleIcon from "~icons/solar/danger-triangle-linear";
import ServerSquareIcon from "~icons/solar/server-square-linear";
import type { StorageUsage } from "#/modules/videos/video-views";
import { pluralize } from "#/shared/ui/pluralize";
import { cn } from "#/shared/ui/cn";
import { formatBytes } from "#/shared/ui/format";

const PERCENT = 100;
const WARNING_PERCENT = 80;

interface StoragePart {
    label: string;
    bytes: number;
    swatchClass: string;
}

function toStorageParts(storage: StorageUsage): Array<StoragePart> {
    return [
        { label: "Originais", bytes: storage.sourceBytes, swatchClass: "bg-foreground/45" },
        { label: "Cortes", bytes: storage.clipBytes, swatchClass: "bg-chart-current" },
    ];
}

/** Whole percent of the total; an empty disk, or a broken total, has no share to show. */
function toPercent(bytes: number, totalBytes: number): number {
    if (Number.isFinite(totalBytes) === false || totalBytes <= 0) {
        return 0;
    }

    if (Number.isFinite(bytes) === false || bytes <= 0) {
        return 0;
    }

    return Math.min(PERCENT, Math.round((bytes / totalBytes) * PERCENT));
}

/** Not clamped: going past the quota is exactly what the warning reports. */
function toPercentOfQuota(totalBytes: number, quotaBytes: number): number {
    if (Number.isFinite(quotaBytes) === false || quotaBytes <= 0) {
        return 0;
    }

    return Math.round((totalBytes / quotaBytes) * PERCENT);
}

function describeWarning(usedPercent: number): string {
    if (usedPercent >= PERCENT) {
        return "Você passou do espaço previsto";
    }

    return "O espaço está acabando";
}

interface StorageWarningProps {
    usedPercent: number;
    quotaBytes: number;
}

/** Nothing is blocked at the quota; the notice only says what to do before the disk fills. */
function StorageWarning({ usedPercent, quotaBytes }: StorageWarningProps) {
    const title = describeWarning(usedPercent);

    return (
        <div
            role="status"
            className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm"
        >
            <DangerTriangleIcon
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-destructive"
            />
            <p>
                <span className="font-bold">{title}</span>
                <span className="text-muted-foreground">
                    {`. ${usedPercent}% dos ${formatBytes(quotaBytes)} em uso. Exclua vídeos antigos ou baixe os cortes e apague os originais para liberar espaço.`}
                </span>
            </p>
        </div>
    );
}

interface StorageBreakdownProps {
    storage: StorageUsage;
    quotaBytes: number;
    videoCount: number;
}

/** Disk used, split into originals and clips; the legend carries the numbers, not the colour. */
export function StorageBreakdown({ storage, quotaBytes, videoCount }: StorageBreakdownProps) {
    const totalBytes = storage.totalBytes;
    const usedPercent = toPercentOfQuota(totalBytes, quotaBytes);
    const parts = toStorageParts(storage);
    const filledParts = parts.filter((part) => part.bytes > 0);

    return (
        <section
            aria-labelledby="storage-title"
            className="grid gap-3 rounded-2xl border bg-popover p-4 sm:p-5"
        >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 id="storage-title" className="flex items-center gap-2 font-bold">
                    <ServerSquareIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                    Espaço em disco
                </h3>
                <p className="text-sm text-muted-foreground tabular-nums">
                    <span className="font-bold text-foreground">
                        {formatBytes(totalBytes)}
                    </span> em{" "}
                    {videoCount} {pluralize(videoCount, "vídeo", "vídeos")}
                </p>
            </div>
            {usedPercent >= WARNING_PERCENT && (
                <StorageWarning usedPercent={usedPercent} quotaBytes={quotaBytes} />
            )}
            <div
                className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted"
                aria-hidden="true"
            >
                {filledParts.map((part) => (
                    <span
                        key={part.label}
                        className={cn("h-full", part.swatchClass)}
                        style={{ width: `${toPercent(part.bytes, totalBytes)}%` }}
                    />
                ))}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground tabular-nums">
                {parts.map((part) => (
                    <li key={part.label} className="flex items-center gap-2">
                        <span className={cn("size-2.5 rounded-sm", part.swatchClass)} />
                        {`${part.label} ${formatBytes(part.bytes)} · ${toPercent(part.bytes, totalBytes)}%`}
                    </li>
                ))}
            </ul>
        </section>
    );
}
