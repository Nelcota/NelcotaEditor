import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { buildRankingOverlay } from "#/modules/viral-formats/model/ranking-overlay";
import type { RankingPlan } from "#/modules/viral-formats/model/ranking-plan";
import { renderPresenterOverlay } from "#/modules/viral-formats/server/render-presenter.server";
import type { PresenterRenderInput } from "#/modules/viral-formats/server/render-presenter.server";

interface RankingRenderInput extends PresenterRenderInput {
    plan: RankingPlan;
    words: ReadonlyArray<TranscriptWord>;
}

export async function renderRanking(input: RankingRenderInput): Promise<string> {
    const { plan, words } = input;
    return await renderPresenterOverlay(input, buildRankingOverlay(plan, words));
}
