import type { ComponentProps, ReactNode } from "react";
import { Button } from "#/shared/ui/button";
import { useAsyncAction } from "#/shared/ui/use-async-action";

type AsyncButtonProps = Omit<ComponentProps<typeof Button>, "onClick" | "isLoading"> & {
    /** Runs on click; the button stays busy until it settles. */
    onAction: () => Promise<unknown>;
};

/** A button whose click starts async work, such as reloading what failed to load. */
export function AsyncButton({ onAction, ...buttonProps }: AsyncButtonProps): ReactNode {
    const action = useAsyncAction(onAction);

    return <Button {...buttonProps} isLoading={action.isPending} onClick={() => action.mutate()} />;
}
