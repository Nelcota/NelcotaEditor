export const CAPTION_COLORS = ["yellow", "green", "red", "blue", "purple", "white"] as const;

export type CaptionColor = (typeof CAPTION_COLORS)[number];

/** The highlighted word's colour. Yellow stays the default: it reads best over any video frame. */
export const CAPTION_COLOR_HEX: Record<CaptionColor, string> = {
    yellow: "#FFE500",
    green: "#2CC056",
    red: "#FF4D4D",
    blue: "#38BDF8",
    purple: "#C084FC",
    white: "#FFFFFF",
};

export const CAPTION_COLOR_LABELS: Record<CaptionColor, string> = {
    yellow: "Amarelo",
    green: "Verde",
    red: "Vermelho",
    blue: "Azul",
    purple: "Roxo",
    white: "Branco",
};

export const CAPTION_SIZES = ["small", "medium", "large"] as const;

export type CaptionSize = (typeof CAPTION_SIZES)[number];

export const CAPTION_SIZE_LABELS: Record<CaptionSize, string> = {
    small: "P",
    medium: "M",
    large: "G",
};

export const CAPTION_SIZE_SCALES: Record<CaptionSize, number> = {
    small: 0.8,
    medium: 1,
    large: 1.2,
};

export const CAPTION_POSITIONS = ["top", "middle", "bottom"] as const;

export type CaptionPosition = (typeof CAPTION_POSITIONS)[number];

export const CAPTION_POSITION_LABELS: Record<CaptionPosition, string> = {
    top: "Cima",
    middle: "Meio",
    bottom: "Baixo",
};

export const DEFAULT_CAPTION_COLOR: CaptionColor = "yellow";
export const DEFAULT_CAPTION_SIZE: CaptionSize = "medium";
export const DEFAULT_CAPTION_POSITION: CaptionPosition = "bottom";

export const CAPTION_FONTS = ["montserrat", "bebas-neue", "league-spartan", "inter"] as const;

export type CaptionFont = (typeof CAPTION_FONTS)[number];

export interface CaptionFontFace {
    /** The family name both libass (fontconfig) and the browser know it by. */
    family: string;
    label: string;
    /** Whether the subtitles ask libass for the family's bold face. */
    isBold: boolean;
    /**
     * The browser weight that looks like what the worker renders. Debian's Bebas Neue "Bold" is the
     * classic Bebas, which Google Fonts ships as its only (400) weight.
     */
    previewWeight: number;
    /** Condensed faces read smaller at the same size, so they are scaled up to match. */
    sizeScale: number;
}

export const CAPTION_FONT_FACES: Record<CaptionFont, CaptionFontFace> = {
    montserrat: {
        family: "Montserrat",
        label: "Montserrat",
        isBold: true,
        previewWeight: 700,
        sizeScale: 1,
    },
    "bebas-neue": {
        family: "Bebas Neue",
        label: "Bebas Neue",
        isBold: true,
        previewWeight: 400,
        sizeScale: 1.25,
    },
    "league-spartan": {
        family: "League Spartan",
        label: "League Spartan",
        isBold: true,
        previewWeight: 700,
        sizeScale: 1.05,
    },
    inter: { family: "Inter", label: "Inter", isBold: true, previewWeight: 700, sizeScale: 1 },
};

export const DEFAULT_CAPTION_FONT: CaptionFont = "montserrat";
