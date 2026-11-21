/*
 * Synthesizes the film's sound in stereo: a slow lo-fi bed (electric piano through a small reverb,
 * a round bass and soft swung drums) plus small effects on the cues the scenes register.
 * When `includeMusic` is false only the effects are written, so a real track can be mixed in.
 */

const SAMPLE_RATE = 48000;
const TEMPO = 82;
const BEAT_SECONDS = 60 / TEMPO;
const BEATS_PER_BAR = 4;
const SWING = 0.12;
const INTRO_BARS = 2;
const OUTRO_BARS = 2;
const MUSIC_GAIN = 0.7;
const FADE_IN_SECONDS = 1.2;
const FADE_OUT_SECONDS = 2.5;

// Fmaj9, Em7, Dm9, Cmaj9: root for the bass, voicing for the piano (MIDI notes).
const PROGRESSION = [
    { root: 41, voicing: [57, 60, 64, 67] },
    { root: 40, voicing: [55, 59, 62, 64] },
    { root: 38, voicing: [53, 57, 60, 64] },
    { root: 36, voicing: [52, 55, 59, 62] },
];

// A sparse top line, one entry per bar of the loop: [beat, interval above the voicing's top note].
const MELODY = [
    [
        [1.5, 0],
        [2.5, -3],
    ],
    [[2, 0]],
    [
        [1.5, 0],
        [3, 2],
    ],
    [[2.5, -1]],
];

function toFrequency(note) {
    return 440 * 2 ** ((note - 69) / 12);
}

function createRandom(seed) {
    const state = { value: seed };

    return () => {
        state.value = (state.value * 1664525 + 1013904223) % 4294967296;

        return state.value / 4294967296 - 0.5;
    };
}

function createBus(length) {
    return { left: new Float32Array(length), right: new Float32Array(length) };
}

function addSample(bus, index, value, pan) {
    if (index < 0 || index >= bus.left.length) {
        return;
    }

    bus.left[index] += value * (1 - Math.max(0, pan));
    bus.right[index] += value * (1 + Math.min(0, pan));
}

/* ---------- Instruments ---------- */

function addElectricPiano(bus, options) {
    const { start, duration, note, velocity, pan = 0 } = options;
    const frequency = toFrequency(note);
    const first = Math.floor(start * SAMPLE_RATE);
    const length = Math.floor((duration + 0.8) * SAMPLE_RATE);
    const release = duration * SAMPLE_RATE;

    for (let index = 0; index < length; index += 1) {
        const time = index / SAMPLE_RATE;
        const brightness = 1.4 * Math.exp(-time * 5) + 0.15;
        const modulator = Math.sin(2 * Math.PI * frequency * time) * brightness;
        const tine = Math.sin(2 * Math.PI * frequency * 7 * time) * Math.exp(-time * 30) * 0.05;
        const body = Math.sin(2 * Math.PI * frequency * time + modulator) + tine;
        const tail = Math.min(1, Math.max(0, (length - index) / (length - release)));
        const envelope = Math.min(1, time / 0.006) * Math.exp(-time * 1.4) * tail;
        addSample(bus, first + index, body * envelope * velocity, pan);
    }
}

function addBass(bus, options) {
    const { start, duration, note } = options;
    const frequency = toFrequency(note);
    const first = Math.floor(start * SAMPLE_RATE);
    const length = Math.floor(duration * SAMPLE_RATE);

    for (let index = 0; index < length; index += 1) {
        const time = index / SAMPLE_RATE;
        const share = index / length;
        const tone =
            Math.sin(2 * Math.PI * frequency * time) +
            0.25 * Math.sin(4 * Math.PI * frequency * time);
        const envelope = Math.min(1, time / 0.012) * Math.exp(-time * 1.8) * (1 - share ** 4);
        addSample(bus, first + index, Math.tanh(tone * 1.4) * envelope * 0.16, 0);
    }
}

function addKick(bus, start) {
    const first = Math.floor(start * SAMPLE_RATE);
    const length = Math.floor(0.35 * SAMPLE_RATE);
    const phase = { value: 0 };

    for (let index = 0; index < length; index += 1) {
        const time = index / SAMPLE_RATE;
        phase.value += (2 * Math.PI * (45 + 70 * Math.exp(-time * 28))) / SAMPLE_RATE;
        const envelope = Math.exp(-time * 11);
        addSample(bus, first + index, Math.sin(phase.value) * envelope * 0.32, 0);
    }
}

function addNoiseHit(bus, options) {
    const { start, duration, decay, amplitude, pan, random, isBright } = options;
    const first = Math.floor(start * SAMPLE_RATE);
    const length = Math.floor(duration * SAMPLE_RATE);
    const filter = { low: 0, lower: 0 };

    for (let index = 0; index < length; index += 1) {
        const time = index / SAMPLE_RATE;
        const white = random();
        filter.low += (white - filter.low) * 0.35;
        filter.lower += (white - filter.lower) * 0.04;
        const band = filter.low - filter.lower;
        const sample = (white - filter.low) * Number(isBright) + band * Number(isBright === false);
        addSample(bus, first + index, sample * Math.exp(-time * decay) * amplitude, pan);
    }
}

function addSnare(bus, start, random) {
    addNoiseHit(bus, {
        start,
        duration: 0.25,
        decay: 20,
        amplitude: 0.22,
        pan: 0.05,
        random,
        isBright: false,
    });
    const first = Math.floor(start * SAMPLE_RATE);

    for (let index = 0; index < 0.08 * SAMPLE_RATE; index += 1) {
        const time = index / SAMPLE_RATE;
        const body = Math.sin(2 * Math.PI * 185 * time) * Math.exp(-time * 40) * 0.05;
        addSample(bus, first + index, body, 0);
    }
}

function addHat(bus, start, options) {
    const { amplitude, random } = options;
    addNoiseHit(bus, {
        start,
        duration: 0.06,
        decay: 70,
        amplitude,
        pan: 0.3,
        random,
        isBright: true,
    });
}

/* ---------- Arrangement ---------- */

function swungTime(barStart, beat) {
    const isOffbeat = beat % 1 === 0.5;

    return barStart + (beat + SWING * Number(isOffbeat)) * BEAT_SECONDS;
}

function addBar(buses, bar, barCount) {
    const { keys, rhythm, random } = buses;
    const barStart = bar * BEATS_PER_BAR * BEAT_SECONDS;
    const chord = PROGRESSION[bar % PROGRESSION.length];
    const isFinalBar = bar === barCount - 1;
    const hasDrums = bar >= INTRO_BARS && bar < barCount - OUTRO_BARS;

    chord.voicing.forEach((note, index) => {
        const pan = (index - 1.5) * 0.18;
        addElectricPiano(keys, {
            start: barStart + index * 0.018,
            duration: BEAT_SECONDS * (2.2 + 2 * Number(isFinalBar)),
            note,
            velocity: 0.07,
            pan,
        });

        if (isFinalBar) {
            return;
        }

        addElectricPiano(keys, {
            start: swungTime(barStart, 2.5) + index * 0.012,
            duration: BEAT_SECONDS * 1.2,
            note,
            velocity: 0.04,
            pan,
        });
    });
    addMelody(keys, { bar, barStart, chord });
    addBass(rhythm, { start: barStart, duration: BEAT_SECONDS * 2.2, note: chord.root });

    if (isFinalBar === false) {
        addBass(rhythm, {
            start: swungTime(barStart, 2.5),
            duration: BEAT_SECONDS * 1.3,
            note: chord.root,
        });
    }

    if (hasDrums === false) {
        return;
    }

    addKick(rhythm, barStart);
    addKick(rhythm, swungTime(barStart, 2.5));
    addSnare(rhythm, barStart + BEAT_SECONDS, random);
    addSnare(rhythm, barStart + 3 * BEAT_SECONDS, random);

    for (let eighth = 0; eighth < BEATS_PER_BAR * 2; eighth += 1) {
        const amplitude = 0.05 + 0.03 * Number(eighth % 2 === 0);
        addHat(rhythm, swungTime(barStart, eighth / 2), { amplitude, random });
    }
}

function addMelody(keys, options) {
    const { bar, barStart, chord } = options;
    const isMelodySection = bar >= INTRO_BARS * 2;

    if (isMelodySection === false) {
        return;
    }

    const topNote = chord.voicing[chord.voicing.length - 1] + 12;
    MELODY[bar % MELODY.length].forEach(([beat, interval]) => {
        addElectricPiano(keys, {
            start: swungTime(barStart, beat),
            duration: BEAT_SECONDS * 0.9,
            note: topNote + interval,
            velocity: 0.05,
            pan: -0.15,
        });
    });
}

/* ---------- Processing ---------- */

function lowPass(channel, cutoff) {
    const amount = 1 - Math.exp((-2 * Math.PI * cutoff) / SAMPLE_RATE);
    const state = { value: 0 };

    for (let index = 0; index < channel.length; index += 1) {
        state.value += (channel[index] - state.value) * amount;
        channel[index] = state.value;
    }
}

function createComb(delaySeconds) {
    return { buffer: new Float32Array(Math.floor(delaySeconds * SAMPLE_RATE)), index: 0, low: 0 };
}

function runComb(comb, input) {
    const output = comb.buffer[comb.index];
    comb.low += (output - comb.low) * 0.45;
    comb.buffer[comb.index] = input + comb.low * 0.8;
    comb.index = (comb.index + 1) % comb.buffer.length;

    return output;
}

function runAllPass(filter, input) {
    const delayed = filter.buffer[filter.index];
    const output = delayed - input * 0.6;
    filter.buffer[filter.index] = input + delayed * 0.6;
    filter.index = (filter.index + 1) % filter.buffer.length;

    return output;
}

function reverbChannel(channel, spread) {
    const combs = [0.0297, 0.0371, 0.0411, 0.0437].map((delay) => createComb(delay + spread));
    const allPasses = [0.005, 0.0017].map((delay) => createComb(delay + spread / 3));
    const wet = new Float32Array(channel.length);

    for (let index = 0; index < channel.length; index += 1) {
        const input = channel[index];
        const combined = combs.reduce((sum, comb) => sum + runComb(comb, input), 0) / 4;
        wet[index] = allPasses.reduce((signal, filter) => runAllPass(filter, signal), combined);
    }

    return wet;
}

function addReverb(bus, mix) {
    const wetLeft = reverbChannel(bus.left, 0);
    const wetRight = reverbChannel(bus.right, 0.0023);

    for (let index = 0; index < bus.left.length; index += 1) {
        bus.left[index] += wetLeft[index] * mix;
        bus.right[index] += wetRight[index] * mix;
    }
}

function buildMusic(length, duration) {
    const keys = createBus(length);
    const rhythm = createBus(length);
    const buses = { keys, rhythm, random: createRandom(11) };
    const barCount = Math.ceil(duration / (BEATS_PER_BAR * BEAT_SECONDS));

    for (let bar = 0; bar < barCount; bar += 1) {
        addBar(buses, bar, barCount);
    }

    lowPass(keys.left, 3200);
    lowPass(keys.right, 3200);
    addReverb(keys, 0.9);
    const music = createBus(length);

    for (let index = 0; index < length; index += 1) {
        const time = index / SAMPLE_RATE;
        const fade = Math.min(
            1,
            time / FADE_IN_SECONDS,
            Math.max(0, (duration - time) / FADE_OUT_SECONDS),
        );
        music.left[index] = (keys.left[index] + rhythm.left[index]) * fade * MUSIC_GAIN;
        music.right[index] = (keys.right[index] + rhythm.right[index]) * fade * MUSIC_GAIN;
    }

    lowPass(music.left, 9000);
    lowPass(music.right, 9000);

    return music;
}

/* ---------- Effects ---------- */

function addTone(bus, options) {
    const { start, duration, from, to = from, amplitude, decay = 8, attack = 0.004 } = options;
    const first = Math.floor(start * SAMPLE_RATE);
    const length = Math.floor(duration * SAMPLE_RATE);
    const phase = { value: 0 };

    for (let index = 0; index < length; index += 1) {
        const time = index / SAMPLE_RATE;
        phase.value += (2 * Math.PI * (from + (to - from) * (index / length))) / SAMPLE_RATE;
        const envelope = Math.min(1, time / attack) * Math.exp(-time * decay);
        addSample(bus, first + index, Math.sin(phase.value) * envelope * amplitude, 0);
    }
}

function addSwell(bus, start, random) {
    const first = Math.floor(start * SAMPLE_RATE);
    const length = Math.floor(0.4 * SAMPLE_RATE);
    const filtered = { value: 0 };

    for (let index = 0; index < length; index += 1) {
        filtered.value += (random() - filtered.value) * 0.05;
        const envelope = Math.sin(Math.PI * (index / length));
        addSample(bus, first + index, filtered.value * envelope * 0.3, 0);
    }
}

function createEffects(random) {
    return {
        pop: (bus, start) =>
            addTone(bus, { start, duration: 0.14, from: 480, to: 900, amplitude: 0.18, decay: 30 }),
        hop: (bus, start) =>
            addTone(bus, { start, duration: 0.12, from: 520, to: 760, amplitude: 0.07, decay: 30 }),
        blip: (bus, start) =>
            addTone(bus, { start, duration: 0.09, from: 1320, amplitude: 0.06, decay: 45 }),
        tick: (bus, start) =>
            addNoiseHit(bus, {
                start,
                duration: 0.018,
                decay: 120,
                amplitude: 0.2,
                pan: 0,
                random,
                isBright: true,
            }),
        click: (bus, start) => {
            addNoiseHit(bus, {
                start,
                duration: 0.012,
                decay: 200,
                amplitude: 0.35,
                pan: 0,
                random,
                isBright: true,
            });
            addTone(bus, { start, duration: 0.05, from: 1700, amplitude: 0.07, decay: 80 });
        },
        whoosh: (bus, start) => addSwell(bus, start, random),
        ding: (bus, start) => {
            addTone(bus, { start, duration: 1.2, from: 1046.5, amplitude: 0.1, decay: 4 });
            addTone(bus, {
                start: start + 0.09,
                duration: 1.2,
                from: 1568,
                amplitude: 0.08,
                decay: 4,
            });
        },
    };
}

/* ---------- Output ---------- */

function toWave(bus) {
    const frameCount = bus.left.length;
    const dataSize = frameCount * 4;
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write("WAVEfmt ", 8);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(2, 22);
    header.writeUInt32LE(SAMPLE_RATE, 24);
    header.writeUInt32LE(SAMPLE_RATE * 4, 28);
    header.writeUInt16LE(4, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);
    const samples = Buffer.alloc(dataSize);

    for (let index = 0; index < frameCount; index += 1) {
        samples.writeInt16LE(Math.round(Math.tanh(bus.left[index]) * 32000), index * 4);
        samples.writeInt16LE(Math.round(Math.tanh(bus.right[index]) * 32000), index * 4 + 2);
    }

    return Buffer.concat([header, samples]);
}

/** Returns a stereo 16-bit WAV file for a film of `duration` seconds with the given cues. */
export function buildSoundTrack(duration, sounds, options = { includeMusic: true }) {
    if (Number.isFinite(duration) === false || duration <= 0) {
        throw new RangeError("The film duration must be a positive number of seconds.");
    }

    const length = Math.ceil(duration * SAMPLE_RATE);
    const mix = createBus(length);

    if (options.includeMusic === true) {
        const music = buildMusic(length, duration);
        mix.left.set(music.left);
        mix.right.set(music.right);
    }

    const effects = createEffects(createRandom(7));
    sounds.forEach((sound) => {
        const effect = effects[sound.type];

        if (effect === undefined) {
            throw new Error(`Unknown sound cue "${sound.type}".`);
        }

        effect(mix, sound.time);
    });

    return toWave(mix);
}
