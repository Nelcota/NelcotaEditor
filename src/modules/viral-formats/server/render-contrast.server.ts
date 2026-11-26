import { buildContrastOverlay } from "#/modules/viral-formats/model/contrast-overlay";
import type { ContrastPlan } from "#/modules/viral-formats/model/contrast-plan";
import { renderPresenterOverlay } from "#/modules/viral-formats/server/render-presenter.server";
import type { PresenterRenderInput } from "#/modules/viral-formats/server/render-presenter.server";

interface ContrastRenderInput extends PresenterRenderInput {
    plan: ContrastPlan;
}

export async function renderContrast(input: ContrastRenderInput): Promise<string> {
    return await renderPresenterOverlay(input, buildContrastOverlay(input.plan));
}
