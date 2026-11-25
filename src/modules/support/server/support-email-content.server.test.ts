import { describe, expect, it } from "vitest";
import { buildSupportEmail } from "#/modules/support/server/support-email-content.server";

describe("buildSupportEmail", () => {
    it("sends an account holder a link and never the answer", () => {
        const email = buildSupportEmail({
            to: "ana@example.com",
            ticketNumber: 1042,
            url: "https://app.example/support/abc",
            replyText: null,
        });

        expect(email.subject).toBe("Respondemos seu ticket #1042");
        expect(email.html).toContain('href="https://app.example/support/abc"');
    });

    it("sends a guest the answer with markup escaped", () => {
        const email = buildSupportEmail({
            to: "guest@example.com",
            ticketNumber: 7,
            url: null,
            replyText: "Use <b>este</b> link\nobrigado",
        });

        expect(email.html).toContain("Use &lt;b&gt;este&lt;/b&gt; link<br>obrigado");
        expect(email.text).toContain("Use <b>este</b> link\nobrigado");
    });

    it("refuses a job with neither a link nor an answer", () => {
        expect(() =>
            buildSupportEmail({ to: "a@example.com", ticketNumber: 1, url: null, replyText: null }),
        ).toThrow(RangeError);
    });
});
