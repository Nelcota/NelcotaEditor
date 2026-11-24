import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { signInSearchSchema, toSignInNotice } from "#/modules/auth/model/sign-in-notice";

describe("toSignInNotice", () => {
    it("says nothing on a plain visit", () => {
        assert.equal(toSignInNotice(signInSearchSchema.parse({})), null);
    });

    it("confirms a password change", () => {
        assert.match(
            toSignInNotice(signInSearchSchema.parse({ reset: "done" })) ?? "",
            /Senha alterada/,
        );
    });

    it("explains a failed confirmation link", () => {
        const search = signInSearchSchema.parse({ error: "TOKEN_EXPIRED" });

        assert.match(toSignInNotice(search) ?? "", /expirou/);
    });

    it("ignores values it does not know instead of failing the page", () => {
        const search = signInSearchSchema.parse({ reset: "other", error: "x".repeat(500) });

        assert.equal(toSignInNotice(search), null);
    });
});
