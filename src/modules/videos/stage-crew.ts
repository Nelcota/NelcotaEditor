import type { VideoStatus } from "#/modules/videos/video-status";

/**
 * The crew: one "object" mascot (indexes 16–31 of the shared sprite set) per processing stage.
 * Each was picked for what its shape suggests, but the stage is always also written in words.
 */
const CREW_MASCOTS = {
    moon: 17,
    mushroom: 22,
    fire: 21,
    octopus: 23,
    lightning: 24,
    shield: 26,
    clover: 28,
    star: 30,
} as const;

export const STAGE_CREW: Record<VideoStatus, number> = {
    // Waiting its turn, asleep.
    queued: CREW_MASCOTS.moon,
    // Speed.
    downloading: CREW_MASCOTS.lightning,
    // Many arms, writing everything down.
    transcribing: CREW_MASCOTS.octopus,
    // Picks the stars of the video.
    selecting: CREW_MASCOTS.star,
    // Heats up the clips.
    rendering: CREW_MASCOTS.fire,
    // It went well.
    done: CREW_MASCOTS.clover,
    // Something blocked the way.
    failed: CREW_MASCOTS.shield,
    // Sits still, by choice. Purple keeps it apart from the green octopus at small sizes.
    cancelled: CREW_MASCOTS.mushroom,
};

/** The crew members that do the work, in pipeline order, for illustrations of the whole team. */
export const WORKING_CREW: ReadonlyArray<number> = [
    STAGE_CREW.downloading,
    STAGE_CREW.transcribing,
    STAGE_CREW.selecting,
    STAGE_CREW.rendering,
];
