import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getPasswordVisibilityCopy, resolveInputType } from "#/shared/ui/password-visibility";

describe("resolveInputType", () => {
    test("keeps a password hidden until it is shown", () => {
        const type = resolveInputType("password", false);

        assert.equal(type, "password");
    });

    test("turns a shown password into plain text", () => {
        const type = resolveInputType("password", true);

        assert.equal(type, "text");
    });

    test("leaves fields that are not passwords untouched", () => {
        const emailType = resolveInputType("email", true);
        const missingType = resolveInputType(undefined, true);

        assert.equal(emailType, "email");
        assert.equal(missingType, undefined);
    });
});

describe("getPasswordVisibilityCopy", () => {
    test("offers to show a hidden password", () => {
        const copy = getPasswordVisibilityCopy(false);

        assert.equal(copy.buttonText, "Mostrar");
        assert.equal(copy.buttonLabel, "Mostrar senha");
    });

    test("offers to hide a shown password", () => {
        const copy = getPasswordVisibilityCopy(true);

        assert.equal(copy.buttonText, "Esconder");
        assert.equal(copy.buttonLabel, "Esconder senha");
    });
});
