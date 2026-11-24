import CheckIcon from "~icons/lucide/check";
import SlidersHorizontalIcon from "~icons/lucide/sliders-horizontal";
import type { CSSProperties, ReactNode } from "react";
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
} from "#/modules/clips/model/caption-style";
import type { CaptionFont } from "#/modules/clips/model/caption-style";
import { ASPECT_RATIOS } from "#/modules/clips/model/clip-format";
import type { AspectRatio } from "#/modules/clips/model/clip-format";
import type { StudioDraft } from "#/modules/clips/model/clip-studio";
import { CAPTION_PRESETS, matchesPreset } from "#/modules/studio/model/caption-presets";
import type { CaptionPreset } from "#/modules/studio/model/caption-presets";
import type { StudioEditor } from "#/modules/studio/ui/hooks/use-studio-editor";
import { cn } from "#/shared/ui/cn";
import { SegmentedControl } from "#/shared/ui/segmented-control";

const RATIO_LABELS: Record<AspectRatio, string> = {
    vertical: "9:16",
    square: "1:1",
    horizontal: "16:9",
};

const FALLBACK_SAMPLE = ["Sua", "legenda"] as const;

/** The face as the worker renders it; condensed faces are scaled up from the base size. */
function fontStyle(font: CaptionFont, baseSize: string): CSSProperties {
    const face = CAPTION_FONT_FACES[font];

    return {
        fontFamily: `"${face.family}", sans-serif`,
        fontSize: `calc(${baseSize} * ${face.sizeScale})`,
        fontWeight: face.previewWeight,
    };
}

function thumbnailStyle(thumbnailUrl: string | null): CSSProperties | undefined {
    if (thumbnailUrl === null) {
        return undefined;
    }

    return { backgroundImage: `url("${thumbnailUrl}")` };
}

// Each name written in its own face, so the choice is made by looking, not by reading.
const FONT_OPTIONS = CAPTION_FONTS.map((value) => ({
    value,
    ariaLabel: CAPTION_FONT_FACES[value].label,
    label: (
        <span className="uppercase" style={fontStyle(value, "1em")}>
            {CAPTION_FONT_FACES[value].label}
        </span>
    ),
}));
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
        // The check, not only the segment's fill, says which colour is on.
        <span
            aria-hidden="true"
            className="grid size-6 place-items-center rounded-full border border-black/30 text-black"
            style={{ backgroundColor: CAPTION_COLOR_HEX[value] }}
        >
            <CheckIcon className="hidden size-4 in-data-[state=checked]:block" />
        </span>
    ),
}));

interface StudioStylePanelProps {
    editor: StudioEditor;
    isLocked: boolean;
    /** The video's own frame behind each preset, so the looks are judged on real footage. */
    thumbnailUrl: string | null;
}

/** The first two spoken words of the clip, to show each look with the clip's own words. */
function readSampleWords(draft: StudioDraft): readonly [string, string] {
    const firstCue = draft.cues[0];

    if (firstCue === undefined) {
        return FALLBACK_SAMPLE;
    }

    const [first, second] = firstCue.words;

    if (first === undefined || second === undefined) {
        return FALLBACK_SAMPLE;
    }

    return [first.text, second.text];
}

interface PresetSampleProps {
    preset: CaptionPreset;
    words: readonly [string, string];
}

function PresetSample({ preset, words }: PresetSampleProps): ReactNode {
    const settings = preset.settings;

    if (settings.captionStyle === "none") {
        return null;
    }

    let highlight = "#FFFFFF";

    if (settings.captionStyle === "karaoke") {
        highlight = CAPTION_COLOR_HEX[settings.captionColor];
    }

    return (
        <span
            className="relative px-2 text-center leading-none whitespace-nowrap text-white uppercase [-webkit-text-stroke:4px_#000] [paint-order:stroke]"
            style={fontStyle(settings.captionFont, "min(16px, 13cqw)")}
        >
            {words[0]} <span style={{ color: highlight }}>{words[1]}</span>
        </span>
    );
}

interface PresetCardProps extends PresetSampleProps {
    thumbnailUrl: string | null;
    isSelected: boolean;
    isLocked: boolean;
    onPick: () => void;
}

function PresetCard(props: PresetCardProps): ReactNode {
    const { preset, thumbnailUrl, isSelected } = props;

    return (
        <button
            type="button"
            aria-pressed={isSelected}
            disabled={props.isLocked}
            onClick={props.onPick}
            className="group grid gap-1.5 rounded-xl text-start outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 motion-safe:enabled:active:scale-[0.99]"
        >
            <span
                aria-hidden="true"
                className={cn(
                    "@container relative isolate grid h-22 place-items-center overflow-hidden rounded-xl bg-stage bg-cover bg-center transition-shadow before:absolute before:inset-0 before:-z-10 before:bg-black/30 group-hover:ring-2 group-hover:ring-border",
                    isSelected === true &&
                        "ring-2 ring-foreground ring-offset-2 ring-offset-background group-hover:ring-foreground",
                )}
                style={thumbnailStyle(thumbnailUrl)}
            >
                <PresetSample preset={preset} words={props.words} />
                {isSelected === true && (
                    <span className="absolute top-1.5 right-1.5 grid size-5.5 place-items-center rounded-full bg-background text-foreground">
                        <CheckIcon className="size-3.5" aria-hidden="true" />
                    </span>
                )}
            </span>
            <span className="text-sm leading-tight font-medium">
                {preset.label}
                <span className="block text-xs font-normal text-muted-foreground">
                    {preset.description}
                </span>
            </span>
        </button>
    );
}

function PresetGrid({ editor, isLocked, thumbnailUrl }: StudioStylePanelProps): ReactNode {
    const draft = editor.draft;
    const words = readSampleWords(draft);

    return (
        <fieldset aria-label="Estilos prontos" className="grid min-w-0 grid-cols-3 gap-3">
            {CAPTION_PRESETS.map((preset) => (
                <PresetCard
                    key={preset.id}
                    preset={preset}
                    words={words}
                    thumbnailUrl={thumbnailUrl}
                    isSelected={matchesPreset(draft, preset)}
                    isLocked={isLocked}
                    onPick={() => editor.updateSettings(preset.settings)}
                />
            ))}
        </fieldset>
    );
}

function FineRow({ label, children }: { label: string; children: ReactNode }): ReactNode {
    return (
        <div className="grid gap-2 border-t px-4 py-3 @sm/fine:grid-cols-[112px_minmax(0,1fr)] @sm/fine:items-center">
            <span className="text-sm text-muted-foreground">{label}</span>
            {children}
        </div>
    );
}

/** The details a preset sets in bulk, one by one: colour, size, position, font and frame. */
function FineTuning({ editor, isLocked }: Omit<StudioStylePanelProps, "thumbnailUrl">) {
    const draft = editor.draft;
    const hasCaptions = draft.captionStyle !== "none";

    return (
        <section aria-labelledby="studio-fine-title" className="@container/fine rounded-2xl border">
            <h2
                id="studio-fine-title"
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold"
            >
                <SlidersHorizontalIcon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                />
                Ajuste fino
            </h2>
            <FineRow label="Destaque">
                <SegmentedControl
                    label="Cor do destaque"
                    value={draft.captionColor}
                    options={COLOR_OPTIONS}
                    disabled={isLocked || draft.captionStyle !== "karaoke"}
                    onValueChange={(captionColor) => editor.updateSettings({ captionColor })}
                    className="[&>button]:h-9 [&>button]:px-0"
                />
                {draft.captionStyle !== "karaoke" && (
                    <p className="text-xs text-muted-foreground @sm/fine:col-start-2">
                        Só o estilo Karaokê destaca a palavra falada.
                    </p>
                )}
            </FineRow>
            <FineRow label="Tamanho">
                <SegmentedControl
                    label="Tamanho da legenda"
                    value={draft.captionSize}
                    options={SIZE_OPTIONS}
                    disabled={isLocked || hasCaptions === false}
                    onValueChange={(captionSize) => editor.updateSettings({ captionSize })}
                />
            </FineRow>
            <FineRow label="Posição">
                <SegmentedControl
                    label="Posição da legenda"
                    value={draft.captionPosition}
                    options={POSITION_OPTIONS}
                    disabled={isLocked || hasCaptions === false}
                    onValueChange={(captionPosition) => editor.updateSettings({ captionPosition })}
                />
            </FineRow>
            <FineRow label="Fonte">
                <SegmentedControl
                    label="Fonte da legenda"
                    value={draft.captionFont}
                    options={FONT_OPTIONS}
                    disabled={isLocked || hasCaptions === false}
                    onValueChange={(captionFont) => editor.updateSettings({ captionFont })}
                    className="grid-flow-row grid-cols-2"
                />
            </FineRow>
            <FineRow label="Formato">
                <SegmentedControl
                    label="Formato do corte"
                    value={draft.aspectRatio}
                    options={RATIO_OPTIONS}
                    disabled={isLocked}
                    onValueChange={(aspectRatio) => editor.updateSettings({ aspectRatio })}
                />
            </FineRow>
        </section>
    );
}

/** The Estilo step: a ready look in one click, then the details if wanted. */
export function StudioStylePanel(props: StudioStylePanelProps): ReactNode {
    return (
        <div className="grid gap-5">
            <PresetGrid {...props} />
            <FineTuning editor={props.editor} isLocked={props.isLocked} />
        </div>
    );
}
