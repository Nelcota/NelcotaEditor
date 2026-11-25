import type { VideoSource, VideoStatus } from "#/modules/video-records/model/video-status";

export const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
    queued: "Na fila",
    downloading: "Baixando o vídeo",
    transcribing: "Transcrevendo o áudio",
    selecting: "Escolhendo os melhores momentos",
    rendering: "Renderizando os cortes",
    done: "Pronto",
    failed: "Falhou",
    cancelled: "Cancelado",
};

interface ProcessingStep {
    status: VideoStatus;
    label: string;
}

/**
 * The steps shown to the user, in order. Every source downloads: a link from YouTube, a file from
 * storage before each run.
 */
export const PROCESSING_STEPS: ReadonlyArray<ProcessingStep> = [
    { status: "downloading", label: "Download" },
    { status: "transcribing", label: "Transcrição" },
    { status: "selecting", label: "Melhores momentos" },
    { status: "rendering", label: "Cortes com legenda" },
];

export const VIDEO_SOURCE_LABELS: Record<VideoSource, string> = {
    youtube: "YouTube",
    upload: "Arquivo",
};
