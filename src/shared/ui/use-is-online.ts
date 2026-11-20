import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

function subscribeToConnection(onChange: () => void): () => void {
    return onlineManager.subscribe(onChange);
}

function readIsOnline(): boolean {
    return onlineManager.isOnline();
}

/** The server always renders as online; the browser corrects it after hydration. */
function readIsOnlineOnServer(): boolean {
    return true;
}

/** The same online state TanStack Query uses to pause and resume requests. */
export function useIsOnline(): boolean {
    return useSyncExternalStore(subscribeToConnection, readIsOnline, readIsOnlineOnServer);
}
