import { availableParallelism } from "node:os";
import { createConcurrencyLimit } from "#/shared/server/create-concurrency-limit.server";
import { getEnvironment } from "#/shared/server/env.server";

const TARGET_CPUS_PER_RENDER = 3;
const MAX_DECODER_THREADS = 2;
const MAX_ENCODER_THREADS = 3;

interface ClipRenderCapacity {
    cpuBudget: number;
    concurrency: number;
    decoderThreads: string;
    encoderThreads: string;
    slots: ReturnType<typeof createConcurrencyLimit>;
}

function createClipRenderCapacity(): ClipRenderCapacity {
    const availableCpus = availableParallelism();
    const environment = getEnvironment();
    const cpuBudget = Math.min(availableCpus, environment.FFMPEG_CPU_BUDGET ?? availableCpus);
    const concurrency =
        environment.CLIP_RENDER_CONCURRENCY ?? Math.ceil(cpuBudget / TARGET_CPUS_PER_RENDER);
    const threadOverride = environment.CLIP_RENDER_THREADS;

    return {
        cpuBudget,
        concurrency,
        decoderThreads: String(threadOverride ?? Math.min(cpuBudget, MAX_DECODER_THREADS)),
        encoderThreads: String(threadOverride ?? Math.min(cpuBudget, MAX_ENCODER_THREADS)),
        slots: createConcurrencyLimit(concurrency),
    };
}

let capacity: ClipRenderCapacity | null = null;

export function getClipRenderCapacity(): ClipRenderCapacity {
    capacity ??= createClipRenderCapacity();
    return capacity;
}
