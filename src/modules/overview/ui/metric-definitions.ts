import ClockCircleIcon from "~icons/solar/clock-circle-linear";
import DangerTriangleIcon from "~icons/solar/danger-triangle-linear";
import Microphone2Icon from "~icons/solar/microphone-2-linear";
import ScissorsIcon from "~icons/solar/scissors-linear";
import StarIcon from "~icons/solar/star-linear";
import UploadIcon from "~icons/solar/upload-linear";
import { formatDuration, formatInteger } from "#/modules/overview/format-metric";
import type { OverviewMetrics } from "#/modules/overview/overview-views";
import type { IconComponent } from "#/shared/ui/icon-component";

export interface MetricDefinition {
    key: keyof OverviewMetrics;
    label: string;
    icon: IconComponent;
    help: string;
    format: (value: number) => string;
    unit: string | null;
    betterWhen: "up" | "down";
    isAbsolute: boolean;
    /** Shown instead of the value when the period has nothing to measure. */
    emptyNote: string;
}

export const METRIC_DEFINITIONS: ReadonlyArray<MetricDefinition> = [
    {
        key: "videosSent",
        label: "Vídeos enviados",
        icon: UploadIcon,
        help: "Vídeos enviados no período que já terminaram de processar.",
        format: formatInteger,
        unit: null,
        betterWhen: "up",
        isAbsolute: false,
        emptyNote: "nenhum vídeo no período",
    },
    {
        key: "clipsReady",
        label: "Cortes gerados",
        icon: ScissorsIcon,
        help: "Cortes que ficaram prontos no período.",
        format: formatInteger,
        unit: null,
        betterWhen: "up",
        isAbsolute: false,
        emptyNote: "nenhum corte no período",
    },
    {
        key: "transcribedMinutes",
        label: "Minutos transcritos",
        icon: Microphone2Icon,
        help: "Duração somada dos vídeos que a Tinta transcreveu.",
        format: formatInteger,
        unit: "min",
        betterWhen: "up",
        isAbsolute: false,
        emptyNote: "nada transcrito no período",
    },
    {
        key: "averageProcessingSeconds",
        label: "Tempo médio por vídeo",
        icon: ClockCircleIcon,
        help: "Do envio até os cortes ficarem prontos, nos vídeos concluídos.",
        format: formatDuration,
        unit: null,
        betterWhen: "down",
        isAbsolute: false,
        emptyNote: "nenhum vídeo concluído no período",
    },
    {
        key: "averageScore",
        label: "Nota média do Brilho",
        icon: StarIcon,
        help: "Média das notas (0 a 100) que o Brilho deu aos cortes.",
        format: formatInteger,
        unit: "/100",
        betterWhen: "up",
        isAbsolute: false,
        emptyNote: "nenhum corte no período",
    },
    {
        key: "failures",
        label: "Falhas",
        icon: DangerTriangleIcon,
        help: "Vídeos do período que não chegaram ao fim.",
        format: formatInteger,
        unit: null,
        betterWhen: "down",
        isAbsolute: true,
        emptyNote: "nenhuma falha no período",
    },
];
