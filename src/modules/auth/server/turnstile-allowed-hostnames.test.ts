import { describe, expect, it } from "vitest";
import { pickTurnstileAllowedHostnames } from "#/modules/auth/server/turnstile-allowed-hostnames";

const APP_URL = "https://tela.example.com";

describe("pickTurnstileAllowedHostnames", () => {
    it("allows only the app's hostname with a real secret", () => {
        const hostnames = pickTurnstileAllowedHostnames("real-secret", APP_URL);

        expect(hostnames).toEqual(["tela.example.com"]);
    });

    it("checks no hostname with Cloudflare's always passing testing secret", () => {
        const hostnames = pickTurnstileAllowedHostnames(
            "1x0000000000000000000000000000000AA",
            APP_URL,
        );

        expect(hostnames).toEqual([]);
    });

    it("checks no hostname with the other documented testing secrets", () => {
        const failing = pickTurnstileAllowedHostnames(
            "2x0000000000000000000000000000000AA",
            APP_URL,
        );
        const spent = pickTurnstileAllowedHostnames("3x0000000000000000000000000000000AA", APP_URL);

        expect([failing, spent]).toEqual([[], []]);
    });

    it("checks no hostname when the app URL is unknown", () => {
        const hostnames = pickTurnstileAllowedHostnames("real-secret", undefined);

        expect(hostnames).toEqual([]);
    });
});
