import { useState } from "react";

export interface Steps {
    index: number;
    /** The furthest step reached so far; the rail can reopen anything up to it. */
    reachableIndex: number;
    isFirst: boolean;
    isLast: boolean;
    goTo: (index: number) => void;
    goNext: () => void;
    goBack: () => void;
}

/** Where a stepped dialog is, and how far the person has got, clamped to its steps. */
export function useSteps(total: number, initialIndex: number = 0): Steps {
    const lastIndex = Math.max(0, total - 1);
    const startIndex = Math.min(lastIndex, Math.max(0, initialIndex));
    const [index, setIndex] = useState(startIndex);
    const [reachableIndex, setReachableIndex] = useState(startIndex);

    const goTo = (nextIndex: number): void => {
        if (Number.isInteger(nextIndex) === false || nextIndex < 0 || nextIndex > lastIndex) {
            return;
        }

        setIndex(nextIndex);
        setReachableIndex((reached) => Math.max(reached, nextIndex));
    };

    return {
        index,
        reachableIndex,
        isFirst: index === 0,
        isLast: index === lastIndex,
        goTo,
        goNext: () => goTo(index + 1),
        goBack: () => goTo(index - 1),
    };
}
