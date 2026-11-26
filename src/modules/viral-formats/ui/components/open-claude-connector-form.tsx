import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
import type { ReactNode } from "react";
import { reportClientProblem } from "#/shared/errors/report-client-problem";
import { Button } from "#/shared/ui/button";
import { ClaudeLogo } from "#/shared/ui/claude-logo";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

const CONNECTOR_NAME = "Editor Oculto";
// Claude's own "add custom connector" form, opened with the name already filled in. The form takes
// no address from the link, so the address goes to the clipboard on the same click.
const CONNECTOR_FORM_PATH = `claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent(CONNECTOR_NAME)}`;
const DESKTOP_APP_URL = `claude://${CONNECTOR_FORM_PATH}`;
const WEB_URL = `https://${CONNECTOR_FORM_PATH}`;

async function copyAddress(mcpUrl: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(mcpUrl);
    } catch (error) {
        // The address stays on the page to copy by hand; the link still opens Claude.
        reportClientProblem("Could not copy the MCP address", error);
    }
}

/** Opens the Claude app on the PC at its connector form, with the address ready to paste. */
export function OpenClaudeConnectorForm({ mcpUrl }: { mcpUrl: string }): ReactNode {
    const track = useTrackPromise();

    return (
        <div className="grid justify-items-start gap-2">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <Button asChild className="font-bold">
                    <a href={DESKTOP_APP_URL} onClick={() => track(copyAddress(mcpUrl))}>
                        Conectar ao Claude
                    </a>
                </Button>
                <a
                    href={WEB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track(copyAddress(mcpUrl))}
                    className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold underline decoration-primary-ink/40 underline-offset-4 outline-none hover:decoration-primary-ink focus-visible:ring-4 focus-visible:ring-ring"
                >
                    <ClaudeLogo className="size-4 shrink-0" />
                    Usar o Claude no navegador
                    <ArrowUpRightIcon aria-hidden="true" className="size-4 shrink-0" />
                </a>
            </div>
            <p className="text-sm text-muted-foreground">
                O endereço já vai copiado: no Claude, cole no campo do endereço e clique em{" "}
                <span className="font-semibold text-foreground">Add</span>.
            </p>
        </div>
    );
}
