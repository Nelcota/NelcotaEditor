import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CopyTextButton } from "#/shared/ui/copy-text-button";
import { Spinner } from "#/shared/ui/spinner";
import { OpenClaudeConnectorForm } from "#/modules/viral-formats/ui/components/open-claude-connector-form";

const STRONG_CLASS = "font-semibold text-foreground";

/**
 * How to add Editor Oculto to Claude as a custom connector. Claude's link opens its connector form
 * but cannot fill in the address, so the address is copied and pasted.
 */
export function ClaudeConnectSteps({ mcpUrl }: { mcpUrl: string }): ReactNode {
    return (
        <div className="grid gap-5">
            <OpenClaudeConnectorForm mcpUrl={mcpUrl} />
            <div className="grid gap-2">
                <p className="text-sm font-medium">Endereço do Editor Oculto</p>
                <div className="flex flex-wrap items-center gap-2">
                    <code className="min-w-56 flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 font-mono text-sm [overflow-wrap:anywhere]">
                        {mcpUrl}
                    </code>
                    <CopyTextButton text={mcpUrl} label="Copiar endereço" />
                </div>
            </div>
            <ol className="grid list-inside list-decimal gap-2.5 text-muted-foreground marker:font-bold marker:text-primary-ink">
                <li>
                    Confira se você tem o <span className={STRONG_CLASS}>Claude Pro</span> ativo. A
                    aula do{" "}
                    <Link
                        to="/getting-started"
                        className="rounded-sm underline decoration-primary-ink/40 underline-offset-4 outline-none hover:decoration-primary-ink focus-visible:ring-4 focus-visible:ring-ring"
                    >
                        Comece por aqui
                    </Link>{" "}
                    mostra como.
                </li>
                <li>
                    Clique em <span className={STRONG_CLASS}>Conectar ao Claude</span>. Sem o botão,
                    abra <span className={STRONG_CLASS}>Customize › Connectors</span> e clique em{" "}
                    <span className={STRONG_CLASS}>Add custom connector</span>.
                </li>
                <li>
                    Confira o nome <span className={STRONG_CLASS}>Editor Oculto</span>, cole o
                    endereço e clique em <span className={STRONG_CLASS}>Add</span>.
                </li>
                <li>
                    Clique em <span className={STRONG_CLASS}>Connect</span>, entre com sua conta do
                    Editor Oculto e permita o acesso.
                </li>
            </ol>
            <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Esperando o Claude se conectar. Esta página atualiza sozinha.
            </p>
        </div>
    );
}
