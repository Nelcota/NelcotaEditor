import { loadEnv } from "vite";
import type { Plugin, PluginOption } from "vite";
import { configDefaults, defineConfig } from "vitest/config";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import babel from "@rolldown/plugin-babel";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import icons from "unplugin-icons/vite";
import { icons as lucideIcons } from "@iconify-json/lucide";

const LUCIDE_VIEW_BOX_SIZE = 24;
const LUCIDE_DEFAULT_STROKE = 'stroke-width="2"';
/** Lucide's default 2 reads heavy at 16 to 20px; 1.75 is lighter and still whole enough to stay crisp. */
const ICON_STROKE = 'stroke-width="1.75"';

function readLucideBody(name: string): string {
    const iconBodies = lucideIcons.icons;
    const alias = lucideIcons.aliases?.[name];
    const icon = iconBodies[alias?.parent ?? name];

    if (icon === undefined) {
        throw new Error(`Lucide has no icon named "${name}".`);
    }

    return icon.body.replaceAll(LUCIDE_DEFAULT_STROKE, ICON_STROKE);
}

function wrapLucideBody(body: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LUCIDE_VIEW_BOX_SIZE} ${LUCIDE_VIEW_BOX_SIZE}">${body}</svg>`;
}

function loadLucideIcon(name: string): string {
    return wrapLucideBody(readLucideBody(name));
}

/** Lucide ships outlines only; transport glyphs (play, pause, skip) read better solid. */
function loadSolidLucideIcon(name: string): string {
    const solidBody = readLucideBody(name).replaceAll('fill="none"', 'fill="currentColor"');

    return wrapLucideBody(solidBody);
}

/**
 * Nitro's dev server treats any request with `Sec-Fetch-Dest: video` (sent by <video>) as a
 * static asset and answers 404 before our API route runs. Dropping the header for /api/
 * requests lets the clip route stream videos in development. Production is not affected.
 */
function apiRequestsAreNeverAssets(): Plugin {
    return {
        name: "api-requests-are-never-assets",
        apply: "serve",
        configureServer(server) {
            server.middlewares.use((request, _response, next) => {
                const url = request.url ?? "";

                if (url.startsWith("/api/")) {
                    delete request.headers["sec-fetch-dest"];
                }

                next();
            });
        },
    };
}

/**
 * The server, the router and the styles. Vitest imports modules straight, and Nitro's dev server
 * would otherwise start with it and keep the run from exiting.
 */
function appServerPlugins(): Array<PluginOption> {
    if (process.env.VITEST !== undefined) {
        return [];
    }

    return [apiRequestsAreNeverAssets(), nitro({ preset: "bun" }), tailwindcss(), tanstackStart()];
}

/** Integration tests read .env.test, never .env: they write to their own database. */
const TEST_ENVIRONMENT = loadEnv("test", process.cwd(), "");

export default defineConfig({
    resolve: { tsconfigPaths: true },
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    include: ["src/**/*.test.{ts,tsx}"],
                    exclude: [...configDefaults.exclude, "src/**/*.integration.test.ts"],
                    environment: "node",
                },
            },
            {
                extends: true,
                test: {
                    name: "integration",
                    include: ["src/**/*.integration.test.ts"],
                    environment: "node",
                    env: TEST_ENVIRONMENT,
                    setupFiles: ["scripts/assert-test-database.ts"],
                    // The files share one database; one at a time keeps their rows apart.
                    fileParallelism: false,
                },
            },
        ],
    },
    server: { port: 3210, strictPort: true },
    plugins: [
        ...appServerPlugins(),
        viteReact(),
        // The React Compiler memoizes components and hooks, so the code has no useMemo/useCallback.
        babel({ presets: [reactCompilerPreset()] }),
        icons({
            compiler: "jsx",
            jsx: "react",
            customCollections: {
                lucide: loadLucideIcon,
                "lucide-solid": loadSolidLucideIcon,
            },
        }),
    ],
});
