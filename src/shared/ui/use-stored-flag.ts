import { useSyncExternalStore } from "react";
import { reportClientProblem } from "#/shared/errors/report-client-problem";

const CHANGE_EVENT = "nelcota:stored-flag-change";
const temporaryFlags = new Map<string, boolean>();

function reportUnexpectedStorageError(message: string, error: unknown): void {
    if (
        error instanceof DOMException &&
        (error.name === "SecurityError" || error.name === "QuotaExceededError")
    ) {
        return;
    }

    reportClientProblem(message, error);
}

function readFlag(storageKey: string): boolean {
    const temporaryValue = temporaryFlags.get(storageKey);

    if (temporaryValue !== undefined) {
        return temporaryValue;
    }

    try {
        return window.localStorage.getItem(storageKey) === "true";
    } catch (error) {
        reportUnexpectedStorageError(`Could not read the preference ${storageKey}`, error);
        return false;
    }
}

function subscribe(onChange: () => void): () => void {
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);

    return () => {
        window.removeEventListener(CHANGE_EVENT, onChange);
        window.removeEventListener("storage", onChange);
    };
}

function writeFlag(storageKey: string, isOn: boolean): void {
    try {
        window.localStorage.setItem(storageKey, String(isOn));
        temporaryFlags.delete(storageKey);
    } catch (error) {
        // People can still turn motion off for the open page when storage refuses writes.
        temporaryFlags.set(storageKey, isOn);
        reportUnexpectedStorageError(`Could not save the preference ${storageKey}`, error);
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** An on/off preference remembered per browser, as a viewer convenience. */
export function useStoredFlag(
    storageKey: string,
    serverValue: boolean = false,
): { isOn: boolean; toggle: () => void } {
    const isOn = useSyncExternalStore(
        subscribe,
        () => readFlag(storageKey),
        () => serverValue,
    );

    return { isOn, toggle: () => writeFlag(storageKey, isOn === false) };
}
