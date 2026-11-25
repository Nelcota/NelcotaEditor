import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
    AUTH_EMAIL_KINDS,
    buildAuthEmail,
    pickGreetingName,
} from "#/modules/auth/server/auth-email-content.server";

const LINK = "https://cortes.nelcota.com/api/auth/verify-email?token=abc&callbackURL=%2Fsign-in";

describe("buildAuthEmail", () => {
    for (const kind of AUTH_EMAIL_KINDS) {
        it(`puts the link in the html and the text of a ${kind} email`, () => {
            const email = buildAuthEmail({ kind, to: "ana@example.com", name: "Ana", url: LINK });

            assert.ok(email.subject.length > 0);
            assert.ok(email.text.includes(LINK));
            assert.ok(email.html.includes(`href="${LINK.replaceAll("&", "&amp;")}"`));
        });
    }

    it("never lets the typed name become markup", () => {
        const name = '<a href="https://evil.example">Clique</a>';

        const email = buildAuthEmail({
            kind: "reset-password",
            to: "a@example.com",
            name,
            url: LINK,
        });

        assert.equal(email.html.includes('evil.example">'), false);
        assert.ok(email.html.includes("&lt;a href=&quot;https://evil.example&quot;&gt;"));
    });

    it("greets the person by name", () => {
        const email = buildAuthEmail({
            kind: "reset-password",
            to: "a@example.com",
            name: "Ana",
            url: LINK,
        });

        assert.ok(email.text.startsWith("Olá, Ana."));
    });

    it("greets without a name when there is none", () => {
        const email = buildAuthEmail({
            kind: "existing-account",
            to: "a@example.com",
            name: null,
            url: LINK,
        });

        assert.ok(email.text.startsWith("Olá."));
    });

    it("never puts the typed name in the verification email", () => {
        const email = buildAuthEmail({
            kind: "verify-email",
            to: "a@example.com",
            name: "Visite golpe.example",
            url: LINK,
        });

        assert.equal(email.text.includes("golpe.example"), false);
        assert.equal(email.html.includes("golpe.example"), false);
    });
});

describe("pickGreetingName", () => {
    it("uses the name of an account whose email is confirmed", () => {
        assert.equal(pickGreetingName({ name: "Ana", emailVerified: true }), "Ana");
    });

    it("leaves out the name of an account whose email was never confirmed", () => {
        assert.equal(
            pickGreetingName({ name: "Visite golpe.example", emailVerified: false }),
            null,
        );
    });
});
