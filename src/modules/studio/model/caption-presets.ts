import type { CaptionColor, CaptionFont } from "#/modules/clips/model/caption-style";
import type { CaptionStyle } from "#/modules/clips/model/clip-format";
import type { StudioDraft } from "#/modules/clips/model/clip-studio";

type PresetSettings = Pick<StudioDraft, "captionStyle" | "captionFont" | "captionColor">;

export interface CaptionPreset {
    id: string;
    label: string;
    description: string;
    settings: PresetSettings;
}

function preset(
    id: string,
    label: string,
    description: string,
    look: { style: CaptionStyle; font: CaptionFont; color: CaptionColor },
): CaptionPreset {
    return {
        id,
        label,
        description,
        settings: { captionStyle: look.style, captionFont: look.font, captionColor: look.color },
    };
}

/** Ready looks, so a first edit is one click; size, position and frame stay as they are. */
export const CAPTION_PRESETS: ReadonlyArray<CaptionPreset> = [
    preset("karaoke", "Karaokê", "Montserrat · amarelo", {
        style: "karaoke",
        font: "montserrat",
        color: "yellow",
    }),
    preset("impact", "Impacto", "Bebas Neue · verde", {
        style: "karaoke",
        font: "bebas-neue",
        color: "green",
    }),
    preset("block", "Bloco", "League Spartan · roxo", {
        style: "karaoke",
        font: "league-spartan",
        color: "purple",
    }),
    preset("classic", "Clássica", "Inter · branca", {
        style: "classic",
        font: "inter",
        color: "white",
    }),
    preset("blue", "Destaque azul", "Montserrat · azul", {
        style: "karaoke",
        font: "montserrat",
        color: "blue",
    }),
    preset("none", "Sem legenda", "Só o vídeo", {
        style: "none",
        font: "montserrat",
        color: "yellow",
    }),
];

/**
 * Whether the draft looks like the preset. Only what shows counts: no captions match "none"
 * whatever the font, and a classic caption has no highlight colour.
 */
export function matchesPreset(draft: PresetSettings, candidate: CaptionPreset): boolean {
    const settings = candidate.settings;

    if (draft.captionStyle !== settings.captionStyle) {
        return false;
    }

    if (settings.captionStyle === "none") {
        return true;
    }

    if (draft.captionFont !== settings.captionFont) {
        return false;
    }

    if (settings.captionStyle === "classic") {
        return true;
    }

    return draft.captionColor === settings.captionColor;
}
