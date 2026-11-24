import { useState } from "react";

export interface Steps<Step> {
    index: number;
    current: Step;
    /** The furthest step reached so far; the rail can reopen anything up to it. */
    reachableIndex: number;
    isFirst: boolean;
    isLast: boolean;
    goTo: (index: number) => void;
    goNext: () => void;
    goBack: () => void;
}

export class EmptyStepsError extends Error {
    constructor() {
        super("A stepped dialog needs at least one step.");
        this.name = "EmptyStepsError";
    }
}

/** Where a stepped dialog is, and how far the person has got, clamped to its steps. */
export function useSteps<Step>(steps: ReadonlyArray<Step>, initialIndex: number = 0): Steps<Step> {
    const lastIndex = Math.max(0, steps.length - 1);
    const startIndex = Math.min(lastIndex, Math.max(0, initialIndex));
    const [index, setIndex] = useState(startIndex);
    const [reachableIndex, setReachableIndex] = useState(startIndex);
    const current = steps[index];

    if (current === undefined) {
        throw new EmptyStepsError();
    }

    const goTo = (nextIndex: number): void => {
        if (Number.isInteger(nextIndex) === false || nextIndex < 0 || nextIndex > lastIndex) {
            return;
        }

        setIndex(nextIndex);
        setReachableIndex((reached) => Math.max(reached, nextIndex));
    };

    return {
        index,
        current,
        reachableIndex,
        isFirst: index === 0,
        isLast: index === lastIndex,
        goTo,
        goNext: () => goTo(index + 1),
        goBack: () => goTo(index - 1),
    };
}
