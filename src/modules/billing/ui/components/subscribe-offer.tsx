import ArrowRightIcon from "~icons/lucide/arrow-right";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
    CENTS_PER_REAL,
    SUBSCRIPTION_PRICE_CENTS,
} from "#/modules/billing/model/subscription-plan";
import { startMySubscription } from "#/modules/billing/server/subscription-functions";
import type { SubscriptionView } from "#/modules/billing/model/subscription-view";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { Spinner } from "#/shared/ui/spinner";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const FALLBACK_ERROR_MESSAGE =
    "Não foi possível abrir o pagamento. Confira sua conexão e tente de novo.";
const MONTHLY_PRICE = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
}).format(SUBSCRIPTION_PRICE_CENTS / CENTS_PER_REAL);

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
            <div className="grid items-center gap-4 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:gap-6">
                <div className="grid min-w-0 gap-1">
                    <h2 id="subscription" className="text-lg leading-tight font-bold">
                        Um formato novo todo mês
                    </h2>
                    <p className="text-sm text-pretty text-muted-foreground">
                        Acesse todos os formatos exclusivos para assinantes.
                    </p>
                </div>
                <div className="grid items-center gap-3 border-t border-card-border pt-4 @lg:grid-cols-[minmax(0,1fr)_auto] @lg:gap-5 @2xl:border-t-0 @2xl:border-s @2xl:pt-0 @2xl:ps-6">
                    <div id="subscription-terms" className="grid gap-1">
                        <p className="flex flex-wrap items-baseline gap-x-1.5">
                            <span className="text-2xl leading-none font-bold tracking-tight tabular-nums">
                                {MONTHLY_PRICE}
                            </span>
                            <span className="text-meta text-muted-foreground">por mês</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            No cartão. Cancele quando quiser.
                        </p>
                    </div>
                    <Button
                        type="button"
                        size="lg"
                        className="font-bold"
                        aria-describedby="subscription-terms"
                        isLoading={checkout.isPending}
                        loadingLabel="Abrindo pagamento…"
                        onClick={() => checkout.mutate()}
                    >
                        Assinar
                        <ArrowRightIcon aria-hidden="true" className="size-4" />
                    </Button>
                </div>
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
