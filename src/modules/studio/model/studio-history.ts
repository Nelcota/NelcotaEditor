import type { StudioDraft } from "#/modules/clips/model/clip-studio";

const MAX_HISTORY_STEPS = 100;

export interface StudioHistory {
    past: Array<StudioDraft>;
    present: StudioDraft;
    future: Array<StudioDraft>;
}

export type StudioHistoryAction =
    | { type: "apply"; draft: StudioDraft }
    | { type: "undo" }
    | { type: "redo" }
    | { type: "replace"; draft: StudioDraft };

export function createHistory(draft: StudioDraft): StudioHistory {
    return { past: [], present: draft, future: [] };
}

function applyDraft(history: StudioHistory, draft: StudioDraft): StudioHistory {
    if (draft === history.present) {
        return history;
    }

    const past = [...history.past, history.present].slice(-MAX_HISTORY_STEPS);

    return { past, present: draft, future: [] };
}

function undo(history: StudioHistory): StudioHistory {
    const previous = history.past.at(-1);

    if (previous === undefined) {
        return history;
    }

    return {
        past: history.past.slice(0, -1),
        present: previous,
        future: [history.present, ...history.future],
    };
}

function redo(history: StudioHistory): StudioHistory {
    const next = history.future[0];

    if (next === undefined) {
        return history;
    }

    return {
        past: [...history.past, history.present],
        present: next,
        future: history.future.slice(1),
    };
}

const HISTORY_HANDLERS = {
    apply: (history: StudioHistory, action: StudioHistoryAction) =>
        applyDraft(history, readDraft(action, history)),
    undo: (history: StudioHistory) => undo(history),
    redo: (history: StudioHistory) => redo(history),
    // A version from elsewhere (another tab, a fresh load) starts a new history.
    replace: (history: StudioHistory, action: StudioHistoryAction) =>
        createHistory(readDraft(action, history)),
};

function readDraft(action: StudioHistoryAction, history: StudioHistory): StudioDraft {
    if (action.type === "apply" || action.type === "replace") {
        return action.draft;
    }

    return history.present;
}

export function studioHistoryReducer(
    history: StudioHistory,
    action: StudioHistoryAction,
): StudioHistory {
    return HISTORY_HANDLERS[action.type](history, action);
}
