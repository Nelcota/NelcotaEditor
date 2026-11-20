import FullScreenBoldIcon from "~icons/solar/full-screen-bold";
import PauseBoldIcon from "~icons/solar/pause-bold";
import PlayBoldIcon from "~icons/solar/play-bold";
import QuitFullScreenBoldIcon from "~icons/solar/quit-full-screen-bold";
import VolumeCrossBoldIcon from "~icons/solar/volume-cross-bold";
import VolumeLoudBoldIcon from "~icons/solar/volume-loud-bold";
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
                icon={PauseBoldIcon}
                onClick={player.togglePlay}
                size={size}
            />
        );
    }

    return (
        <ControlButton
            label="Tocar (K)"
            icon={PlayBoldIcon}
            onClick={player.togglePlay}
            size={size}
        />
    );
}

export function MuteButton({ player, size }: PlayerControlProps): ReactNode {
    const media = player.media;

    if (media.isMuted === true || media.volume === 0) {
        return (
            <ControlButton
                label="Ligar o som (M)"
                icon={VolumeCrossBoldIcon}
                onClick={player.toggleMute}
                size={size}
            />
        );
    }

    return (
        <ControlButton
            label="Tirar o som (M)"
            icon={VolumeLoudBoldIcon}
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
                icon={QuitFullScreenBoldIcon}
                onClick={player.toggleFullscreen}
                size={size}
            />
        );
    }

    return (
        <ControlButton
            label="Tela cheia (F)"
            icon={FullScreenBoldIcon}
            onClick={player.toggleFullscreen}
            size={size}
        />
    );
}
