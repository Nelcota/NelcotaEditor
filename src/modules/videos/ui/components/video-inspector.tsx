import CalendarIcon from "~icons/lucide/calendar";
import ClockIcon from "~icons/lucide/clock";
import FileTextIcon from "~icons/lucide/file-text";
import DownloadIcon from "~icons/lucide/download";
import PenIcon from "~icons/lucide/pen";
import PlayIcon from "~icons/lucide/play";
import ScissorsIcon from "~icons/lucide/scissors";
import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
import TimerIcon from "~icons/lucide/timer";
import TrashIcon from "~icons/lucide/trash";
import UploadIcon from "~icons/lucide/upload";
import SquarePlayIcon from "~icons/lucide/square-play";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { CLIP_LENGTH_LABELS } from "#/modules/preferences/model/preferences";
import { isVideoFinished, isVideoWorking } from "#/modules/video-records/model/video-status";
import type { VideoDetails, VideoSummary } from "#/modules/videos/model/video-views";
import { countClipTotal } from "#/modules/videos/model/clip-ranking";
import {
    INSPECTOR_LINK_ROW_CLASS,
    InspectorButtonRow,
    InspectorGroup,
    InspectorRow,
    InspectorRowContent,
} from "#/modules/videos/ui/components/inspector-rows";
import { VideoDialogs } from "#/modules/videos/ui/components/video-dialogs";
import type { VideoDialog } from "#/modules/videos/ui/components/video-dialogs";
import { VideoMascot } from "#/modules/videos/ui/components/video-mascot";
import { VIDEO_SOURCE_LABELS } from "#/modules/videos/model/video-status-labels";
import { VideoStatusBadge } from "#/modules/videos/ui/components/video-status-badge";
import { formatClock, formatDate } from "#/shared/ui/format";

const SECURE_URL_PREFIX = "https://";

/** The video's mascot large and centred, its state under it, like a profile. */
function InspectorIdentity({ video }: { video: VideoSummary }): ReactNode {
    return (
        <div className="grid justify-items-center gap-2">
            <VideoMascot videoId={video.id} className="size-16" />
            <VideoStatusBadge status={video.status} />
        </div>
    );
}

/** The name in a field-shaped box; renaming opens from it once the video is finished. */
function NameField({ video, onRename }: { video: VideoSummary; onRename: () => void }) {
    return (
        <div className="grid gap-2">
            <h3 className="px-1 text-sm text-muted-foreground">Nome</h3>
            <button
                type="button"
                onClick={onRename}
                disabled={isVideoFinished(video.status) === false}
                aria-label={`Renomear: ${video.title}`}
                className="min-h-12 rounded-xl border bg-background px-4 py-3 text-start text-base leading-snug [overflow-wrap:anywhere] outline-none transition-[border-color,box-shadow] hover:border-ring/50 focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-default disabled:hover:border-border"
            >
                {video.title}
            </button>
        </div>
    );
}

function SourceRow({ video }: { video: VideoSummary }): ReactNode {
    const sourceUrl = video.sourceUrl;
    const sourceLabel = VIDEO_SOURCE_LABELS[video.source];

    if (sourceUrl === null || sourceUrl.startsWith(SECURE_URL_PREFIX) === false) {
        return <InspectorRow icon={UploadIcon} label="Fonte" value={sourceLabel} />;
    }

    return (
        <li>
            <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={INSPECTOR_LINK_ROW_CLASS}
            >
                <InspectorRowContent icon={PlayIcon} label="Fonte" value={sourceLabel} />
                <ArrowUpRightIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground"
                />
            </a>
        </li>
    );
}

function OriginGroup({ video }: { video: VideoSummary }): ReactNode {
    const durationSeconds = video.durationSeconds;

    return (
        <InspectorGroup title="Origem">
            <SourceRow video={video} />
            <InspectorRow icon={CalendarIcon} label="Enviado" value={formatDate(video.createdAt)} />
            {durationSeconds !== null && (
                <InspectorRow
                    icon={ClockIcon}
                    label="Duração"
                    value={formatClock(durationSeconds)}
                />
            )}
        </InspectorGroup>
    );
}

function FilesGroup({ video }: { video: VideoSummary }): ReactNode {
    const originalFileUrl = video.originalFileUrl;

    return (
        <InspectorGroup title="Arquivos">
            <li>
                <Link
                    to="/videos/$videoId"
                    params={{ videoId: video.id }}
                    search={{ tab: "original" }}
                    className={INSPECTOR_LINK_ROW_CLASS}
                >
                    <InspectorRowContent icon={SquarePlayIcon} label="Vídeo original" hasChevron />
                </Link>
            </li>
            <li>
                <Link
                    to="/videos/$videoId"
                    params={{ videoId: video.id }}
                    search={{ tab: "original" }}
                    hash="transcricao"
                    className={INSPECTOR_LINK_ROW_CLASS}
                >
                    <InspectorRowContent icon={FileTextIcon} label="Transcrição" hasChevron />
                </Link>
            </li>
            {originalFileUrl !== null && (
                <li>
                    <a href={originalFileUrl} download className={INSPECTOR_LINK_ROW_CLASS}>
                        <InspectorRowContent icon={DownloadIcon} label="Baixar o original" />
                    </a>
                </li>
            )}
        </InspectorGroup>
    );
}

interface VideoInspectorProps {
    details: VideoDetails;
}

/**
 * The right panel of a video, read like a profile: who it is, what came out, where it came from,
 * its files and the rare actions. Lines: cards 24px in, row text 16px in from the card, titles 4px in.
 */
export function VideoInspector({ details }: VideoInspectorProps): ReactNode {
    const video = details.video;
    const [openDialog, setOpenDialog] = useState<VideoDialog | null>(null);
    const isWorking = isVideoWorking(video.status);

    return (
        <div className="grid gap-6">
            <InspectorIdentity video={video} />
            <NameField video={video} onRename={() => setOpenDialog("rename")} />
            <InspectorGroup title="Cortes">
                <InspectorRow
                    icon={ScissorsIcon}
                    label="Cortes prontos"
                    value={`${video.readyClipCount} de ${countClipTotal(details)}`}
                />
                <InspectorRow
                    icon={TimerIcon}
                    label="Duração dos cortes"
                    value={CLIP_LENGTH_LABELS[video.clipLength]}
                />
            </InspectorGroup>
            <OriginGroup video={video} />
            <FilesGroup video={video} />
            <InspectorGroup title="Ações">
                <InspectorButtonRow
                    icon={PenIcon}
                    label="Renomear"
                    hasChevron
                    isDisabled={isVideoFinished(video.status) === false}
                    onClick={() => setOpenDialog("rename")}
                />
                <InspectorButtonRow
                    icon={TrashIcon}
                    label="Excluir vídeo"
                    isDestructive
                    isDisabled={isWorking}
                    onClick={() => setOpenDialog("delete")}
                />
            </InspectorGroup>
            <VideoDialogs
                video={video}
                openDialog={openDialog}
                onClose={() => setOpenDialog(null)}
            />
        </div>
    );
}
