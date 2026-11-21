import MaximizeIcon from "~icons/lucide/maximize";
import PauseIcon from "~icons/lucide-solid/pause";
import PlayIcon from "~icons/lucide-solid/play";
import MinimizeIcon from "~icons/lucide/minimize";
import VolumeXIcon from "~icons/lucide/volume-x";
import Volume2Icon from "~icons/lucide/volume-2";
import type { ReactNode } from "react";
import { ControlButton } from "#/shared/ui/media-player/control-button";
import type { ControlSize } from "#/shared/ui/media-player/control-button";
import type { MediaPlayer } from "#/shared/ui/media-player/use-media-player";

interface PlayerControlProps {
    player: MediaPlayer;
    size?: ControlSize;
}

export function PlayToggleButton({ player, size }: PlayerControlProps): ReactNode {
    if (player.media.isPlaying === true) {
        return (
            <ControlButton
                label="Pausar (K)"
                icon={PauseIcon}
                onClick={player.togglePlay}
                size={size}
            />
        );
    }

    return (
        <ControlButton label="Tocar (K)" icon={PlayIcon} onClick={player.togglePlay} size={size} />
    );
}

export function MuteButton({ player, size }: PlayerControlProps): ReactNode {
    const media = player.media;

    if (media.isMuted === true || media.volume === 0) {
        return (
            <ControlButton
                label="Ligar o som (M)"
                icon={VolumeXIcon}
                onClick={player.toggleMute}
                size={size}
            />
        );
    }

    return (
        <ControlButton
            label="Tirar o som (M)"
            icon={Volume2Icon}
            onClick={player.toggleMute}
            size={size}
        />
    );
}

export function FullscreenButton({ player, size }: PlayerControlProps): ReactNode {
    if (player.isFullscreen === true) {
        return (
            <ControlButton
                label="Sair da tela cheia (F)"
                icon={MinimizeIcon}
                onClick={player.toggleFullscreen}
                size={size}
            />
        );
    }

    return (
        <ControlButton
            label="Tela cheia (F)"
            icon={MaximizeIcon}
            onClick={player.toggleFullscreen}
            size={size}
        />
    );
}
