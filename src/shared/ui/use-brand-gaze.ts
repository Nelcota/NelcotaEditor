import { useEffect, useRef } from "react";
import type { RefObject } from "react";

interface GazePoint {
    x: number;
    y: number;
}

const MAX_TRAVEL_PERCENT = 7;
const FULL_TRAVEL_IN_MARK_WIDTHS = 3;
const EYE_LINE_RATIO = 37 / 80;
const LOOK_X_PROPERTY = "--brand-look-x";
const LOOK_Y_PROPERTY = "--brand-look-y";
const FIRST_BLINK_DELAY_MILLISECONDS = 3_000;
const MIN_BLINK_INTERVAL_MILLISECONDS = 7_000;
const MAX_BLINK_INTERVAL_MILLISECONDS = 12_000;
const BLINK_INTERVAL_RANGE_MILLISECONDS =
    MAX_BLINK_INTERVAL_MILLISECONDS - MIN_BLINK_INTERVAL_MILLISECONDS;

function paintGaze(overlay: SVGSVGElement, point: GazePoint | null): void {
    const style = overlay.style;

    if (point === null) {
        delete overlay.dataset.hasGaze;
        style.removeProperty(LOOK_X_PROPERTY);
        style.removeProperty(LOOK_Y_PROPERTY);
        return;
    }

    const { left, top, width, height } = overlay.getBoundingClientRect();

    if (width === 0) {
        return;
    }

    const horizontal = point.x - left - width / 2;
    const vertical = point.y - top - height * EYE_LINE_RATIO;
    const distance = Math.max(Math.hypot(horizontal, vertical), width * FULL_TRAVEL_IN_MARK_WIDTHS);
    const travel = MAX_TRAVEL_PERCENT / distance;

    overlay.dataset.hasGaze = "true";
    style.setProperty(LOOK_X_PROPERTY, `${horizontal * travel}%`);
    style.setProperty(LOOK_Y_PROPERTY, `${vertical * travel}%`);
}

function subscribeToBlink(
    overlay: SVGSVGElement,
    motion: MediaQueryList,
    signal: AbortSignal,
): void {
    let timer: number | null = null;

    function canBlink(): boolean {
        return motion.matches && document.hidden === false;
    }

    function blink(): void {
        timer = null;

        if (canBlink() === false) {
            return;
        }

        if (overlay.getClientRects().length > 0) {
            overlay.dataset.isBlinking = "true";
        }

        const delay =
            MIN_BLINK_INTERVAL_MILLISECONDS + Math.random() * BLINK_INTERVAL_RANGE_MILLISECONDS;
        timer = window.setTimeout(blink, delay);
    }

    function resetBlink(): void {
        delete overlay.dataset.isBlinking;
    }

    function stopBlinking(): void {
        if (timer !== null) {
            window.clearTimeout(timer);
            timer = null;
        }

        resetBlink();
    }

    function syncBlinking(): void {
        stopBlinking();

        if (canBlink() === true) {
            timer = window.setTimeout(blink, FIRST_BLINK_DELAY_MILLISECONDS);
        }
    }

    syncBlinking();
    overlay.addEventListener("animationend", resetBlink, { signal });
    overlay.addEventListener("animationcancel", resetBlink, { signal });
    document.addEventListener("visibilitychange", syncBlinking, { signal });
    motion.addEventListener("change", syncBlinking, { signal });
    signal.addEventListener("abort", stopBlinking, { once: true });
}

function subscribeToGaze(overlay: SVGSVGElement): () => void {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const controller = new AbortController();
    const { signal } = controller;
    let pendingPoint: GazePoint | null = null;
    let frame: number | null = null;

    function renderGaze(): void {
        frame = null;
        paintGaze(overlay, pendingPoint);
    }

    function scheduleGaze(point: GazePoint | null): void {
        if (motion.matches === false) {
            return;
        }

        pendingPoint = point;
        frame ??= window.requestAnimationFrame(renderGaze);
    }

    function resetGaze(): void {
        pendingPoint = null;
        paintGaze(overlay, null);
    }

    function trackPointer(event: PointerEvent): void {
        if (event.pointerType === "touch") {
            return;
        }

        scheduleGaze({ x: event.clientX, y: event.clientY });
    }

    function trackFocus(event: FocusEvent): void {
        const element = event.target;

        if (element instanceof Element === false || element.matches(":focus-visible") === false) {
            return;
        }

        const { left, top, width, height } = element.getBoundingClientRect();
        scheduleGaze({ x: left + width / 2, y: top + height / 2 });
    }

    subscribeToBlink(overlay, motion, signal);
    window.addEventListener("pointermove", trackPointer, { signal, passive: true });
    document.documentElement.addEventListener("pointerleave", resetGaze, { signal });
    document.addEventListener("focusin", trackFocus, { signal });
    window.addEventListener("blur", resetGaze, { signal });
    motion.addEventListener("change", resetGaze, { signal });

    return () => {
        controller.abort();
        resetGaze();

        if (frame !== null) {
            window.cancelAnimationFrame(frame);
        }
    };
}

export function useBrandGaze(isAnimationEnabled: boolean): RefObject<SVGSVGElement | null> {
    const overlayRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const overlay = overlayRef.current;

        if (overlay === null || isAnimationEnabled === false) {
            return undefined;
        }

        return subscribeToGaze(overlay);
    }, [isAnimationEnabled]);

    return overlayRef;
}
