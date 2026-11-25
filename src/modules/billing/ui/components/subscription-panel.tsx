import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { mySubscriptionQueryOptions } from "#/modules/billing/model/subscription-queries";
import type { SubscriptionView } from "#/modules/billing/model/subscription-view";
import { CancelSubscriptionDialog } from "#/modules/billing/ui/components/cancel-subscription-dialog";
import { SubscribeOffer } from "#/modules/billing/ui/components/subscribe-offer";
import { useSubscriptionAnnouncement } from "#/modules/billing/ui/hooks/use-subscription-announcement";
import { AsyncButton } from "#/shared/ui/async-button";
import { formatDate } from "#/shared/ui/format";
import { Skeleton } from "#/shared/ui/skeleton";

const PANEL_CLASS = "rounded-2xl border border-card-border bg-card p-4 sm:px-5";

function describeSubscriber(subscription: SubscriptionView): string {
    const accessEndsOn = formatDate(subscription.paidUntil ?? "");
    const nextChargeOn = formatDate(subscription.nextChargeOn ?? "");
    const descriptions = {
        canceled: `Cancelada. Os formatos de assinante ficam liberados até ${accessEndsOn}.`,
        overdue: `A cobrança deste mês não passou. Confira o cartão no e-mail do Asaas para não perder os formatos de assinante depois de ${accessEndsOn}.`,
        active: `R$ 49,90 por mês. Próxima cobrança em ${nextChargeOn}.`,
        pending: `R$ 49,90 por mês. Próxima cobrança em ${nextChargeOn}.`,
    } as const;

    return descriptions[subscription.status];
}

function SubscriberSummary({ subscription }: { subscription: SubscriptionView }): ReactNode {
    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="grid min-w-0 flex-1 gap-0.5">
                <h2 id="subscription" className="font-bold">
                    Você é assinante
                </h2>
                <p className="text-sm text-muted-foreground">{describeSubscriber(subscription)}</p>
            </div>
            {subscription.status !== "canceled" && (
                <CancelSubscriptionDialog accessEndsOn={formatDate(subscription.paidUntil ?? "")} />
            )}
        </div>
    );
}

function SubscriptionContent(): ReactNode {
    const subscriptionQuery = useQuery(mySubscriptionQueryOptions());
    const subscription = subscriptionQuery.data;

    if (subscriptionQuery.isError === true && subscription === undefined) {
        return (
            <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">
                    Não foi possível carregar sua assinatura.
                </p>
                <AsyncButton variant="secondary" onAction={() => subscriptionQuery.refetch()}>
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </AsyncButton>
            </div>
        );
    }

    if (subscription === undefined) {
        return <Skeleton className="h-12 w-full" />;
    }

    if (subscription !== null && subscription.hasAccess === true) {
        return <SubscriberSummary subscription={subscription} />;
    }

    return <SubscribeOffer subscription={subscription} />;
}

/** The Editor Oculto subscription: the offer for others, the state and cancelling for subscribers. */
export function SubscriptionPanel(): ReactNode {
    const subscriptionQuery = useQuery(mySubscriptionQueryOptions());
    const announcement = useSubscriptionAnnouncement(subscriptionQuery.data);

    return (
        <section aria-labelledby="subscription" className={PANEL_CLASS}>
            <p role="status" className="sr-only">
                {announcement}
            </p>
            <SubscriptionContent />
        </section>
    );
}
