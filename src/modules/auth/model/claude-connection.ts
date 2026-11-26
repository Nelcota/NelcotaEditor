/** Etapa 1's view of the person's Claude: where to point it and whether it is connected. */
export interface ClaudeConnection {
    /** The address the person pastes into Claude as a custom connector. */
    mcpUrl: string;
    /** When the person first let Claude in; null while no Claude is connected. */
    connectedAt: string | null;
}
