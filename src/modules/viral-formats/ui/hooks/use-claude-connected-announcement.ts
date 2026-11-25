import { useState } from "react";
import type { ClaudeConnection } from "#/modules/auth/model/claude-connection";

const CONNECTED_ANNOUNCEMENT = "Claude conectado.";

/**
 * What a screen reader hears when Claude connects while the page waits for it. The page only
 * polls, so without this the swap from the steps to the connected card would pass in silence.
 */
export function useClaudeConnectedAnnouncement(connection: ClaudeConnection | undefined): string {
    const [hasWaited, setHasWaited] = useState(false);
    const connectedAt = connection?.connectedAt;

    // Stored during render, as React advises for state that follows earlier renders.
    if (connectedAt === null && hasWaited === false) {
        setHasWaited(true);
    }

    if (hasWaited === false || connectedAt === null || connectedAt === undefined) {
        return "";
    }

    return CONNECTED_ANNOUNCEMENT;
}
