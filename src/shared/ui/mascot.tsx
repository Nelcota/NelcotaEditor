import type { CSSProperties } from "react";
import { cn } from "#/shared/ui/cn";

export const MASCOT_COUNT = 32;

/** The green ghost (last tile of the "shapes" sprite) is the brand mark. */
export const BRAND_MASCOT_INDEX = 15;

const MASCOTS_PER_SPRITE = 16;
const SPRITE_COLUMNS = 4;
const FULL_PERCENT = 100;
const SPRITE_TILE_STEP_PERCENT = FULL_PERCENT / (SPRITE_COLUMNS - 1);
const SPRITE_URLS = ["/mascots/shapes.webp", "/mascots/objects.webp"];

/** Each sprite is a 4x4 grid; percentages keep the crop right at any rendered size. */
function toSpriteStyle(index: number): CSSProperties {
    const sprite = Math.floor(index / MASCOTS_PER_SPRITE);
    const tile = index % MASCOTS_PER_SPRITE;
    const column = tile % SPRITE_COLUMNS;
    const row = Math.floor(tile / SPRITE_COLUMNS);

    return {
        backgroundImage: `url(${SPRITE_URLS[sprite]})`,
        backgroundSize: `${SPRITE_COLUMNS * FULL_PERCENT}% ${SPRITE_COLUMNS * FULL_PERCENT}%`,
        backgroundPosition: `${column * SPRITE_TILE_STEP_PERCENT}% ${row * SPRITE_TILE_STEP_PERCENT}%`,
    };
}

interface MascotProps {
    index: number;
    className?: string;
    /** Extra inline style, e.g. an animation delay; the sprite crop always wins. */
    style?: CSSProperties;
}

export function Mascot({ index, className, style }: MascotProps) {
    if (Number.isInteger(index) === false || index < 0 || index >= MASCOT_COUNT) {
        throw new RangeError(`Mascot index must be an integer from 0 to ${MASCOT_COUNT - 1}.`);
    }

    return (
        <span
            aria-hidden="true"
            className={cn("inline-block size-8 shrink-0 bg-no-repeat", className)}
            style={{ ...style, ...toSpriteStyle(index) }}
        />
    );
}
