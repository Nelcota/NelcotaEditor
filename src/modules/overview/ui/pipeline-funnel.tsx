import FilterIcon from "~icons/solar/filter-linear";
import { EMPTY_VALUE, formatInteger } from "#/modules/overview/format-metric";
import { buildFunnelPath } from "#/modules/overview/funnel-shape";
import type { OverviewFunnel } from "#/modules/overview/overview-views";

const SHAPE_SIZE = { width: 400, height: 140 };
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

function FunnelSummary({ funnel, clipCount }: { funnel: OverviewFunnel; clipCount: number }) {
    const items = [
        { value: formatInteger(funnel.sent), label: "vídeos enviados" },
        { value: formatShare(funnel.ready, funnel.sent), label: "chegaram aos cortes" },
        { value: formatInteger(clipCount), label: "cortes prontos" },
    ];

    return (
        <dl className="grid grid-cols-3 gap-4">
            {items.map((item) => (
                <div key={item.label} className="flex flex-col-reverse">
                    <dt className="text-xs text-muted-foreground">{item.label}</dt>
                    <dd className="text-2xl font-extrabold tracking-tight tabular-nums">
                        {item.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export function PipelineFunnel({
    funnel,
    clipCount,
}: {
    funnel: OverviewFunnel;
    clipCount: number;
}) {
    const counts = STAGES.map((stage) => funnel[stage.key]);
    const path = buildFunnelPath(counts, SHAPE_SIZE);

    return (
        <section className="grid min-w-0 content-start gap-5 rounded-2xl border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                    <FilterIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                    Do envio ao corte
                </h2>
                <span className="text-sm text-muted-foreground">vídeos por etapa</span>
            </div>
            <FunnelSummary funnel={funnel} clipCount={clipCount} />
            <div className="relative">
                <ol className="grid grid-cols-4">
                    {STAGES.map((stage) => (
                        <li key={stage.key} className="grid gap-2 border-l border-dashed pl-2">
                            <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">
                                {formatShare(funnel[stage.key], funnel.sent)}
                            </span>
                            <span className="h-[140px]" />
                            <span className="grid">
                                <strong className="text-sm tabular-nums">
                                    {formatInteger(funnel[stage.key])}
                                </strong>
                                <span className="text-xs leading-tight text-muted-foreground">
                                    {stage.label}
                                </span>
                            </span>
                        </li>
                    ))}
                </ol>
                <svg
                    aria-hidden="true"
                    viewBox={`0 0 ${SHAPE_SIZE.width} ${SHAPE_SIZE.height}`}
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-x-0 top-[30px] h-[140px] w-full"
                >
                    <path
                        d={path}
                        className="fill-chart-current/45 stroke-chart-current"
                        strokeWidth={1.5}
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            </div>
        </section>
    );
}
