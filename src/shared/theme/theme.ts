declare global {
    interface Window {
        nelcotaTheme?: { toggle: () => void; syncBrowserColor: () => void };
    }
}

/** Browser bar colours for the two themes; they match --background. */
export const THEME_BAR_COLORS = { light: "#ececec", dark: "#1a1a1a" };
const THEME_CHANGE_EVENT = "nelcota-theme-change";

export function syncThemeColor(): void {
    window.nelcotaTheme?.syncBrowserColor();
}

export function toggleTheme(): void {
    window.nelcotaTheme?.toggle();
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function subscribeToTheme(onChange: () => void): () => void {
    window.addEventListener(THEME_CHANGE_EVENT, onChange);

    return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

export function readIsDarkTheme(): boolean {
    return document.documentElement.classList.contains("dark");
}
