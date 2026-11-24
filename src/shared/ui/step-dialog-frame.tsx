import { Children, useEffect, useRef } from "react";
import type { ComponentType, ReactNode, RefObject } from "react";
import { AlertDialogDescription, AlertDialogTitle } from "#/shared/ui/alert-dialog";
import { cn } from "#/shared/ui/cn";
import { DialogDescription, DialogTitle } from "#/shared/ui/dialog";
import { StepSegments } from "#/shared/ui/step-progress";

/** Which Radix primitive hosts the frame: its title and description must come from the same one. */
export type StepDialogKind = "dialog" | "alert";

interface TextSlotProps {
    className?: string;
    children?: ReactNode;
}

const TITLES: Record<StepDialogKind, ComponentType<TextSlotProps>> = {
    dialog: DialogTitle,
    alert: AlertDialogTitle,
};

const DESCRIPTIONS: Record<StepDialogKind, ComponentType<TextSlotProps>> = {
    dialog: DialogDescription,
    alert: AlertDialogDescription,
};

/**
 * The classes every stepped dialog's content takes: no padding of its own (the frame pads each
 * part), the popover fill, and the close button 20px in (24px from `sm` up).
 */
export const STEP_DIALOG_CONTENT_CLASS =
    "gap-0 overflow-hidden bg-popover p-0 [--dialog-padding:--spacing(5)] sm:[--dialog-padding:--spacing(6)]";

/** A dialog with a rail: wide enough for the rail and a two-column field, and a steady height. */
export const STEP_DIALOG_WIDE_CLASS =
    "h-[min(36rem,calc(100dvh-2rem))] grid-rows-1 sm:max-w-[min(54rem,calc(100%-4rem))]";

/**
 * The same for an alert dialog, whose own width rule sits behind its size attribute and so needs
 * the same attribute to be overridden.
 */
export const STEP_ALERT_WIDE_CLASS =
    "h-[min(36rem,calc(100dvh-2rem))] grid-rows-1 data-[size=default]:sm:max-w-[min(54rem,calc(100%-4rem))]";

/** A dialog with a single step: no rail, so it stays narrow and as tall as its content. */
export const STEP_DIALOG_SINGLE_CLASS = "sm:max-w-lg";

interface StepDialogFrameProps {
    kind: StepDialogKind;
    /** The step rail, or null for a dialog with a single step. */
    rail: ReactNode;
    progress: { current: number; total: number } | null;
    title: ReactNode;
    description: ReactNode;
    /** The step's fields; a question that is all title and buttons leaves it out. */
    children?: ReactNode;
    footer: ReactNode;
}

interface FrameHeaderProps extends Omit<StepDialogFrameProps, "rail" | "children" | "footer"> {
    hasContent: boolean;
    headerRef: RefObject<HTMLElement | null>;
}

const FIELD_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * A new step replaces the buttons and fields of the last one, so the control that had focus is
 * often gone. The header takes focus then, and a screen reader reads the step number, title and
 * description. A step that focused one of its own fields keeps that.
 */
function useFocusHeaderOnStepChange(
    headerRef: RefObject<HTMLElement | null>,
    step: number | null,
): void {
    const shownStep = useRef(step);

    useEffect(() => {
        const header = headerRef.current;

        if (shownStep.current === step || header === null) {
            return;
        }

        shownStep.current = step;
        const active = document.activeElement;

        if (
            active !== null &&
            FIELD_TAGS.has(active.tagName) === true &&
            header.closest("[role]")?.contains(active) === true
        ) {
            return;
        }

        header.focus();
    }, [headerRef, step]);
}

function FrameHeader(props: FrameHeaderProps): ReactNode {
    const { kind, progress, title, description, hasContent, headerRef } = props;
    const Title = TITLES[kind];
    const Description = DESCRIPTIONS[kind];

    return (
        <header
            ref={headerRef}
            tabIndex={-1}
            className={cn(
                "grid gap-1 px-5 pt-5 pe-16 outline-none sm:px-7 sm:pt-6 sm:pe-16",
                hasContent === false && "pb-5 sm:pb-6",
            )}
        >
            {progress !== null && (
                <>
                    <StepSegments current={progress.current} total={progress.total} />
                    <p className="mt-2 text-xs font-bold tracking-[0.06em] text-primary-ink uppercase sm:mt-0">
                        Passo {progress.current} de {progress.total}
                    </p>
                </>
            )}
            <Title className="text-xl font-semibold tracking-tight text-foreground">{title}</Title>
            <Description className="max-w-prose text-sm text-muted-foreground">
                {description}
            </Description>
        </header>
    );
}

/**
 * The body every dialog shares: the rail on the leading side (when there is one), then the step's
 * title, its content scrolling on its own, and a ruled footer with Voltar on the leading side and
 * the step's main action trailing.
 */
export function StepDialogFrame(props: StepDialogFrameProps): ReactNode {
    const { rail, children, footer, progress } = props;
    const headerRef = useRef<HTMLElement>(null);
    useFocusHeaderOnStepChange(headerRef, progress?.current ?? null);
    // toArray drops null, undefined and false, so conditional fields that are all off count as none.
    const hasContent = Children.toArray(children).length > 0;

    return (
        <div
            className={cn("grid min-h-0", rail !== null && "sm:grid-cols-[15.5rem_minmax(0,1fr)]")}
        >
            {rail}
            <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto]">
                <FrameHeader {...props} hasContent={hasContent} headerRef={headerRef} />
                {hasContent === true && (
                    <div className="grid min-h-0 content-start gap-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                        {children}
                    </div>
                )}
                {hasContent === false && <div aria-hidden="true" />}
                <footer className="flex items-center gap-3 border-t px-5 py-4 sm:px-7">
                    {footer}
                </footer>
            </div>
        </div>
    );
}
