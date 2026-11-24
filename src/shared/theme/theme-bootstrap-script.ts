/**
 * Runs in <head> before the first paint, so a saved dark theme never flashes light. It also installs
 * the small adapter the toggle calls. Kept as a string: it must run before the app bundle loads.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function installThemeAdapter() {
    if (window.nelcotaTheme !== undefined) {
        return;
    }

    var storageKey = "nelcota-theme";
    var root = document.documentElement;

    function readSavedTheme() {
        try {
            return window.localStorage.getItem(storageKey);
        } catch (error) {
            return null;
        }
    }

    function syncBrowserColor() {
        var themeColor = document.querySelector('meta[name="theme-color"]');

        if (themeColor === null) {
            return;
        }

        var color = themeColor.getAttribute("data-light-color");

        if (root.classList.contains("dark")) {
            color = themeColor.getAttribute("data-dark-color");
        }

        if (color !== null) {
            themeColor.setAttribute("content", color);
        }
    }

    function toggle() {
        var isDark = root.classList.contains("dark") === false;

        root.setAttribute("data-switching-theme", "");
        root.classList.toggle("dark", isDark);
        void root.offsetWidth;
        window.requestAnimationFrame(function () {
            root.removeAttribute("data-switching-theme");
        });
        syncBrowserColor();

        var nextTheme = "light";

        if (isDark) {
            nextTheme = "dark";
        }

        try {
            window.localStorage.setItem(storageKey, nextTheme);
        } catch (error) {
            reportError(new Error("nelcota-theme: could not save the theme", { cause: error }));
        }
    }

    root.classList.toggle("dark", readSavedTheme() !== "light");
    window.nelcotaTheme = { toggle: toggle, syncBrowserColor: syncBrowserColor };
})();`;
