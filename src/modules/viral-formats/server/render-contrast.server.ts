import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildContrastOverlay } from "#/modules/viral-formats/model/contrast-overlay";
import type { ContrastPlan } from "#/modules/viral-formats/model/contrast-plan";
import { cutPresenter } from "#/modules/viral-formats/server/render-presenter.server";
import type { PresenterRenderInput } from "#/modules/viral-formats/server/render-presenter.server";

const OVERLAY_FILE_NAME = "contrast.ass";

interface ContrastRenderInput extends PresenterRenderInput {
    plan: ContrastPlan;
}

export async function renderContrast(input: ContrastRenderInput): Promise<string> {
    const { plan, workDirectory } = input;
    await writeFile(path.join(workDirectory, OVERLAY_FILE_NAME), buildContrastOverlay(plan));
    const outputName = await cutPresenter(input, { overlayName: OVERLAY_FILE_NAME });

    return path.join(workDirectory, outputName);
}
