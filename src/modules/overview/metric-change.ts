import type { MetricView } from "#/modules/overview/overview-views";

export type ChangeDirection = "up" | "down" | "none";

/** Whether the change is good news for this metric; it picks the colour, not the arrow. */
export type ChangeTone = "good" | "bad" | "neutral";

export interface MetricChange {
    label: string;
    direction: ChangeDirection;
    tone: ChangeTone;
}

const PERCENT = 100;
const NEW_LABEL = "novo";
const UNCHANGED_LABEL = "igual";

const percentFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const countFormatter = new Intl.NumberFormat("pt-BR", { signDisplay: "always" });

function toDirection(difference: number): ChangeDirection {
    if (difference > 0) {
        return "up";
    }

    if (difference < 0) {
        return "down";
    }

    return "none";
}

function toTone(direction: ChangeDirection, betterWhen: ChangeDirection): ChangeTone {
    if (direction === "none") {
        return "neutral";
    }

    if (direction === betterWhen) {
        return "good";
    }

    return "bad";
}

interface ChangeOptions {
    betterWhen: "up" | "down";
    /** Small counts read better as "+2" than as "+200%". */
    isAbsolute: boolean;
}

/** Null when there is nothing to compare: no value in this period. */
export function describeChange(metric: MetricView, options: ChangeOptions): MetricChange | null {
    const current = metric.current;
    const previous = metric.previous;

    if (current === null) {
        return null;
    }

    // Nothing now and nothing before is an empty period, not "unchanged": the card says so instead.
    if (current === 0 && (previous ?? 0) === 0) {
        return null;
    }

    const difference = current - (previous ?? 0);
    const direction = toDirection(difference);
    const tone = toTone(direction, options.betterWhen);

    if (direction === "none") {
        return { label: UNCHANGED_LABEL, direction, tone };
    }

    if (options.isAbsolute === true) {
        return { label: countFormatter.format(difference), direction, tone };
    }

    if (previous === null || previous === 0) {
        return { label: NEW_LABEL, direction: "none", tone: "neutral" };
    }

    const percent = Math.abs((difference / previous) * PERCENT);

    return { label: `${percentFormatter.format(percent)}%`, direction, tone };
}
