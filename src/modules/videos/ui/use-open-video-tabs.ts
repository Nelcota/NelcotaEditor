import { useSyncExternalStore } from "react";
import { z } from "zod";

const STORAGE_KEY = "nelcota:open-video-tabs";
const CHANGE_EVENT = "nelcota:open-video-tabs-change";
const MAX_OPEN_TABS = 8;
const NO_TABS = "[]";

// Storage is outside the code and may hold anything (an old format, a hand edit).
const storedTabsSchema = z.array(z.uuid()).max(MAX_OPEN_TABS);

/** The raw text, so useSyncExternalStore compares a stable string instead of a new array each read. */
function readSnapshot(): string {
    try {
        return window.localStorage.getItem(STORAGE_KEY) ?? NO_TABS;
    } catch (error) {
        console.warn("Could not read the open video tabs", error);
        return NO_TABS;
    }
}

function readServerSnapshot(): string {
    return NO_TABS;
}

function parseTabs(snapshot: string): Array<string> {
    let stored: unknown = [];

    try {
        stored = JSON.parse(snapshot);
    } catch (error) {
        console.warn("Ignoring unreadable open video tabs", error);
        return [];
    }

    const result = storedTabsSchema.safeParse(stored);

    if (result.success === false) {
        return [];
    }

    return result.data;
}

function writeTabs(videoIds: Array<string>): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(videoIds));
    } catch (error) {
        console.warn("Could not save the open video tabs", error);
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);

    return () => {
        window.removeEventListener(CHANGE_EVENT, onChange);
        window.removeEventListener("storage", onChange);
    };
}

interface OpenVideoTabs {
    videoIds: Array<string>;
    open: (videoId: string) => void;
    close: (videoId: string) => void;
}

/**
 * The videos open as tabs in the top bar, remembered per browser as a viewer convenience. Opening
 * one already open keeps its place; past the limit the oldest tab gives way.
 */
export function useOpenVideoTabs(): OpenVideoTabs {
    const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
    const videoIds = parseTabs(snapshot);

    return {
        videoIds,
        open: (videoId) => {
            const current = parseTabs(readSnapshot());

            if (current.includes(videoId) === true) {
                return;
            }

            writeTabs([...current, videoId].slice(-MAX_OPEN_TABS));
        },
        close: (videoId) => {
            writeTabs(parseTabs(readSnapshot()).filter((openId) => openId !== videoId));
        },
    };
}
