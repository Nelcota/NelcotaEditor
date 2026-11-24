export const ASPECT_RATIOS = ["vertical", "square", "horizontal"] as const;

export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export interface FrameSize {
    width: number;
    height: number;
}

export const ASPECT_RATIO_SIZES: Record<AspectRatio, FrameSize> = {
    vertical: { width: 1080, height: 1920 },
    square: { width: 1080, height: 1080 },
    horizontal: { width: 1920, height: 1080 },
};

export const CAPTION_STYLES = ["karaoke", "classic", "none"] as const;

export type CaptionStyle = (typeof CAPTION_STYLES)[number];

export const DEFAULT_ASPECT_RATIO: AspectRatio = "vertical";
export const DEFAULT_CAPTION_STYLE: CaptionStyle = "karaoke";
