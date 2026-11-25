import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Alert } from "#/shared/ui/alert";
import { BrandMark } from "#/shared/ui/brand-logo";
import { ClaudeLogo } from "#/shared/ui/claude-logo";

const CONNECTION_STEPS: ReadonlyArray<{ id: string; text: ReactNode }> = [
    {
        id: "pro",
        text: (
            <>
                Confira se você já tem o <strong>Claude Pro ativo</strong>. A aula do{" "}
                <Link
                    to="/getting-started"
                    className="rounded-sm underline decoration-primary-ink/40 underline-offset-4 outline-none hover:decoration-primary-ink focus-visible:ring-4 focus-visible:ring-ring"
                >
                    Comece por aqui
                </Link>{" "}
                mostra como.
            </>
        ),
    },
    {
        id: "connect",
        text: (
            <>
                Clique em <strong>Conectar meu Claude</strong>.
            </>
        ),
    },
    {
        id: "authorize",
        text: (
            <>
                Entre na sua conta do Claude e <strong>autorize o Editor Oculto</strong>.
            </>
        ),
    },
    { id: "back", text: "Você volta para cá e a conexão fica salva." },
];

function ConnectionPicture(): ReactNode {
    return (
        <div
            aria-hidden="true"
            className="flex items-center justify-center gap-4 rounded-2xl border border-card-border bg-card px-6 py-12"
        >
            <span className="grid size-16 place-items-center rounded-2xl bg-secondary">
                <BrandMark className="h-6" />
            </span>
            <span className="h-0.5 w-16 rounded-full border-t-2 border-dashed border-foreground/25" />
            <span className="grid size-16 place-items-center rounded-2xl bg-secondary">
                <ClaudeLogo className="size-9" />
            </span>
        </div>
    );
}

/**
 * Etapa 1: connect the person's Claude, which the formats edit with. The connection is not built
 * yet, so the page says so instead of offering a button that cannot work.
 */
export function ClaudeConnectionScreen(): ReactNode {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <header className="grid max-w-2xl gap-2">
                <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Etapa 1
                </p>
                <h1 className="text-title font-extrabold tracking-[-0.02em] sm:text-4xl">
                    Conecte o seu Claude
                </h1>
                <p className="text-muted-foreground">
                    Os Formatos Virais usam o seu Claude para editar os vídeos. Você conecta uma vez
                    e pronto. Os Cortes funcionam mesmo sem essa etapa.
                </p>
            </header>
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <ConnectionPicture />
                <section
                    aria-labelledby="how-to-connect"
                    className="grid gap-4 rounded-2xl border border-card-border p-6"
                >
                    <h2 id="how-to-connect" className="text-lg font-bold">
                        Como conectar
                    </h2>
                    <ol className="grid list-inside list-decimal gap-2.5 marker:font-bold marker:text-primary-ink">
                        {CONNECTION_STEPS.map((step) => (
                            <li key={step.id}>{step.text}</li>
                        ))}
                    </ol>
                    <Alert tone="info" title="Ainda não disponível">
                        A conexão com o Claude está sendo preparada. Quando estiver pronta, o botão
                        para conectar aparece aqui.
                    </Alert>
                </section>
            </div>
        </div>
    );
}
