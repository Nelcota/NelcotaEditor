import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { buildHackingOverlay } from "#/modules/viral-formats/model/hacking-overlay";
import type { HackingPlan } from "#/modules/viral-formats/model/hacking-plan";
import { renderPresenterOverlay } from "#/modules/viral-formats/server/render-presenter.server";
import type { PresenterRenderInput } from "#/modules/viral-formats/server/render-presenter.server";

interface HackingRenderInput extends PresenterRenderInput {
    plan: HackingPlan;
    words: ReadonlyArray<TranscriptWord>;
}

export async function renderHacking(input: HackingRenderInput): Promise<string> {
    const { plan, words } = input;
    return await renderPresenterOverlay(input, buildHackingOverlay(plan, words));
}
