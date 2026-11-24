import { useAsyncAction } from "#/shared/ui/use-async-action";

function settle(promise: Promise<unknown>): Promise<unknown> {
    return promise;
}

/**
 * For event handlers that start async work. The work starts inside the handler, so browser APIs
 * that need the click (play, full screen, clipboard) and `preventDefault` still run in time; the
 * promise is then handed to a mutation, which keeps its failure instead of dropping it.
 */
export function useTrackPromise(): (promise: Promise<unknown>) => void {
    const tracker = useAsyncAction(settle);

    // `mutate` keeps its identity across renders, so effects can list it as a dependency.
    return tracker.mutate;
}
