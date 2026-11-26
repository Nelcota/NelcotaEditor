import { hasSubscriberAccess } from "#/modules/billing/server/subscription-queries.server";
import { InvalidEditPlanError } from "#/modules/viral-formats/model/edit-errors";
import { VIRAL_FORMATS } from "#/modules/viral-formats/model/viral-formats";
import type { ViralFormatId } from "#/modules/viral-formats/model/viral-formats";

/** Subscriber formats edit only for someone whose paid days have not run out. */
export async function assertFormatAvailable(
    userId: string,
    formatId: ViralFormatId,
): Promise<void> {
    const format = VIRAL_FORMATS.find((candidate) => candidate.id === formatId);

    if (format === undefined) {
        throw new Error(`Unknown viral format: ${formatId}`);
    }

    if (format.access === "free") {
        return;
    }

    if ((await hasSubscriberAccess(userId)) === true) {
        return;
    }

    throw new InvalidEditPlanError(
        `${format.name} is for Editor Oculto subscribers. Tell the person they can subscribe on the Formatos Virais page.`,
    );
}
