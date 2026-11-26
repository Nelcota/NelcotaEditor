// @vitest-environment happy-dom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SubscriptionView } from "#/modules/billing/model/subscription-view";
import { useSubscriptionAnnouncement } from "#/modules/billing/ui/hooks/use-subscription-announcement";

function subscription(status: "pending" | "active"): SubscriptionView {
    return {
        status,
        hasAccess: status === "active",
        paidUntil: null,
        nextChargeOn: null,
        checkoutExpiresAt: "2026-11-25T13:00:00.000Z",
    };
}

afterEach(() => {
    cleanup();
});

describe("useSubscriptionAnnouncement", () => {
    it("stays quiet for someone who was already a subscriber", () => {
        const { result } = renderHook(() => useSubscriptionAnnouncement(subscription("active")));

        expect(result.current).toBe("");
    });

    it("announces the payment confirming while the page waits", () => {
        const { result, rerender } = renderHook(
            ({ view }: { view: SubscriptionView }) => useSubscriptionAnnouncement(view),
            { initialProps: { view: subscription("pending") } },
        );

        rerender({ view: subscription("active") });

        expect(result.current).toBe("Assinatura ativa. Os formatos de assinante estão liberados.");
    });
});
