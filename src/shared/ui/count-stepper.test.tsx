// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CountStepper } from "#/shared/ui/count-stepper";

afterEach(() => {
    cleanup();
});

interface RenderedStepper {
    onValueChange: (value: number) => void;
    user: UserEvent;
}

function renderStepper(value: number): RenderedStepper {
    const onValueChange = vi.fn<(value: number) => void>();
    render(
        <CountStepper
            id="clip-count"
            label="Cortes"
            icon={null}
            value={value}
            min={1}
            max={10}
            formatValue={(count) => `${count} cortes`}
            decreaseLabel="Menos um corte"
            increaseLabel="Mais um corte"
            onValueChange={onValueChange}
        />,
    );

    return { onValueChange, user: userEvent.setup() };
}

describe("CountStepper", () => {
    it("adds one when the plus button is pressed", async () => {
        const { onValueChange, user } = renderStepper(5);

        await user.click(screen.getByRole("button", { name: "Mais um corte" }));

        expect(onValueChange).toHaveBeenCalledWith(6);
    });

    it("stays at the maximum and keeps the button focusable", async () => {
        const { onValueChange, user } = renderStepper(10);
        const increase = screen.getByRole("button", { name: "Mais um corte" });

        await user.click(increase);

        expect(onValueChange).not.toHaveBeenCalled();
        expect(increase.getAttribute("aria-disabled")).toBe("true");
        expect(increase.hasAttribute("disabled")).toBe(false);
    });

    it("shows the formatted count", () => {
        renderStepper(3);

        expect(screen.getByText("3 cortes")).not.toBeNull();
    });
});
