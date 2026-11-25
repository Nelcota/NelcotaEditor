import { describe, expect, it } from "vitest";
import { formatProcessedTime, toCrewStats } from "#/modules/videos/model/crew-stats";
import type { UsageSummary } from "#/modules/videos/model/video-views";

function createUsage(overrides: Partial<UsageSummary>): UsageSummary {
    return {
        videoCount: 1,
        readyVideoCount: 1,
        processedSeconds: 19,
        selectedClipCount: 1,
        readyClipCount: 1,
        clipsThisMonth: 1,
        storage: { totalBytes: 0, clipBytes: 0, sourceBytes: 0, reservedBytes: 0 },
        storageQuotaBytes: 1,
        ...overrides,
    };
}

describe("formatProcessedTime", () => {
    it("counts seconds for a video shorter than a minute", () => {
        expect(formatProcessedTime(19)).toBe("19 s");
    });

    it("counts minutes and hours from a minute on", () => {
        expect(formatProcessedTime(300)).toBe("5 min");
        expect(formatProcessedTime(5400)).toBe("1 h 30 min");
    });

    it("shows zero minutes when nothing was transcribed", () => {
        expect(formatProcessedTime(0)).toBe("0 min");
    });
});

describe("toCrewStats", () => {
    it("says one ready video in the singular", () => {
        const stats = toCrewStats(createUsage({ readyVideoCount: 1 }));

        expect(stats[0]?.detail).toBe("1 pronto");
    });

    it("says several ready videos in the plural", () => {
        const stats = toCrewStats(createUsage({ videoCount: 3, readyVideoCount: 2 }));

        expect(stats[0]?.detail).toBe("2 prontos");
    });
});
