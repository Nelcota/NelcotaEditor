import { formatDuration, formatInteger } from "#/modules/overview/model/format-metric";
import type { OverviewMetrics } from "#/modules/overview/model/overview-views";

export interface MetricDefinition {
    key: keyof OverviewMetrics;
    label: string;
    help: string;
    format: (value: number) => string;
    unit: string | null;
    betterWhen: "up" | "down";
    isAbsolute: boolean;
    /** Shown under "Sem dados": why the period has nothing to measure. */
    emptyNote: string;
}

export const METRIC_DEFINITIONS: ReadonlyArray<MetricDefinition> = [
    {
        key: "videosSent",
        label: "Vídeos enviados",
        help: "Vídeos enviados no período que já terminaram de processar.",
        format: formatInteger,
        unit: null,
        betterWhen: "up",
        isAbsolute: false,
        emptyNote: "Nenhum vídeo no período",
    },
    {
        key: "clipsReady",
        label: "Cortes gerados",
        help: "Cortes que ficaram prontos no período.",
        format: formatInteger,
        unit: null,
        betterWhen: "up",
        isAbsolute: false,
        emptyNote: "Nenhum corte no período",
    },
    {
        key: "transcribedMinutes",
        label: "Minutos transcritos",
        help: "Duração somada dos vídeos que a Tinta transcreveu.",
        format: formatInteger,
        unit: "min",
        betterWhen: "up",
        isAbsolute: false,
        emptyNote: "Nada transcrito no período",
    },
    {
        key: "averageProcessingSeconds",
        label: "Tempo médio por vídeo",
        help: "Do envio até os cortes ficarem prontos pela primeira vez, nos vídeos concluídos.",
        format: formatDuration,
        unit: null,
        betterWhen: "down",
        isAbsolute: false,
        emptyNote: "Nenhum vídeo concluído no período",
    },
    {
        key: "averageScore",
        label: "Nota média do Brilho",
        help: "Média das notas (0 a 100) que o Brilho deu aos cortes.",
        format: formatInteger,
        unit: "/100",
        betterWhen: "up",
        isAbsolute: false,
        emptyNote: "Nenhum corte no período",
    },
    {
        key: "failures",
        label: "Falhas",
        help: "Vídeos do período que pararam com erro. Os que você cancelou não contam.",
        format: formatInteger,
        unit: null,
        betterWhen: "down",
        isAbsolute: true,
        emptyNote: "Nenhuma falha no período",
    },
];

export function findMetricDefinition(key: keyof OverviewMetrics): MetricDefinition {
    const definition = METRIC_DEFINITIONS.find((candidate) => candidate.key === key);

    if (definition === undefined) {
        throw new Error(`No metric definition for "${key}".`);
    }

    return definition;
}
