export const SUBSCRIPTION_PRICE_CENTS = 4990;
export const CENTS_PER_REAL = 100;
export const SUBSCRIPTION_ITEM_NAME = "Editor Oculto mensal";

/**
 * pending: the checkout was opened and not paid yet. active: paid and renewing. overdue: a monthly
 * charge is late. canceled: no more charges; access lasts until what was paid runs out.
 */
export const SUBSCRIPTION_STATUSES = ["pending", "active", "overdue", "canceled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** A card charge can confirm a day or two after its due date; access holds meanwhile. */
export const ACCESS_GRACE_DAYS = 3;
/** How long the Asaas checkout page stays open. */
export const CHECKOUT_LIFETIME_MINUTES = 60;
