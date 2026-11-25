import CircleCheckIcon from "~icons/lucide/circle-check";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { z } from "zod";
import { authClient } from "#/modules/auth/client/auth-client";
import type { ClaudeConsentRequest } from "#/modules/auth/model/claude-consent";
import { MCP_SCOPE_DESCRIPTIONS } from "#/modules/auth/model/mcp-connection";
import { BrandLogo } from "#/shared/ui/brand-logo";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { StandaloneMessageScreen } from "#/shared/ui/standalone-message-screen";

const CONSENT_FAILED_MESSAGE =
    "Não foi possível responder ao Claude. Volte ao Claude e conecte de novo.";

/** The provider's answer: where to send the browser next. */
const consentAnswerSchema = z.object({ url: z.url() });

function describeScope(scope: string): string {
    const descriptions: Readonly<Record<string, string>> = MCP_SCOPE_DESCRIPTIONS;

    return descriptions[scope] ?? scope;
}

/**
 * The answer goes to the provider, which says where Claude is waiting: its callback with a code,
 * or with access_denied.
 */
function useConsentAnswer() {
    return useMutation({
        mutationFn: async (accept: boolean) => {
            const { data, error } = await authClient.oauth2.consent({ accept });

            if (error !== null) {
                throw new Error(error.message ?? CONSENT_FAILED_MESSAGE);
            }

            const answer = consentAnswerSchema.parse(data);
            // Back to Claude with the code, or with access_denied when the person refused.
            window.location.assign(answer.url);
        },
    });
}

/**
 * Asks the person to let their Claude use the account. The client's name is what the client
 * registered, so the page says so and shows where the answer goes instead of vouching for it.
 */
function ConsentQuestion({ request }: { request: ClaudeConsentRequest }): ReactNode {
    const answer = useConsentAnswer();
    const clientName = request.clientName ?? "Um aplicativo";

    return (
        <main className="grid min-h-dvh place-items-center bg-frame px-6 py-10 text-foreground">
            <section aria-labelledby="claude-consent-title" className="grid w-full max-w-lg gap-8">
                <BrandLogo className="justify-self-center text-3xl [&>svg]:h-9" />
                <h1
                    id="claude-consent-title"
                    className="text-center text-display font-extrabold tracking-display"
                >
                    Conectar o Claude
                </h1>
                <div className="grid gap-6">
                    <p className="text-center text-lg text-muted-foreground">
                        <strong className="text-foreground">{clientName}</strong> quer usar sua
                        conta do Editor Oculto. Depois, você volta para{" "}
                        <strong className="text-foreground">{request.redirectHost}</strong>.
                    </p>
                    <ul className="grid gap-3 rounded-2xl border border-card-border bg-card p-5">
                        {request.scopes.map((scope) => (
                            <li key={scope} className="flex items-start gap-3">
                                <CircleCheckIcon
                                    aria-hidden="true"
                                    className="mt-0.5 size-5 shrink-0 text-primary-ink"
                                />
                                {describeScope(scope)}
                            </li>
                        ))}
                        <li className="flex items-start gap-3">
                            <CircleCheckIcon
                                aria-hidden="true"
                                className="mt-0.5 size-5 shrink-0 text-primary-ink"
                            />
                            Ver seus vídeos e as transcrições deles
                        </li>
                    </ul>
                    <p className="text-center text-sm text-muted-foreground">
                        O nome acima é o que o aplicativo informou. Só permita se você acabou de
                        conectar o Claude. Você pode desconectar quando quiser na Etapa 1.
                    </p>
                    {answer.isError === true && <FormAlert message={CONSENT_FAILED_MESSAGE} />}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="lg"
                            disabled={answer.isPending}
                            onClick={() => answer.mutate(false)}
                        >
                            Recusar
                        </Button>
                        <Button
                            type="button"
                            size="lg"
                            className="font-bold"
                            disabled={answer.isPending}
                            aria-busy={answer.isPending}
                            onClick={() => answer.mutate(true)}
                        >
                            Permitir acesso
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}

/** A changed or expired request has nothing to approve: the person starts again from Claude. */
export function ClaudeConsentScreen({
    request,
}: {
    request: ClaudeConsentRequest | null;
}): ReactNode {
    if (request === null) {
        return (
            <StandaloneMessageScreen
                title="Este pedido expirou"
                description="Volte ao Claude e conecte o Editor Oculto de novo."
            />
        );
    }

    return <ConsentQuestion request={request} />;
}
