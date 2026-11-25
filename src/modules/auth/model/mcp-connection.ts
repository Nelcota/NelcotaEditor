/** Where the MCP endpoint lives; its full URL is the resource Claude's tokens are bound to. */
export const MCP_PATH = "/api/mcp";

/** The page Better Auth sends Claude's sign-in to; it signs the person in and resumes. */
export const CLAUDE_CONNECT_PATH = "/oauth/sign-in";

/** The page that asks the person to let Claude use their account. */
export const CLAUDE_CONSENT_PATH = "/oauth/consent";

/** Identity for the consent page and a refresh token so Claude stays connected. */
export const MCP_SCOPES = ["openid", "profile", "offline_access"] as const;

/** Spoken on the consent page, one line per scope the person grants. */
export const MCP_SCOPE_DESCRIPTIONS: Readonly<Record<(typeof MCP_SCOPES)[number], string>> = {
    openid: "Saber qual é a sua conta do Editor Oculto",
    profile: "Ver o seu nome",
    offline_access: "Continuar conectado até você desconectar",
};

/** "https://app.example" → "https://app.example/api/mcp", with no doubled slash. */
export function toMcpResource(appUrl: string): string {
    if (appUrl.trim().length === 0) {
        throw new Error("The app URL is needed to build the MCP resource");
    }

    return new URL(MCP_PATH, appUrl).toString();
}
