import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import icons from "unplugin-icons/vite";

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

export default defineConfig({
    resolve: { tsconfigPaths: true },
    server: { port: 3210, strictPort: true },
    plugins: [
        apiRequestsAreNeverAssets(),
        nitro(),
        tailwindcss(),
        tanstackStart(),
        viteReact(),
        icons({ compiler: "jsx", jsx: "react" }),
    ],
});
