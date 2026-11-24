import ArrowRightIcon from "~icons/lucide/arrow-right";
import ChevronDownIcon from "~icons/lucide/chevron-down";
import ChevronUpIcon from "~icons/lucide/chevron-up";
import CircleHelpIcon from "~icons/lucide/circle-help";
import EyeIcon from "~icons/lucide/eye";
import EyeOffIcon from "~icons/lucide/eye-off";
import FilmIcon from "~icons/lucide/film";
import ScissorsIcon from "~icons/lucide/scissors";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { usageQueryOptions } from "#/modules/videos/model/library-queries";
import type { IconComponent } from "#/shared/ui/icon-component";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { formatBytes } from "#/shared/ui/format";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { useStoredFlag } from "#/shared/ui/use-stored-flag";

const NUMBERS_HIDDEN_KEY = "nelcota:storage-numbers-hidden";
const COLLAPSED_KEY = "nelcota:storage-card-collapsed";
const HIDDEN_VALUE = "•••";
const PERCENT = 100;
const DETAILS_ID = "storage-card-details";

/** Whole percent of a total; an empty or broken total has no share to show. */
function toPercent(bytes: number, totalBytes: number): number {
    if (Number.isFinite(totalBytes) === false || totalBytes <= 0) {
        return 0;
    }

    if (Number.isFinite(bytes) === false || bytes <= 0) {
        return 0;
    }

    return Math.min(PERCENT, Math.round((bytes / totalBytes) * PERCENT));
}

interface StorageRowProps {
    icon: IconComponent;
    label: string;
    bytes: number;
    totalBytes: number;
    barClass: string;
    isHidden: boolean;
}

function StorageRow(props: StorageRowProps): ReactNode {
    const { icon: Icon, label, bytes, totalBytes, barClass, isHidden } = props;
    const percent = toPercent(bytes, totalBytes);
    let value = `${formatBytes(bytes)}`;

    if (isHidden === true) {
        value = HIDDEN_VALUE;
    }

    return (
        <div className="grid gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Icon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                <span className="flex-1">{label}</span>
                <span className="tabular-nums">
                    {value} <span className="font-medium text-muted-foreground">({percent}%)</span>
                </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-foreground/10">
                <div
                    className={cn("h-full rounded-full", barClass)}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

interface StorageDetailsProps {
    sourceBytes: number;
    clipBytes: number;
    totalBytes: number;
    isHidden: boolean;
}

/** The split between originals and clips, and the ways to the full usage. */
function StorageDetails(props: StorageDetailsProps): ReactNode {
    const { sourceBytes, clipBytes, totalBytes, isHidden } = props;

    return (
        <>
            <StorageRow
                icon={FilmIcon}
                label="Originais"
                bytes={sourceBytes}
                totalBytes={totalBytes}
                barClass="bg-success"
                isHidden={isHidden}
            />
            <StorageRow
                icon={ScissorsIcon}
                label="Cortes"
                bytes={clipBytes}
                totalBytes={totalBytes}
                barClass="bg-primary"
                isHidden={isHidden}
            />
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-1.5">
                <Button asChild variant="secondary" size="sm">
                    <Link to="/account">Ver uso</Link>
                </Button>
                <Button asChild size="sm">
                    <Link to="/videos">
                        Gerenciar
                        <ArrowRightIcon aria-hidden="true" className="size-4" />
                    </Link>
                </Button>
            </div>
        </>
    );
}

interface CardToolProps {
    label: string;
    isPressed?: boolean;
    isExpanded?: boolean;
    controls?: string;
    onClick?: () => void;
    children: ReactNode;
}

/** A small icon button in the card's header, with its name as a tooltip. */
function CardTool(props: CardToolProps): ReactNode {
    const { label, isPressed, isExpanded, controls, onClick, children } = props;

    return (
        <HintTooltip label={label}>
            <Button
                variant="ghost"
                size="icon-xs"
                aria-label={label}
                aria-pressed={isPressed}
                aria-expanded={isExpanded}
                aria-controls={controls}
                onClick={onClick}
                className="text-muted-foreground"
            >
                {children}
            </Button>
        </HintTooltip>
    );
}

/**
 * The foot card (the reference's balance): the disk in use out of the quota, split into the
 * originals and the clips. The eye hides the numbers; the chevron folds the card down to its total,
 * for people who would rather give the sections the room.
 */
export function StorageCard(): ReactNode {
    const usageQuery = useQuery(usageQueryOptions());
    const numbersHidden = useStoredFlag(NUMBERS_HIDDEN_KEY);
    const collapsed = useStoredFlag(COLLAPSED_KEY);
    const isHidden = numbersHidden.isOn;
    const isCollapsed = collapsed.isOn;
    const usage = usageQuery.data;

    if (usage === undefined) {
        return null;
    }

    const storage = usage.storage;
    const totalBytes = storage.totalBytes;
    let usedLabel = formatBytes(totalBytes);
    let eyeLabel = "Esconder os números";
    let foldLabel = "Recolher o armazenamento";

    if (isHidden === true) {
        usedLabel = HIDDEN_VALUE;
        eyeLabel = "Mostrar os números";
    }

    if (isCollapsed === true) {
        foldLabel = "Mostrar o armazenamento";
    }

    return (
        <section
            aria-label="Armazenamento"
            className="grid gap-3 rounded-2xl border border-card-border bg-card p-[11px]"
        >
            <div className="flex items-start gap-1">
                <div className="min-w-0 flex-1">
                    <h2 className="text-xs text-muted-foreground">Armazenamento</h2>
                    <p className="truncate text-xl font-bold tracking-[-0.03em] tabular-nums">
                        {usedLabel}{" "}
                        <span className="text-xs font-semibold tracking-normal text-muted-foreground">
                            de {formatBytes(usage.storageQuotaBytes)}
                        </span>
                    </p>
                </div>
                <CardTool label={eyeLabel} isPressed={isHidden} onClick={numbersHidden.toggle}>
                    {isHidden === true && <EyeOffIcon aria-hidden="true" className="size-4" />}
                    {isHidden === false && <EyeIcon aria-hidden="true" className="size-4" />}
                </CardTool>
                {isCollapsed === false && (
                    <CardTool label="O espaço dos seus vídeos originais e dos cortes prontos">
                        <CircleHelpIcon aria-hidden="true" className="size-4" />
                    </CardTool>
                )}
                <CardTool
                    label={foldLabel}
                    isExpanded={isCollapsed === false}
                    controls={DETAILS_ID}
                    onClick={collapsed.toggle}
                >
                    {isCollapsed === true && (
                        <ChevronUpIcon aria-hidden="true" className="size-4" />
                    )}
                    {isCollapsed === false && (
                        <ChevronDownIcon aria-hidden="true" className="size-4" />
                    )}
                </CardTool>
            </div>
            {isCollapsed === false && (
                <div id={DETAILS_ID} className="grid gap-3">
                    <StorageDetails
                        sourceBytes={storage.sourceBytes}
                        clipBytes={storage.clipBytes}
                        totalBytes={totalBytes}
                        isHidden={isHidden}
                    />
                </div>
            )}
        </section>
    );
}
