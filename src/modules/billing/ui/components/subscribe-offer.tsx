import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { startMySubscription } from "#/modules/billing/server/subscription-functions";
import type { SubscriptionView } from "#/modules/billing/model/subscription-view";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { Spinner } from "#/shared/ui/spinner";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const FALLBACK_ERROR_MESSAGE =
    "Não foi possível abrir o pagamento. Confira sua conexão e tente de novo.";

function isWaitingForPayment(subscription: SubscriptionView | null): boolean {
    if (subscription === null || subscription.status !== "pending") {
        return false;
    }

    return new Date(subscription.checkoutExpiresAt).getTime() > Date.now();
}

/** For someone without the subscription: what it gives and the way to Asaas's payment page. */
export function SubscribeOffer({
    subscription,
}: {
    subscription: SubscriptionView | null;
}): ReactNode {
    const checkout = useMutation({
        mutationFn: async () => await startMySubscription(),
        onSuccess: ({ checkoutUrl }) => window.location.assign(checkoutUrl),
    });

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="grid min-w-0 flex-1 gap-0.5">
                    <h2 id="subscription" className="font-bold">
                        Assine e ganhe um formato novo todo mês
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        R$ 49,90 por mês no cartão. Os formatos novos são só para assinantes.
                        Cancele quando quiser.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="font-bold"
                    disabled={checkout.isPending}
                    aria-busy={checkout.isPending}
                    onClick={() => checkout.mutate()}
                >
                    Assinar por R$ 49,90
                </Button>
            </div>
            {isWaitingForPayment(subscription) === true && (
                <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Spinner className="size-4" />
                    Esperando o pagamento ser confirmado. Esta página atualiza sozinha.
                </p>
            )}
            {checkout.isError === true && (
                <FormAlert message={toErrorMessage(checkout.error, FALLBACK_ERROR_MESSAGE)} />
            )}
        </div>
    );
}
