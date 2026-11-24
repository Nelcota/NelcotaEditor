import { useMutation } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { reportClientProblem } from "#/shared/errors/report-client-problem";

/**
 * An async thing an event starts (a click, a submit, a tab change). DOM handlers cannot await, so
 * `mutate` runs it and keeps the pending state and the failure here instead of in a lost promise.
 */
export function useAsyncAction<Input = void>(
    action: (input: Input) => Promise<unknown>,
): UseMutationResult<unknown, Error, Input> {
    return useMutation({
        mutationFn: action,
        onError: (error) => {
            reportClientProblem("An action started by the page failed", error);
        },
    });
}
