import FilterIcon from "~icons/solar/filter-linear";
import { EMPTY_VALUE, formatInteger } from "#/modules/overview/format-metric";
import type { OverviewFunnel } from "#/modules/overview/overview-views";

const PERCENT = 100;

const STAGES: ReadonlyArray<{ key: keyof OverviewFunnel; label: string }> = [
    { key: "sent", label: "Enviados" },
    { key: "transcribed", label: "Transcritos" },
    { key: "selected", label: "Momentos escolhidos" },
    { key: "ready", label: "Cortes prontos" },
];

function formatShare(count: number, total: number): string {
    if (total === 0) {
        return EMPTY_VALUE;
    }

    return `${Math.round((count / total) * PERCENT)}%`;
}

/** Videos per stage as four numbers: a shape with equal bars said less than the counts do. */
export function PipelineFunnel({ funnel }: { funnel: OverviewFunnel }) {
    const readyShare = formatShare(funnel.ready, funnel.sent);

    return (
        <section className="@container/funnel grid min-w-0 content-start gap-4 rounded-2xl border bg-popover p-4 sm:p-5">
            <div className="grid gap-1">
                <h2 className="flex items-center gap-2 text-lg leading-tight font-extrabold">
                    <FilterIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                    Do envio ao corte
                </h2>
                <p className="text-sm text-muted-foreground">
                    Vídeos por etapa ·{" "}
                    <strong className="font-semibold text-foreground tabular-nums">
                        {readyShare}
                    </strong>{" "}
                    chegaram aos cortes
                </p>
            </div>
            <ol className="grid grid-cols-2 gap-2 @md/funnel:grid-cols-4">
                {STAGES.map((stage) => (
                    <li
                        key={stage.key}
                        className="grid content-start gap-0.5 rounded-xl border-t-[3px] border-chart-current bg-background px-3 py-2.5"
                    >
                        <p className="flex items-baseline gap-2">
                            <strong className="text-2xl font-extrabold tracking-tight tabular-nums">
                                {formatInteger(funnel[stage.key])}
                            </strong>
                            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                                {formatShare(funnel[stage.key], funnel.sent)}
                            </span>
                        </p>
                        <span className="text-meta leading-snug text-muted-foreground">
                            {stage.label}
                        </span>
                    </li>
                ))}
            </ol>
        </section>
    );
}
