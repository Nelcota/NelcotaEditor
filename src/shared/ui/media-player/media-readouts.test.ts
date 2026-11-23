import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toVolumeTrackBackground } from "#/shared/ui/media-player/media-readouts";

describe("toVolumeTrackBackground", () => {
    it("fills the track up to the volume level", () => {
        const background = toVolumeTrackBackground(0.5);

        assert.equal(
            background,
            "linear-gradient(to right, var(--range-fill) 50%, oklch(1 0 0 / 0.25) 50%)",
        );
    });

    it("keeps the fill between empty and full for out-of-range or invalid volumes", () => {
        assert.match(toVolumeTrackBackground(0), / 0%, /);
        assert.match(toVolumeTrackBackground(1.5), / 100%, /);
        assert.match(toVolumeTrackBackground(-1), / 0%, /);
        assert.match(toVolumeTrackBackground(Number.NaN), / 0%, /);
    });
});
