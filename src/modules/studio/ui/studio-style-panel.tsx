import AlignBottomIcon from "~icons/solar/align-bottom-linear";
import CropMinimalisticIcon from "~icons/solar/crop-minimalistic-linear";
import Pallete2Icon from "~icons/solar/pallete-2-linear";
import SubtitlesIcon from "~icons/solar/subtitles-linear";
import TextBoldIcon from "~icons/solar/text-bold-linear";
import TextFieldIcon from "~icons/solar/text-field-linear";
import type { ReactNode } from "react";
import {
    CAPTION_COLOR_HEX,
    CAPTION_COLOR_LABELS,
    CAPTION_COLORS,
    CAPTION_FONT_FACES,
    CAPTION_FONTS,
    CAPTION_POSITION_LABELS,
    CAPTION_POSITIONS,
    CAPTION_SIZE_LABELS,
    CAPTION_SIZES,
} from "#/modules/clips/caption-style";
import { ASPECT_RATIOS, CAPTION_STYLES } from "#/modules/clips/clip-format";
import type { AspectRatio, CaptionStyle } from "#/modules/clips/clip-format";
import type { StudioEditor } from "#/modules/studio/ui/use-studio-editor";
import type { IconComponent } from "#/shared/ui/icon-component";
import { SegmentedControl } from "#/shared/ui/segmented-control";

const STYLE_LABELS: Record<CaptionStyle, string> = {
    karaoke: "Karaokê",
    classic: "Clássica",
    none: "Sem",
};

const RATIO_LABELS: Record<AspectRatio, string> = {
    vertical: "9:16",
    square: "1:1",
    horizontal: "16:9",
};

const STYLE_OPTIONS = CAPTION_STYLES.map((value) => ({ value, label: STYLE_LABELS[value] }));
// Each name written in its own face, so the choice is made by looking, not by reading.
const FONT_OPTIONS = CAPTION_FONTS.map((value) => {
    const face = CAPTION_FONT_FACES[value];

    return {
        value,
        ariaLabel: face.label,
        label: (
            // Same scale and weight as the preview: condensed Bebas Neue read tiny at 1em.
            <span
                className="uppercase"
                style={{
                    fontFamily: `"${face.family}", sans-serif`,
                    fontSize: `${face.sizeScale}em`,
                    fontWeight: face.previewWeight,
                }}
            >
                {face.label}
            </span>
        ),
    };
});
const RATIO_OPTIONS = ASPECT_RATIOS.map((value) => ({ value, label: RATIO_LABELS[value] }));
const SIZE_OPTIONS = CAPTION_SIZES.map((value) => ({ value, label: CAPTION_SIZE_LABELS[value] }));
const POSITION_OPTIONS = CAPTION_POSITIONS.map((value) => ({
    value,
    label: CAPTION_POSITION_LABELS[value],
}));
const COLOR_OPTIONS = CAPTION_COLORS.map((value) => ({
    value,
    ariaLabel: CAPTION_COLOR_LABELS[value],
    label: (
        <span
            aria-hidden="true"
            className="block size-6 rounded-full border border-black/30"
            style={{ backgroundColor: CAPTION_COLOR_HEX[value] }}
        />
    ),
}));

function FieldLabel({ icon: Icon, children }: { icon: IconComponent; children: string }) {
    return (
        <span className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            {children}
        </span>
    );
}

/** Each name written in its own face, so the choice is made by looking, not by reading. */
function FontPicker({ editor, isLocked }: StudioStylePanelProps): ReactNode {
    const draft = editor.draft;

    // Four fixed fonts: all visible at once, so they can be compared without opening a list.
    return (
        <SegmentedControl
            label="Fonte da legenda"
            value={draft.captionFont}
            options={FONT_OPTIONS}
            disabled={isLocked || draft.captionStyle === "none"}
            onValueChange={(captionFont) => editor.updateSettings({ captionFont })}
            // One per row: in the narrow style panel two columns broke "League Spartan" in half.
            className="grid-flow-row grid-cols-1"
        />
    );
}

interface StudioStylePanelProps {
    editor: StudioEditor;
    isLocked: boolean;
}

/** How the clip looks: caption style, highlight colour, size, position and the frame's shape. */
function StudioStyleFields({ editor, isLocked }: StudioStylePanelProps): ReactNode {
    const draft = editor.draft;

    return (
        <div className="grid gap-5">
            <div className="grid gap-2">
                <FieldLabel icon={SubtitlesIcon}>Legenda</FieldLabel>
                <SegmentedControl
                    label="Legenda"
                    value={draft.captionStyle}
                    options={STYLE_OPTIONS}
                    disabled={isLocked}
                    onValueChange={(captionStyle) => editor.updateSettings({ captionStyle })}
                />
            </div>
            <div className="grid gap-2">
                <FieldLabel icon={Pallete2Icon}>Cor do destaque</FieldLabel>
                <SegmentedControl
                    label="Cor do destaque"
                    value={draft.captionColor}
                    options={COLOR_OPTIONS}
                    disabled={isLocked || draft.captionStyle !== "karaoke"}
                    onValueChange={(captionColor) => editor.updateSettings({ captionColor })}
                    className="[&>button]:h-9 [&>button]:px-0"
                />
            </div>
            <div className="grid gap-2">
                <FieldLabel icon={TextBoldIcon}>Tamanho</FieldLabel>
                <SegmentedControl
                    label="Tamanho da legenda"
                    value={draft.captionSize}
                    options={SIZE_OPTIONS}
                    disabled={isLocked || draft.captionStyle === "none"}
                    onValueChange={(captionSize) => editor.updateSettings({ captionSize })}
                />
            </div>
            <div className="grid gap-2">
                <FieldLabel icon={AlignBottomIcon}>Posição</FieldLabel>
                <SegmentedControl
                    label="Posição da legenda"
                    value={draft.captionPosition}
                    options={POSITION_OPTIONS}
                    disabled={isLocked || draft.captionStyle === "none"}
                    onValueChange={(captionPosition) => editor.updateSettings({ captionPosition })}
                />
            </div>
            <div className="grid gap-2">
                <FieldLabel icon={TextFieldIcon}>Fonte</FieldLabel>
                <FontPicker editor={editor} isLocked={isLocked} />
            </div>
            <div className="grid gap-2">
                <FieldLabel icon={CropMinimalisticIcon}>Formato</FieldLabel>
                <SegmentedControl
                    label="Formato do corte"
                    value={draft.aspectRatio}
                    options={RATIO_OPTIONS}
                    disabled={isLocked}
                    onValueChange={(aspectRatio) => editor.updateSettings({ aspectRatio })}
                />
            </div>
        </div>
    );
}

/** A titled card beside the preview on wide screens; on phones its own tab already names it. */
export function StudioStylePanel({ editor, isLocked }: StudioStylePanelProps): ReactNode {
    return (
        <section
            aria-labelledby="studio-style-title"
            className="@4xl/studio:rounded-2xl @4xl/studio:border @4xl/studio:bg-popover"
        >
            <h2
                id="studio-style-title"
                className="sr-only @4xl/studio:not-sr-only @4xl/studio:flex @4xl/studio:items-center @4xl/studio:gap-2 @4xl/studio:border-b @4xl/studio:px-4 @4xl/studio:py-3 @4xl/studio:text-lg @4xl/studio:leading-tight @4xl/studio:font-semibold"
            >
                <Pallete2Icon
                    className="hidden size-5 text-muted-foreground @4xl/studio:block"
                    aria-hidden="true"
                />
                Estilo
            </h2>
            <div className="@4xl/studio:p-4">
                <StudioStyleFields editor={editor} isLocked={isLocked} />
            </div>
        </section>
    );
}
