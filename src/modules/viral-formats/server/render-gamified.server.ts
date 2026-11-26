import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { FRAME_HEIGHT, FRAME_WIDTH } from "#/modules/viral-formats/model/ass-overlay";
import { buildGamifiedOverlay } from "#/modules/viral-formats/model/gamified-overlay";
import type { GamifiedHighlight, GamifiedPlan } from "#/modules/viral-formats/model/gamified-plan";
import { measureCutSeconds } from "#/modules/viral-formats/model/presenter-plan";
import {
    FRAMES_PER_SECOND,
    renderPresenterOverlay,
    toRenderSeconds,
} from "#/modules/viral-formats/server/render-presenter.server";
import type { PresenterRenderInput } from "#/modules/viral-formats/server/render-presenter.server";

const PUNCH_IN_RATIO = 0.16;
const PUNCH_SECONDS = 0.8;
const VERTICAL_ANCHOR = 0.4;
const CHIME_SECONDS = 0.18;
const CHIME_ATTACK_SECONDS = 0.015;
const CHIME_GAIN = 0.055;
const CHIME_BASE_FREQUENCY = 660;
const CHIME_FREQUENCY_RISE = 750;
const CHIME_SAMPLE_RATE = 48_000;

interface GamifiedRenderInput extends PresenterRenderInput {
    plan: GamifiedPlan;
    words: ReadonlyArray<TranscriptWord>;
}

function buildPunchFilter(highlights: ReadonlyArray<GamifiedHighlight>): string {
    const envelopes = highlights.map(({ start, end }) => {
        const stop = Math.min(end, start + PUNCH_SECONDS);
        const at = toRenderSeconds(start);
        const until = toRenderSeconds(stop);
        return `if(between(ot,${at},${until}),(${until}-ot)/(${until}-${at}),0)`;
    });
    const zoom = `1+${PUNCH_IN_RATIO}*(${envelopes.join("+")})`;

    return `zoompan=z='${zoom}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*${VERTICAL_ANCHOR}':d=1:s=${FRAME_WIDTH}x${FRAME_HEIGHT}:fps=${FRAMES_PER_SECOND}`;
}

function buildSoundSource(plan: GamifiedPlan): string {
    const tones = plan.highlights.map(({ start }) => {
        const at = toRenderSeconds(start);
        const until = toRenderSeconds(start + CHIME_SECONDS);
        const progress = `(t-${at})`;
        const envelope = `min(${progress}/${CHIME_ATTACK_SECONDS},1)*(1-${progress}/${CHIME_SECONDS})`;
        const tone = `sin(2*PI*(${CHIME_BASE_FREQUENCY}+${CHIME_FREQUENCY_RISE}*${progress})*${progress})`;
        return `if(between(t,${at},${until}),${CHIME_GAIN}*${envelope}*${tone},0)`;
    });
    const duration = toRenderSeconds(measureCutSeconds(plan.takes));

    return `aevalsrc=exprs='${tones.join("+")}':s=${CHIME_SAMPLE_RATE}:d=${duration}`;
}

export async function renderGamified(input: GamifiedRenderInput): Promise<string> {
    const { plan, words } = input;
    return await renderPresenterOverlay(input, buildGamifiedOverlay(plan, words), {
        videoFilter: buildPunchFilter(plan.highlights),
        soundSource: buildSoundSource(plan),
    });
}
