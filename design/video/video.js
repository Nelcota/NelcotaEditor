/*
 * Nelcota presentation film. Every frame is a pure function of time, so render.mjs can seek to
 * any instant and screenshot it; nothing here depends on real clocks or requestAnimationFrame.
 */

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const SCENE_FADE = 0.35;
const FINAL_FADE = 0.9;
const SPRITE_COLUMNS = 4;
const MASCOTS_PER_SPRITE = 16;
const SPRITE_URLS = ["sprites/shapes.png", "sprites/objects.png"];

const CAST = {
    nel: 15,
    host: 5,
    luna: 17,
    faisca: 24,
    tinta: 23,
    brilho: 30,
    brasa: 21,
    sorte: 28,
    guarda: 26,
    cogu: 22,
};

const ACTOR_X = 200;
const ACTOR_Y = 880;
const ACTOR_SIZE = 260;
const BUBBLE_X = 350;
const BUBBLE_Y = 770;
const BUBBLE_MAX_WIDTH = 670;
const CONTENT_LEFT = 60;
const CONTENT_TOP = 1000;
const CONTENT_WIDTH = 960;

const stage = document.getElementById("stage");
const scenes = [];
const soundEvents = [];

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function progress(time, start, duration) {
    if (duration <= 0) {
        throw new RangeError("Animation duration must be positive.");
    }

    return clamp((time - start) / duration, 0, 1);
}

function mix(from, to, amount) {
    return from + (to - from) * amount;
}

function easeOutCubic(amount) {
    return 1 - (1 - amount) ** 3;
}

function easeOutBack(amount) {
    const overshoot = 1.6;

    return 1 + (overshoot + 1) * (amount - 1) ** 3 + overshoot * (amount - 1) ** 2;
}

function easeInOutCubic(amount) {
    if (amount < 0.5) {
        return 4 * amount ** 3;
    }

    return 1 - (-2 * amount + 2) ** 3 / 2;
}

function createElement(parent, className, html) {
    const element = document.createElement("div");
    element.className = className;

    if (html !== undefined) {
        element.innerHTML = html;
    }

    parent.appendChild(element);

    return element;
}

function setBox(element, box) {
    const style = element.style;
    Object.entries(box).forEach(([key, value]) => {
        style[key] = `${value}px`;
    });
}

function setTransform(element, motion) {
    const { x = 0, y = 0, scale = 1, scaleX = 1, scaleY = 1, rotate = 0, opacity = 1 } = motion;
    const style = element.style;
    style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale * scaleX}, ${scale * scaleY})`;
    style.opacity = String(clamp(opacity, 0, 1));
}

function setVisible(element, isVisible) {
    if (isVisible === false) {
        element.style.visibility = "hidden";
        return;
    }

    element.style.visibility = "visible";
}

function paintMascot(element, mascot) {
    const sprite = Math.floor(mascot / MASCOTS_PER_SPRITE);
    const tile = mascot % MASCOTS_PER_SPRITE;
    const step = 100 / (SPRITE_COLUMNS - 1);
    const style = element.style;
    style.backgroundImage = `url(${SPRITE_URLS[sprite]})`;
    style.backgroundPosition = `${(tile % SPRITE_COLUMNS) * step}% ${Math.floor(tile / SPRITE_COLUMNS) * step}%`;
}

function createMascotElement(parent, mascot, size) {
    const element = createElement(parent, "mascot");
    paintMascot(element, mascot);
    setBox(element, { width: size, height: size });

    return element;
}

/* ---------- Building blocks ---------- */

function resolvePosition(time, start, moves) {
    return moves.reduce(
        (position, move) => {
            const amount = easeInOutCubic(progress(time, move.at, move.duration));

            return { x: mix(position.x, move.x, amount), y: mix(position.y, move.y, amount) };
        },
        { x: start.x, y: start.y },
    );
}

function resolveHop(time, hops) {
    return hops.reduce((height, at) => {
        const amount = progress(time, at, 0.42);

        if (amount <= 0 || amount >= 1) {
            return height;
        }

        return height + Math.sin(amount * Math.PI);
    }, 0);
}

function resolveTalk(time, ranges) {
    const isTalking = ranges.some(([from, until]) => time >= from && time < until);

    if (isTalking === false) {
        return 0;
    }

    return Math.abs(Math.sin(time * Math.PI * 4.2)) * 0.05;
}

function createActor(scene, options) {
    const {
        mascot,
        size,
        x,
        y,
        enter = 0,
        exit = null,
        talk = [],
        hops = [],
        moves = [],
    } = options;
    const { flicker = false, sway = false, dashFrom = null } = options;
    const shadow = createElement(scene.root, "shadow");
    const sprite = createMascotElement(scene.root, mascot, size);
    const shadowWidth = size * 0.62;
    const shadowHeight = size * 0.09;
    setBox(shadow, { width: shadowWidth, height: shadowHeight });
    scene.cue(enter, "pop");
    hops.forEach((at) => scene.cue(at, "hop"));

    scene.add((time) => {
        const isOnStage = time >= enter && (exit === null || time < exit + 0.3);
        setVisible(sprite, isOnStage);
        setVisible(shadow, isOnStage);

        if (isOnStage === false) {
            return;
        }

        const dash = resolveDash(time, enter, dashFrom);
        const position = resolvePosition(time, { x: x + dash, y }, moves);
        const scale = resolveActorScale(time, enter, exit, dashFrom);
        const lift = resolveHop(time, hops) * size * 0.28;
        const bob = Math.sin(time * Math.PI * 1.3 + mascot) * size * 0.022;
        const squash = resolveTalk(time, talk) + resolveFlicker(time, flicker);
        const rotate = resolveSway(time, sway);
        setTransform(sprite, {
            x: position.x - size / 2,
            y: position.y - size - lift - bob,
            scale,
            scaleX: 1 - squash * 0.6,
            scaleY: 1 + squash,
            rotate,
        });
        setTransform(shadow, {
            x: position.x - shadowWidth / 2,
            y: position.y - shadowHeight * 0.7,
            scale: scale * (1 - lift / (size * 0.6)),
            opacity: scale,
        });
    });
}

function resolveDash(time, enter, dashFrom) {
    if (dashFrom === null) {
        return 0;
    }

    return mix(dashFrom, 0, easeOutCubic(progress(time, enter, 0.45)));
}

function resolveActorScale(time, enter, exit, dashFrom) {
    const appear = easeOutBack(progress(time, enter, 0.5));
    const entrance = Math.max(appear, Number(dashFrom !== null));

    if (exit === null) {
        return entrance;
    }

    return entrance * (1 - easeOutCubic(progress(time, exit, 0.3)));
}

function resolveFlicker(time, isFlickering) {
    if (isFlickering === false) {
        return 0;
    }

    return (Math.sin(time * 17) + Math.sin(time * 29 + 1)) * 0.018;
}

function resolveSway(time, isSwaying) {
    if (isSwaying === false) {
        return 0;
    }

    return Math.sin(time * 1.6) * 6;
}

function splitIntoWords(parent, text) {
    return text.split(" ").map((word, index) => {
        const element = document.createElement("span");
        element.className = "word";
        element.textContent = `${word} `;

        if (index === text.split(" ").length - 1) {
            element.textContent = word;
        }

        parent.appendChild(element);

        return element;
    });
}

function createBubble(scene, options) {
    const { x, y, maxWidth = BUBBLE_MAX_WIDTH, tail = "left", lines, fontSize = 40 } = options;

    if (lines.length === 0) {
        throw new RangeError("A bubble needs at least one line.");
    }

    const bubble = createElement(scene.root, "bubble");
    const style = bubble.style;
    style.left = `${x}px`;
    style.bottom = `${HEIGHT - y}px`;
    style.maxWidth = `${maxWidth}px`;
    style.fontSize = `${fontSize}px`;

    if (tail === "bottom") {
        bubble.classList.add("tail-bottom");
    }

    const renderedLines = lines.map((line) => {
        const element = createElement(bubble, "");
        scene.cue(line.at, "blip");

        return { line, element, words: splitIntoWords(element, line.text) };
    });
    const firstLine = lines[0];
    const lastLine = lines[lines.length - 1];

    scene.add((time) => {
        const isShown = time >= firstLine.at && time < lastLine.until + 0.3;
        setVisible(bubble, isShown);

        if (isShown === false) {
            return;
        }

        const activeIndex = renderedLines.findLastIndex((item) => time >= item.line.at);
        renderedLines.forEach((item, index) => {
            item.element.style.display = "none";

            if (index === activeIndex) {
                item.element.style.display = "block";
            }
        });
        const active = renderedLines[activeIndex];
        active.words.forEach((word, index) => {
            const amount = easeOutCubic(progress(time, active.line.at + 0.08 + index * 0.04, 0.18));
            setTransform(word, { y: mix(10, 0, amount), opacity: amount });
        });
        const appear = easeOutBack(progress(time, firstLine.at, 0.38));
        const bump =
            Math.sin(Math.PI * progress(time, active.line.at, 0.26)) *
            0.025 *
            Number(activeIndex > 0);
        const vanish = 1 - easeOutCubic(progress(time, lastLine.until, 0.3));
        setTransform(bubble, {
            scale: mix(0.8, 1, appear) * vanish + bump,
            opacity: Math.min(appear * 1.5, vanish),
        });
    });
}

function talkRanges(lines) {
    return lines.map((line) => [line.at + 0.1, line.until - 0.2]);
}

function animateIn(scene, element, options) {
    const { at, duration = 0.5, dx = 0, dy = 28, scaleFrom = 1, exit = null } = options;

    scene.add((time) => {
        const amount = easeOutCubic(progress(time, at, duration));
        const leave = resolveLeave(time, exit);
        setTransform(element, {
            x: mix(dx, 0, amount),
            y: mix(dy, 0, amount) - leave * 20,
            scale: mix(scaleFrom, 1, amount),
            opacity: amount * (1 - leave),
        });
    });
}

function resolveLeave(time, exit) {
    if (exit === null) {
        return 0;
    }

    return easeOutCubic(progress(time, exit, 0.35));
}

function typeText(scene, element, options) {
    const { at, text, charactersPerSecond = 28 } = options;

    for (let index = 0; index < text.length; index += 2) {
        scene.cue(at + index / charactersPerSecond, "tick");
    }

    scene.add((time) => {
        const count = Math.floor(clamp((time - at) * charactersPerSecond, 0, text.length));
        element.textContent = text.slice(0, count);
    });
}

function countUp(scene, element, options) {
    const { at, duration, from = 0, to, format } = options;

    scene.add((time) => {
        const value = mix(from, to, easeOutCubic(progress(time, at, duration)));
        element.textContent = format(Math.round(value));
    });
}

const CURSOR_SVG =
    '<svg width="34" height="44" viewBox="0 0 34 44"><path d="M2 2 L2 36 L11 28 L17 42 L23 39 L17 26 L30 26 Z" fill="white" stroke="black" stroke-width="2.5" stroke-linejoin="round"/></svg>';

function createCursor(scene, options) {
    const { appearAt, start, moves, clicks } = options;
    const cursor = createElement(scene.root, "abs", CURSOR_SVG);
    cursor.style.filter = "drop-shadow(0 3px 4px rgb(0 0 0 / 0.5))";
    clicks.forEach((at) => scene.cue(at, "click"));

    scene.add((time) => {
        const position = resolvePosition(time, start, moves);
        const press = clicks.reduce(
            (depth, at) => depth + Math.sin(Math.PI * progress(time, at, 0.18)),
            0,
        );
        setTransform(cursor, {
            x: position.x,
            y: position.y,
            scale: 1 - press * 0.15,
            opacity: easeOutCubic(progress(time, appearAt, 0.3)),
        });
    });
}

function pressButton(scene, button, at) {
    scene.add((time) => {
        const press = Math.sin(Math.PI * progress(time, at, 0.2));
        button.style.scale = String(1 - press * 0.04);
    });
}

function createStagePill(scene, options) {
    const { step, name } = options;
    const pill = createElement(
        scene.root,
        "stage-pill",
        `<span class="step">${step}</span><b>${name}</b>`,
    );
    animateIn(scene, pill, { at: 0.05, dy: -16 });
}

/* The podcast that plays the "long video" through the whole film. */
function createStudioFrame(scene, parent, options) {
    const { left, top, width, height, hue = 255 } = options;
    const frame = createElement(parent, "studio-frame");
    setBox(frame, { left, top, width, height });
    frame.style.background = `oklch(0.36 0.05 ${hue})`;
    const stripe = createElement(frame, "wall-stripe");
    stripe.style.background = `oklch(0.42 0.06 ${hue})`;
    const lamp = createElement(frame, "abs lamp");
    setBox(lamp, {
        left: width * 0.12,
        top: height * 0.14,
        width: height * 0.13,
        height: height * 0.13,
    });
    lamp.classList.add("lamp");
    const hostSize = height * 0.52;
    const host = createMascotElement(frame, CAST.host, hostSize);
    setBox(host, { left: width / 2 - hostSize / 2, top: height * 0.84 - hostSize });
    const stand = createElement(frame, "mic-arm");
    setBox(stand, {
        left: width / 2 + hostSize * 0.36,
        top: height * 0.66,
        width: height * 0.02,
        height: height * 0.14,
    });
    const mic = createElement(frame, "mic");
    setBox(mic, {
        left: width / 2 + hostSize * 0.36 - height * 0.03,
        top: height * 0.52,
        width: height * 0.08,
        height: height * 0.16,
    });
    const plant = createElement(frame, "plant");
    setBox(plant, {
        left: width * 0.8,
        top: height * 0.6,
        width: height * 0.12,
        height: height * 0.2,
    });
    createElement(frame, "desk");

    scene.add((time) => {
        const talk = Math.abs(Math.sin(time * Math.PI * 3.1)) * 0.035;
        setTransform(host, {
            y: Math.sin(time * 2.2) * hostSize * 0.015,
            scaleX: 1 - talk * 0.5,
            scaleY: 1 + talk,
        });
        host.style.transformOrigin = "50% 100%";
    });

    return frame;
}

function createStandardSpeaker(scene, options) {
    const { mascot, lines, step, name } = options;
    createStagePill(scene, { step, name });
    createActor(scene, {
        mascot,
        size: ACTOR_SIZE,
        x: ACTOR_X,
        y: ACTOR_Y,
        enter: 0.1,
        talk: talkRanges(lines),
        ...options.actor,
    });
    createBubble(scene, { x: BUBBLE_X, y: BUBBLE_Y, lines });
}

function createCard(scene, box) {
    const card = createElement(scene.root, "card");
    setBox(card, box);

    return card;
}

/* ---------- Scenes ---------- */

function buildIntro(scene) {
    createActor(scene, {
        mascot: CAST.nel,
        size: 360,
        x: 540,
        y: 1080,
        enter: 0.3,
        talk: [[1.1, 2.3]],
        moves: [{ at: 2.6, x: 540, y: 820, duration: 0.8 }],
        hops: [0.9],
    });
    createBubble(scene, {
        x: 470,
        y: 690,
        tail: "bottom",
        lines: [{ at: 1.0, until: 2.4, text: "Oi! Eu sou o Nel." }],
    });
    const wordmark = createElement(scene.root, "headline", "Nelcota");
    setBox(wordmark, { left: 0, top: 870, width: WIDTH });
    wordmark.style.textAlign = "center";
    wordmark.style.fontSize = "190px";
    animateIn(scene, wordmark, { at: 3.0, dy: 30 });
    const tagline = createElement(
        scene.root,
        "headline muted",
        "Vídeos longos viram cortes verticais com legenda.",
    );
    setBox(tagline, { left: 120, top: 1100, width: WIDTH - 240 });
    tagline.style.textAlign = "center";
    tagline.style.fontSize = "48px";
    tagline.style.lineHeight = "1.25";
    tagline.style.fontWeight = "600";
    tagline.style.letterSpacing = "-0.01em";
    animateIn(scene, tagline, { at: 3.5, dy: 16 });
}

const HIGHLIGHT_SEGMENTS = [
    { from: 0.08, to: 0.125, score: 72 },
    { from: 0.27, to: 0.3, score: 94 },
    { from: 0.45, to: 0.49, score: 83 },
    { from: 0.62, to: 0.655, score: 79 },
    { from: 0.83, to: 0.875, score: 88 },
];

function buildProblem(scene) {
    const lines = [
        { at: 0.4, until: 2.0, text: "Essa live tem 1h12min." },
        { at: 2.2, until: 4.0, text: "No celular, quase ninguém assiste inteira." },
        { at: 4.2, until: 6.7, text: "Mas tem uns cinco trechos ótimos aí dentro." },
    ];
    createActor(scene, {
        mascot: CAST.nel,
        size: 280,
        x: 210,
        y: 1480,
        enter: 0.1,
        talk: talkRanges(lines),
    });
    createBubble(scene, { x: 370, y: 1360, lines });
    const frame = createStudioFrame(scene, scene.root, {
        left: 60,
        top: 300,
        width: 960,
        height: 540,
    });
    animateIn(scene, frame, { at: 0.2, scaleFrom: 0.96, dy: 0 });
    const bar = createElement(scene.root, "bar");
    setBox(bar, { left: 60, top: 876, width: 960, height: 14 });
    animateIn(scene, bar, { at: 0.35, dy: 0 });
    const played = createElement(bar, "fill");
    played.style.background = "var(--foreground)";
    const times = createElement(scene.root, "abs mono muted", "");
    setBox(times, { left: 60, top: 906, width: 960 });
    times.style.fontSize = "28px";
    times.style.display = "flex";
    times.style.justifyContent = "space-between";
    const current = document.createElement("span");
    const total = document.createElement("span");
    total.textContent = "1:12:04";
    times.append(current, total);
    animateIn(scene, times, { at: 0.35, dy: 0 });
    const segments = HIGHLIGHT_SEGMENTS.map((segment, index) => {
        const element = createElement(bar, "fill");
        setBox(element, { left: segment.from * 960, width: (segment.to - segment.from) * 960 });
        scene.cue(4.5 + index * 0.16, "pop");

        return element;
    });

    scene.add((time) => {
        const playedShare = mix(0.02, 0.09, time / 7);
        played.style.width = `${playedShare * 100}%`;
        played.style.opacity = String(1 - progress(time, 4.3, 0.4) * 0.7);
        const seconds = Math.floor(playedShare * 4324);
        current.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
        segments.forEach((element, index) => {
            const amount = easeOutBack(progress(time, 4.5 + index * 0.16, 0.4));
            setTransform(element, { scaleY: mix(0, 2.2, amount), opacity: Math.min(1, amount) });
        });
    });
}

function buildDialog(scene) {
    const lines = [
        { at: 0.4, until: 2.9, text: "Cola o link do YouTube ou solta o arquivo." },
        { at: 3.1, until: 5.6, text: "Escolhe quantos cortes quer. Só isso." },
    ];
    const dialog = createCard(scene, { left: 60, top: 300, width: 960, height: 640 });
    dialog.style.background = "var(--card)";
    animateIn(scene, dialog, { at: 0.1, scaleFrom: 0.97, exit: 5.9 });
    const title = createElement(dialog, "headline", "Novo vídeo");
    setBox(title, { left: 44, top: 40 });
    title.style.fontSize = "40px";
    const field = createElement(dialog, "abs");
    setBox(field, { left: 44, top: 116, width: 872, height: 104 });
    Object.assign(field.style, {
        border: "2px dashed var(--border)",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        fontSize: "28px",
        fontWeight: "600",
    });
    const placeholder = createElement(
        field,
        "muted",
        "Cole um link do YouTube ou solte um arquivo",
    );
    const typed = createElement(field, "mono", "");
    typed.style.fontSize = "28px";
    typeText(scene, typed, {
        at: 0.8,
        text: "https://youtu.be/7Kd2pQx1mWs",
        charactersPerSecond: 24,
    });
    const caret = createElement(field, "");
    setBox(caret, { width: 3, height: 34 });
    caret.style.background = "var(--primary)";
    const preview = createElement(dialog, "abs");
    setBox(preview, { left: 44, top: 244, width: 872, height: 126 });
    Object.assign(preview.style, { display: "flex", gap: "24px", alignItems: "center" });
    createStudioFrame(scene, preview, { left: 0, top: 0, width: 224, height: 126 }).style.position =
        "relative";
    const previewText = createElement(
        preview,
        "",
        '<div style="font-size:30px;font-weight:800;letter-spacing:-0.02em">Papo de Sexta #48 (ao vivo)</div><div class="muted" style="font-size:24px;margin-top:8px;font-weight:600">Canal do Cubo · 1:12:04</div>',
    );
    previewText.style.marginLeft = "0";
    animateIn(scene, preview, { at: 2.2, dy: 16 });
    const label = createElement(dialog, "abs", "Quantos cortes?");
    setBox(label, { left: 44, top: 398 });
    label.style.fontSize = "26px";
    label.style.fontWeight = "700";
    const chips = createElement(dialog, "abs");
    setBox(chips, { left: 44, top: 446 });
    chips.style.display = "flex";
    chips.style.gap = "12px";
    const chipElements = ["3", "5", "8", "10", "Outro"].map((text) =>
        createElement(chips, "chip", text),
    );
    const footer = createElement(dialog, "abs");
    setBox(footer, { left: 44, top: 548, width: 872, height: 64 });
    [CAST.faisca, CAST.tinta, CAST.brilho, CAST.brasa].forEach((mascot, index) => {
        const mini = createMascotElement(footer, mascot, 52);
        setBox(mini, { left: index * 44, top: 6 });
    });
    const button = createElement(footer, "button primary", "Gerar cortes");
    setBox(button, { left: 640, top: 0, width: 232 });
    createActor(scene, {
        mascot: CAST.nel,
        size: 280,
        x: 210,
        y: 1480,
        enter: 0.1,
        talk: talkRanges(lines),
    });
    createBubble(scene, { x: 370, y: 1360, lines });
    createCursor(scene, {
        appearAt: 3.0,
        start: { x: 900, y: 1700 },
        moves: [
            { at: 3.0, x: 60 + 44 + 88 + 30, y: 300 + 446 + 30, duration: 0.6 },
            { at: 4.3, x: 60 + 44 + 640 + 120, y: 300 + 548 + 34, duration: 0.6 },
            { at: 5.3, x: 60 + 44 + 640 + 200, y: 300 + 548 + 150, duration: 0.5 },
        ],
        clicks: [3.7, 5.1],
    });
    pressButton(scene, button, 5.1);

    scene.add((time) => {
        const isTyping = time >= 0.8;
        placeholder.style.display = "block";
        caret.style.opacity = String(Number(Math.floor(time * 2.5) % 2 === 0));

        if (isTyping) {
            placeholder.style.display = "none";
        }

        chipElements.forEach((chip) => chip.classList.remove("selected"));
        const selectedIndex = Number(time >= 3.7);
        chipElements[selectedIndex].classList.add("selected");
    });
}

const CREW_LINEUP = [
    { mascot: CAST.luna, name: "Luna", role: "fila" },
    { mascot: CAST.faisca, name: "Faísca", role: "download" },
    { mascot: CAST.tinta, name: "Tinta", role: "transcrição" },
    { mascot: CAST.brilho, name: "Brilho", role: "melhores momentos" },
    { mascot: CAST.brasa, name: "Brasa", role: "cortes" },
];

function buildCrew(scene) {
    const headline = createElement(
        scene.root,
        "headline",
        "Daí em diante, quem trabalha é a equipe.",
    );
    setBox(headline, { left: 90, top: 220, width: WIDTH - 180 });
    headline.style.textAlign = "center";
    headline.style.fontSize = "72px";
    animateIn(scene, headline, { at: 0.1 });
    CREW_LINEUP.forEach((member, index) => {
        const y = 640 + index * 250;
        const enter = 0.6 + index * 0.22;
        createActor(scene, {
            mascot: member.mascot,
            size: 210,
            x: 330,
            y,
            enter,
            hops: [3.1 + index * 0.1],
        });
        const caption = createElement(
            scene.root,
            "abs",
            `<div style="font-size:52px;font-weight:800;letter-spacing:-0.02em">${member.name}</div><div class="muted" style="font-size:34px;font-weight:600;margin-top:2px">${member.role}</div>`,
        );
        setBox(caption, { left: 480, top: y - 160, width: 520 });
        animateIn(scene, caption, { at: enter + 0.15, dx: -16, dy: 0 });
    });
}

const QUEUE_BADGE_STYLES = {
    true: "background:oklch(0.71 0.19 148 / 0.16);color:var(--primary)",
    false: "background:var(--muted);color:var(--muted-foreground)",
};

function buildLuna(scene) {
    const lines = [{ at: 0.4, until: 3.7, text: "Guardei seu lugar na fila. Você é o próximo." }];
    createStandardSpeaker(scene, {
        mascot: CAST.luna,
        lines,
        step: "Na fila",
        name: "Luna",
        actor: { sway: true },
    });
    const card = createCard(scene, {
        left: CONTENT_LEFT,
        top: CONTENT_TOP,
        width: CONTENT_WIDTH,
        height: 300,
    });
    animateIn(scene, card, { at: 0.5 });
    const rows = [
        { place: "1º", title: "Papo de Sexta #48 (ao vivo)", badge: "Próximo", isNext: true },
        { place: "2º", title: "Entrevista com a Dani", badge: "Aguardando", isNext: false },
    ];
    rows.forEach((row, index) => {
        const element = createElement(card, "abs");
        setBox(element, { left: 40, top: 40 + index * 120, width: CONTENT_WIDTH - 80, height: 96 });
        Object.assign(element.style, { display: "flex", alignItems: "center", gap: "28px" });
        const badgeStyle = QUEUE_BADGE_STYLES[String(row.isNext)];
        element.innerHTML = `<span class="mono muted" style="font-size:30px;width:56px">${row.place}</span><span style="flex:1;font-size:34px;font-weight:700">${row.title}</span><span style="font-size:24px;font-weight:700;padding:10px 20px;border-radius:999px;${badgeStyle}">${row.badge}</span>`;
        element.style.opacity = String(1 - index * 0.45);
    });
    const sleep = createElement(
        scene.root,
        "abs headline muted",
        "z<span style='font-size:0.7em'>z</span>",
    );
    setBox(sleep, { left: ACTOR_X + 100, top: ACTOR_Y - 300 });
    sleep.style.fontSize = "52px";

    scene.add((time) => {
        const drift = (time * 0.5) % 1;
        setTransform(sleep, {
            x: drift * 30,
            y: -drift * 60,
            opacity: Math.sin(drift * Math.PI) * 0.8,
        });
    });
}

function buildFaisca(scene) {
    const lines = [
        { at: 0.5, until: 4.2, text: "Buscando o vídeo no YouTube. Quatro pedaços de cada vez." },
    ];
    createStandardSpeaker(scene, {
        mascot: CAST.faisca,
        lines,
        step: "Etapa 1 de 4 · Download",
        name: "Faísca",
        actor: { dashFrom: -600 },
    });
    scene.cue(0.1, "whoosh");
    [0, 1, 2].forEach((index) => {
        const streak = createElement(scene.root, "abs");
        setBox(streak, { left: 0, top: ACTOR_Y - 220 + index * 70, height: 8 });
        streak.style.background = "oklch(0.62 0.2 300)";
        streak.style.borderRadius = "8px";
        scene.add((time) => {
            const amount = progress(time, 0.1 + index * 0.04, 0.55);
            streak.style.width = `${mix(200, 30, amount)}px`;
            setTransform(streak, {
                x: mix(-200, ACTOR_X - 190, easeOutCubic(amount)),
                opacity: Math.sin(amount * Math.PI),
            });
        });
    });
    const card = createCard(scene, {
        left: CONTENT_LEFT,
        top: CONTENT_TOP,
        width: CONTENT_WIDTH,
        height: 380,
    });
    animateIn(scene, card, { at: 0.6 });
    const label = createElement(card, "abs", "Baixando do YouTube");
    setBox(label, { left: 44, top: 40 });
    label.style.fontSize = "34px";
    label.style.fontWeight = "800";
    const percent = createElement(card, "abs headline");
    setBox(percent, { left: CONTENT_WIDTH - 260, top: 30, width: 216 });
    percent.style.fontSize = "56px";
    percent.style.textAlign = "right";
    countUp(scene, percent, { at: 0.9, duration: 3.0, to: 100, format: (value) => `${value}%` });
    const lanes = [0.92, 1.0, 0.86, 0.96].map((speed, index) => {
        const lane = createElement(card, "bar");
        setBox(lane, { left: 44, top: 130 + index * 42, width: CONTENT_WIDTH - 88, height: 18 });
        const fill = createElement(lane, "fill");

        return { fill, speed };
    });
    const footnote = createElement(card, "abs mono muted", "4 partes ao mesmo tempo");
    setBox(footnote, { left: 44, top: 312 });
    footnote.style.fontSize = "24px";

    scene.add((time) => {
        lanes.forEach(({ fill, speed }) => {
            const amount = clamp(easeOutCubic(progress(time, 0.9, 3.0)) / speed, 0, 1);
            fill.style.width = `${amount * 100}%`;
        });
    });
}

const SPOKEN_WORDS =
    "e aí que eu percebi que o problema nunca foi a câmera, era o roteiro. quando você escreve antes, a gravação leva metade do tempo.";

function buildTinta(scene) {
    const lines = [
        {
            at: 0.4,
            until: 3.6,
            text: "Escrevo cada palavra e anoto o segundo exato em que ela foi dita.",
        },
        { at: 3.8, until: 6.8, text: "E faço isso aqui mesmo, no seu computador." },
    ];
    createStandardSpeaker(scene, {
        mascot: CAST.tinta,
        lines,
        step: "Etapa 2 de 4 · Transcrição",
        name: "Tinta",
    });
    const card = createCard(scene, {
        left: CONTENT_LEFT,
        top: CONTENT_TOP,
        width: CONTENT_WIDTH,
        height: 530,
    });
    animateIn(scene, card, { at: 0.5 });
    const flow = createElement(card, "abs");
    setBox(flow, { left: 40, top: 36, width: CONTENT_WIDTH - 80 });
    Object.assign(flow.style, { display: "flex", flexWrap: "wrap", gap: "14px 12px" });
    SPOKEN_WORDS.split(" ").forEach((word, index) => {
        const seconds = (1167.4 + index * 0.31).toFixed(1);
        const minutes = Math.floor(Number(seconds) / 60);
        const rest = (Number(seconds) % 60).toFixed(1).padStart(4, "0");
        const chip = createElement(
            flow,
            "",
            `<div class="mono muted" style="font-size:17px">${minutes}:${rest}</div><div style="font-size:34px;font-weight:700">${word}</div>`,
        );
        Object.assign(chip.style, {
            padding: "8px 14px",
            borderRadius: "10px",
            background: "var(--muted)",
        });
        const at = 0.9 + index * 0.1;
        scene.cue(at, "tick");
        animateIn(scene, chip, { at, duration: 0.25, dy: 10 });
    });
    const footnote = createElement(
        card,
        "abs mono muted",
        "Áudio em pedaços de 2 min · 3 transcritos ao mesmo tempo",
    );
    setBox(footnote, { left: 40, top: 468 });
    footnote.style.fontSize = "24px";
    animateIn(scene, footnote, { at: 3.9, dy: 10 });
}

function formatClock(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildBrilho(scene) {
    const lines = [
        {
            at: 0.4,
            until: 3.6,
            text: "Leio a conversa toda atrás de trechos que se sustentam sozinhos.",
        },
        { at: 3.8, until: 6.8, text: "Cada um ganha uma nota. Esse aqui tirou 94." },
    ];
    createStandardSpeaker(scene, {
        mascot: CAST.brilho,
        lines,
        step: "Etapa 3 de 4 · Melhores momentos",
        name: "Brilho",
    });
    const card = createCard(scene, {
        left: CONTENT_LEFT,
        top: CONTENT_TOP,
        width: CONTENT_WIDTH,
        height: 560,
    });
    animateIn(scene, card, { at: 0.5 });
    const trackWidth = CONTENT_WIDTH - 80;
    const header = createElement(
        card,
        "abs",
        '<span style="font-size:30px;font-weight:800">Papo de Sexta #48</span><span class="muted mono" style="font-size:24px;margin-left:16px">1:12:04</span>',
    );
    setBox(header, { left: 40, top: 34 });
    const waveform = createElement(card, "abs");
    setBox(waveform, { left: 40, top: 100, width: trackWidth, height: 110 });
    Object.assign(waveform.style, { display: "flex", alignItems: "center", gap: "4px" });
    Array.from({ length: 90 }, (_, index) => {
        const bar = createElement(waveform, "");
        const height = 18 + Math.abs(Math.sin(index * 1.7) * Math.cos(index * 0.37)) * 86;
        Object.assign(bar.style, {
            flex: "1",
            height: `${height}px`,
            borderRadius: "4px",
            background: "var(--border)",
        });

        return bar;
    });
    const track = createElement(card, "bar");
    setBox(track, { left: 40, top: 234, width: trackWidth, height: 20 });
    const segments = HIGHLIGHT_SEGMENTS.map((segment) => {
        const fill = createElement(track, "fill");
        setBox(fill, {
            left: segment.from * trackWidth,
            width: (segment.to - segment.from) * trackWidth,
        });
        const badge = createElement(card, "abs score", String(segment.score));
        setBox(badge, { left: 40 + segment.from * trackWidth - 6, top: 270 });
        badge.style.fontSize = "24px";
        const at = 0.8 + segment.from * 2;
        scene.cue(at, "pop");

        return { segment, fill, badge, at };
    });
    const scanner = createElement(card, "abs");
    setBox(scanner, { left: 40, top: 92, width: 4, height: 172 });
    scanner.style.background = "var(--foreground)";
    scanner.style.borderRadius = "4px";
    const winner = HIGHLIGHT_SEGMENTS[1];
    const start = winner.from * 4324;
    const detail = createElement(
        card,
        "abs",
        `<div style="font-size:30px;font-weight:800">“O problema nunca foi a câmera”</div><div class="muted" style="font-size:24px;font-weight:600;margin-top:8px">${formatClock(start)} → ${formatClock(start + 38)} · Começa com uma virada clara e fecha a ideia sem depender do resto.</div>`,
    );
    setBox(detail, { left: 40, top: 350, width: trackWidth });
    animateIn(scene, detail, { at: 4.1, dy: 12 });

    scene.add((time) => {
        const sweep = progress(time, 0.8, 2.0);
        setTransform(scanner, { x: sweep * trackWidth, opacity: Math.sin(sweep * Math.PI) });
        segments.forEach(({ segment, fill, badge, at }) => {
            const amount = easeOutBack(progress(time, at, 0.35));
            const isDimmed = time >= 3.9 && segment !== winner;
            const dim = 1 - Number(isDimmed) * 0.6 * progress(time, 3.9, 0.3);
            setTransform(fill, { opacity: Math.min(1, amount) * dim });
            setTransform(badge, { scale: amount, opacity: Math.min(1, amount) * dim });
        });
    });
}

const CAPTION_PAGES = [
    ["o", "problema", "nunca"],
    ["foi", "a", "câmera,"],
    ["era", "o", "roteiro."],
];

function createCaptions(scene, parent, options) {
    const { at, top, fontSize, wordDuration } = options;
    const line = createElement(parent, "caption-line");
    setBox(line, { top });
    line.style.fontSize = `${fontSize}px`;
    const pages = CAPTION_PAGES.map((words) => {
        const page = createElement(line, "");
        const spans = words.map((word) => {
            const span = document.createElement("span");
            span.textContent = `${word} `;
            page.appendChild(span);

            return span;
        });

        return spans;
    });

    scene.add((time) => {
        const wordIndex = Math.floor((time - at) / wordDuration);
        const pageIndex = Math.floor(wordIndex / 3);
        line.style.visibility = "hidden";

        if (time < at || pageIndex >= pages.length) {
            return;
        }

        line.style.visibility = "visible";
        pages.forEach((spans, index) => {
            spans[0].parentElement.style.display = "none";

            if (index === pageIndex) {
                spans[0].parentElement.style.display = "block";
            }

            spans.forEach((span, spanIndex) => {
                span.classList.remove("on");

                if (index * 3 + spanIndex === wordIndex) {
                    span.classList.add("on");
                }
            });
        });
        const pop =
            Math.sin(Math.PI * progress(time, at + pageIndex * 3 * wordDuration, 0.2)) * 0.06;
        line.style.scale = String(1 + pop);
    });
}

function buildBrasa(scene) {
    const lines = [
        { at: 0.4, until: 3.2, text: "Corto na vertical, em 9:16." },
        { at: 3.4, until: 7.6, text: "E coloco a legenda, uma palavra de cada vez." },
    ];
    createStandardSpeaker(scene, {
        mascot: CAST.brasa,
        lines,
        step: "Etapa 4 de 4 · Cortes",
        name: "Brasa",
        actor: { flicker: true },
    });
    const frameWidth = 960;
    const frameHeight = 540;
    const frameLeft = 60;
    const frameTop = CONTENT_TOP;
    const cropWidth = (frameHeight * 9) / 16;
    const full = createStudioFrame(scene, scene.root, {
        left: frameLeft,
        top: frameTop,
        width: frameWidth,
        height: frameHeight,
    });
    animateIn(scene, full, { at: 0.4, scaleFrom: 0.97, dy: 0 });
    const dims = [0, 1].map((side) => {
        const dim = createElement(full, "abs");
        setBox(dim, {
            left: (side * (frameWidth + cropWidth)) / 2,
            top: 0,
            width: (frameWidth - cropWidth) / 2,
            height: frameHeight,
        });
        dim.style.background = "black";

        return dim;
    });
    const phone = createElement(scene.root, "phone");
    setBox(phone, {
        left: frameLeft + (frameWidth - cropWidth) / 2,
        top: frameTop,
        width: cropWidth,
        height: frameHeight,
    });
    createStudioFrame(scene, phone, {
        left: -(frameWidth - cropWidth) / 2,
        top: 0,
        width: frameWidth,
        height: frameHeight,
    }).style.borderRadius = "0";
    const guide = createElement(scene.root, "abs");
    setBox(guide, {
        left: frameLeft + (frameWidth - cropWidth) / 2,
        top: frameTop,
        width: cropWidth,
        height: frameHeight,
    });
    guide.style.border = "3px dashed white";
    guide.style.borderRadius = "6px";
    const ratio = createElement(scene.root, "abs mono", "9:16");
    setBox(ratio, { left: frameLeft + frameWidth / 2 - 40, top: frameTop - 50, width: 80 });
    ratio.style.textAlign = "center";
    ratio.style.fontSize = "28px";
    createCaptions(scene, phone, { at: 3.7, top: 420, fontSize: 28, wordDuration: 0.36 });
    scene.cue(1.0, "blip");
    scene.cue(2.2, "whoosh");

    scene.add((time) => {
        const cropAmount = easeOutCubic(progress(time, 1.0, 0.4));
        const toPhone = easeInOutCubic(progress(time, 2.2, 0.7));
        dims.forEach((dim) => {
            dim.style.opacity = String(mix(0.55 * cropAmount, 1, toPhone));
        });
        full.style.visibility = "visible";

        if (toPhone >= 1) {
            full.style.visibility = "hidden";
        }

        setVisible(phone, time >= 1.0);
        setTransform(guide, { opacity: cropAmount * (1 - toPhone) });
        setTransform(ratio, { opacity: cropAmount * (1 - toPhone), y: mix(10, 0, cropAmount) });
        phone.style.boxShadow = `0 0 0 ${mix(0, 5, toPhone)}px oklch(0.32 0.006 286)`;
        phone.style.borderRadius = `${mix(0, 22, toPhone)}px`;
        setTransform(phone, {
            y: mix(0, 60, toPhone),
            scale: mix(1, 1.45, toPhone),
        });
    });
}

const CLIPS = [
    {
        title: "O problema nunca foi a câmera",
        score: 94,
        hue: 255,
        words: ["NUNCA FOI A", "CÂMERA"],
    },
    { title: "Roteiro em dez minutos", score: 88, hue: 160, words: ["DEZ", "MINUTOS"] },
    { title: "A gravação que deu errado", score: 83, hue: 30, words: ["DEU", "ERRADO"] },
    { title: "Quanto custa um estúdio", score: 79, hue: 300, words: ["QUANTO", "CUSTA"] },
    { title: "A pergunta do chat", score: 72, hue: 200, words: ["PERGUNTA DO", "CHAT"] },
];

const SORTE_CARDS_PER_ROW = 3;

function buildSorte(scene) {
    const lines = [{ at: 0.6, until: 6.0, text: "Pronto! 5 cortes esperando por você." }];
    createActor(scene, {
        mascot: CAST.sorte,
        size: 220,
        x: 200,
        y: 420,
        enter: 0.1,
        hops: [0.7, 3.2],
        talk: talkRanges(lines),
    });
    createBubble(scene, { x: 340, y: 350, lines });
    scene.cue(0.6, "ding");
    const cardWidth = 270;
    const cardHeight = 480;
    const gap = 40;
    CLIPS.forEach((clip, index) => {
        const row = Math.floor(index / SORTE_CARDS_PER_ROW);
        const column = index % SORTE_CARDS_PER_ROW;
        const cardsInRow = Math.min(SORTE_CARDS_PER_ROW, CLIPS.length - row * SORTE_CARDS_PER_ROW);
        const rowLeft = (WIDTH - (cardsInRow * cardWidth + (cardsInRow - 1) * gap)) / 2;
        const left = rowLeft + column * (cardWidth + gap);
        const group = createElement(scene.root, "abs");
        setBox(group, { left, top: 500 + row * 640, width: cardWidth });
        const phone = createElement(group, "phone");
        setBox(phone, { left: 0, top: 0, width: cardWidth, height: cardHeight });
        phone.style.boxShadow = "0 0 0 5px oklch(0.32 0.006 286)";
        const frameWidth = (cardHeight * 16) / 9;
        createStudioFrame(scene, phone, {
            left: -(frameWidth - cardWidth) / 2,
            top: 0,
            width: frameWidth,
            height: cardHeight,
            hue: clip.hue,
        });
        const caption = createElement(
            phone,
            "caption-line",
            `${clip.words[0]} <span class="on">${clip.words[1]}</span>`,
        );
        setBox(caption, { top: 380 });
        caption.style.fontSize = "28px";
        const meta = createElement(
            group,
            "abs",
            `<div style="font-size:24px;font-weight:700;line-height:1.25;min-height:60px">${clip.title}</div><div style="margin-top:12px"><span class="score" style="font-size:20px">Nota ${clip.score}</span></div>`,
        );
        setBox(meta, { left: 0, top: cardHeight + 22, width: cardWidth });
        const at = 0.9 + index * 0.14;
        scene.cue(at, "pop");
        animateIn(scene, group, { at, duration: 0.55, dy: 60 });
    });
}

const RECOVERY_LEFT = 60;
const RECOVERY_TOPS = [460, 1060];
const RECOVERY_HEIGHT = 540;

function buildRecovery(scene) {
    const headline = createElement(scene.root, "headline", "E quando algo dá errado?");
    setBox(headline, { left: 60, top: 180, width: WIDTH - 120 });
    headline.style.textAlign = "center";
    headline.style.fontSize = "72px";
    animateIn(scene, headline, { at: 0.1 });
    const panels = [
        {
            mascot: CAST.guarda,
            top: RECOVERY_TOPS[0],
            enter: 0.5,
            pill: "Falhou",
            pillStyle: "background:oklch(0.64 0.21 25 / 0.18);color:oklch(0.75 0.17 25)",
            title: "O YouTube bloqueou o download.",
            speaker: "Guarda",
            quote: "“A nova tentativa continua de onde parou, sem começar do zero.”",
            button: "Tentar de novo",
            buttonClass: "primary",
        },
        {
            mascot: CAST.cogu,
            top: RECOVERY_TOPS[1],
            enter: 1.0,
            pill: "Cancelado",
            pillStyle: "background:oklch(0.6 0.15 300 / 0.2);color:oklch(0.8 0.12 300)",
            title: "Você cancelou no meio.",
            speaker: "Cogu",
            quote: "“Guardei o que já estava pronto. Retome quando quiser.”",
            button: "Retomar",
            buttonClass: "secondary",
        },
    ];
    const buttons = panels.map((panel) => {
        const card = createCard(scene, {
            left: RECOVERY_LEFT,
            top: panel.top,
            width: WIDTH - 2 * RECOVERY_LEFT,
            height: RECOVERY_HEIGHT,
        });
        animateIn(scene, card, { at: panel.enter - 0.2, dy: 30 });
        createActor(scene, {
            mascot: panel.mascot,
            size: 230,
            x: RECOVERY_LEFT + 165,
            y: panel.top + 320,
            enter: panel.enter,
        });
        const text = createElement(
            card,
            "abs",
            `<span style="font-size:22px;font-weight:700;padding:8px 16px;border-radius:999px;${panel.pillStyle}">${panel.pill}</span><div style="font-size:36px;font-weight:800;letter-spacing:-0.02em;line-height:1.15;margin-top:22px">${panel.title}</div><div class="muted" style="font-size:26px;font-weight:600;line-height:1.35;margin-top:18px"><b style="color:var(--foreground)">${panel.speaker}:</b> ${panel.quote}</div>`,
        );
        setBox(text, { left: 310, top: 50, width: 600 });
        const button = createElement(card, `button ${panel.buttonClass}`, panel.button);
        setBox(button, { left: 310, top: 390 });
        animateIn(scene, text, { at: panel.enter + 0.2, dy: 14 });
        animateIn(scene, button, { at: panel.enter + 0.3, dy: 14 });

        return button;
    });
    const resumeBar = createElement(scene.root, "bar");
    const buttonLeft = RECOVERY_LEFT + 310;
    const buttonTop = RECOVERY_TOPS[0] + 390;
    setBox(resumeBar, { left: buttonLeft, top: buttonTop + 84, width: 560, height: 10 });
    const resumeFill = createElement(resumeBar, "fill");
    createCursor(scene, {
        appearAt: 2.0,
        start: { x: 900, y: 1700 },
        moves: [
            { at: 2.0, x: buttonLeft + 250, y: buttonTop + 34, duration: 0.8 },
            { at: 3.4, x: buttonLeft + 460, y: buttonTop + 150, duration: 0.6 },
        ],
        clicks: [3.0],
    });
    pressButton(scene, buttons[0], 3.0);

    scene.add((time) => {
        const isResuming = time >= 3.1;
        buttons[0].textContent = "Tentar de novo";

        if (isResuming) {
            buttons[0].textContent = "Retomando de 62%";
        }

        setTransform(resumeBar, { opacity: progress(time, 3.1, 0.3) });
        resumeFill.style.width = `${mix(62, 78, progress(time, 3.3, 2.8))}%`;
    });
}

const MEASURED_STEPS = [
    { mascot: CAST.tinta, seconds: 47, label: "transcrevendo" },
    { mascot: CAST.brilho, seconds: 3, label: "escolhendo os trechos" },
    { mascot: CAST.brasa, seconds: 9, label: "montando 4 cortes" },
];

function buildNumbers(scene) {
    const headline = createElement(
        scene.root,
        "headline",
        'Um vídeo de 10 minutos vira 4 cortes<br><span style="color:var(--primary)">em cerca de 1 minuto.</span>',
    );
    setBox(headline, { left: 60, top: 220, width: WIDTH - 120 });
    headline.style.textAlign = "center";
    headline.style.fontSize = "80px";
    animateIn(scene, headline, { at: 0.1 });
    MEASURED_STEPS.forEach((step, index) => {
        const rowTop = 720 + index * 250;
        const enter = 0.8 + index * 0.25;
        createActor(scene, { mascot: step.mascot, size: 180, x: 270, y: rowTop + 190, enter });
        const value = createElement(scene.root, "abs headline");
        setBox(value, { left: 420, top: rowTop + 20, width: 560 });
        value.style.fontSize = "100px";
        countUp(scene, value, {
            at: enter + 0.2,
            duration: 1.2,
            to: step.seconds,
            format: (amount) => `${amount} s`,
        });
        const label = createElement(scene.root, "abs muted", step.label);
        setBox(label, { left: 424, top: rowTop + 136, width: 560 });
        label.style.fontSize = "34px";
        label.style.fontWeight = "600";
        animateIn(scene, value, { at: enter, dy: 14 });
        animateIn(scene, label, { at: enter + 0.1, dy: 14 });
    });
    const footnote = createElement(
        scene.root,
        "abs muted",
        "Medido num computador comum de 8 núcleos, com vídeo em 720p.",
    );
    setBox(footnote, { left: 110, top: 1520, width: WIDTH - 220 });
    footnote.style.textAlign = "center";
    footnote.style.fontSize = "28px";
    footnote.style.lineHeight = "1.4";
    animateIn(scene, footnote, { at: 1.9, dy: 10 });
}

const OUTRO_CREW = [
    CAST.luna,
    CAST.faisca,
    CAST.tinta,
    CAST.brilho,
    CAST.brasa,
    CAST.sorte,
    CAST.guarda,
    CAST.cogu,
];

function buildOutro(scene) {
    OUTRO_CREW.forEach((mascot, index) => {
        const column = index % 4;
        const row = Math.floor(index / 4);
        createActor(scene, {
            mascot,
            size: 170,
            x: 180 + column * 240,
            y: 1440 + row * 210,
            enter: 0.5 + index * 0.1,
            hops: [2.6 + index * 0.08],
        });
    });
    createActor(scene, { mascot: CAST.nel, size: 360, x: 540, y: 760, enter: 0.1, hops: [1.6] });
    const wordmark = createElement(scene.root, "headline", "Nelcota");
    setBox(wordmark, { left: 0, top: 800, width: WIDTH });
    wordmark.style.textAlign = "center";
    wordmark.style.fontSize = "190px";
    animateIn(scene, wordmark, { at: 1.0, dy: 20 });
    const tagline = createElement(scene.root, "headline muted", "Vídeo longo entra. Cortes saem.");
    setBox(tagline, { left: 60, top: 1030, width: WIDTH - 120 });
    tagline.style.textAlign = "center";
    tagline.style.fontSize = "52px";
    tagline.style.fontWeight = "600";
    tagline.style.letterSpacing = "-0.01em";
    animateIn(scene, tagline, { at: 1.5, dy: 14 });
}

/* Opens on the finished product: a clip already playing, so the first frame is the payoff. */
function buildHook(scene) {
    const phoneWidth = 500;
    const phoneHeight = 889;
    const phone = createElement(scene.root, "phone");
    setBox(phone, {
        left: (WIDTH - phoneWidth) / 2,
        top: 440,
        width: phoneWidth,
        height: phoneHeight,
    });
    phone.style.boxShadow = "0 0 0 6px oklch(0.32 0.006 286)";
    const frameWidth = (phoneHeight * 16) / 9;
    createStudioFrame(scene, phone, {
        left: -(frameWidth - phoneWidth) / 2,
        top: 0,
        width: frameWidth,
        height: phoneHeight,
    });
    createCaptions(scene, phone, { at: 0, top: 640, fontSize: 44, wordDuration: 0.4 });
    const headline = createElement(
        scene.root,
        "headline",
        'Esse corte saiu de<br><span style="color:var(--primary)">uma live de 1h12.</span>',
    );
    setBox(headline, { left: 60, top: 230, width: WIDTH - 120 });
    headline.style.textAlign = "center";
    headline.style.fontSize = "68px";
    animateIn(scene, headline, { at: 0.15, dy: -16, duration: 0.4 });
    const lines = [{ at: 2.6, until: 4.6, text: "Te mostro como." }];
    createActor(scene, {
        mascot: CAST.nel,
        size: 220,
        x: 330,
        y: 1600,
        enter: 2.3,
        talk: talkRanges(lines),
    });
    createBubble(scene, { x: 470, y: 1520, lines, maxWidth: 480 });

    scene.add((time) => {
        setTransform(phone, { scale: mix(1, 1.03, progress(time, 0, 4.8)) });
    });
}

const RELAY_STEPS = [
    { mascot: CAST.faisca, name: "Faísca", task: "baixa o vídeo" },
    { mascot: CAST.tinta, name: "Tinta", task: "transcreve palavra por palavra" },
    { mascot: CAST.brilho, name: "Brilho", task: "acha os melhores trechos" },
    { mascot: CAST.brasa, name: "Brasa", task: "corta em 9:16 com legenda" },
];
const RELAY_FIRST_SLOT = 0.8;
const RELAY_SLOT = 1.6;
const RELAY_ROW_TOP = 560;
const RELAY_ROW_HEIGHT = 270;

/* The four pipeline stages in one fast pass, for the short cut. */
function buildRelay(scene) {
    const headline = createElement(scene.root, "headline", "Daí, a equipe assume.");
    setBox(headline, { left: 60, top: 260, width: WIDTH - 120 });
    headline.style.textAlign = "center";
    headline.style.fontSize = "72px";
    animateIn(scene, headline, { at: 0.1 });
    RELAY_STEPS.forEach((step, index) => {
        const slot = RELAY_FIRST_SLOT + index * RELAY_SLOT;
        const y = RELAY_ROW_TOP + index * RELAY_ROW_HEIGHT + 200;
        createRelayRow(scene, { step, slot, y, enter: 0.3 + index * 0.1 });
    });
}

function createRelayRow(scene, options) {
    const { step, slot, y, enter } = options;
    createActor(scene, { mascot: step.mascot, size: 190, x: 220, y, enter, hops: [slot] });
    const text = createElement(
        scene.root,
        "abs",
        `<div style="font-size:50px;font-weight:800;letter-spacing:-0.02em">${step.name}</div><div class="muted" style="font-size:34px;font-weight:600;margin-top:2px">${step.task}</div>`,
    );
    setBox(text, { left: 360, top: y - 170, width: 660 });
    animateIn(scene, text, { at: enter + 0.1, dx: -16, dy: 0 });
    const bar = createElement(scene.root, "bar");
    setBox(bar, { left: 360, top: y - 34, width: 560, height: 12 });
    const fill = createElement(bar, "fill");
    const check = createElement(scene.root, "abs headline", "✓");
    setBox(check, { left: 944, top: y - 62 });
    check.style.fontSize = "44px";
    check.style.color = "var(--primary)";
    scene.cue(slot + RELAY_SLOT - 0.2, "blip");

    scene.add((time) => {
        const isWaiting = time < slot;
        const amount = easeOutCubic(progress(time, slot, RELAY_SLOT - 0.3));
        fill.style.width = `${amount * 100}%`;
        text.style.filter = `brightness(${mix(0.55, 1, Number(isWaiting === false))})`;
        setTransform(bar, { opacity: progress(time, enter, 0.4) });
        const done = easeOutBack(progress(time, slot + RELAY_SLOT - 0.2, 0.3));
        setTransform(check, { scale: done, opacity: Math.min(1, done) });
    });
}

/* ---------- Timeline ---------- */

const FULL_SCRIPT = [
    { duration: 4.8, build: buildHook },
    { duration: 5.6, build: buildIntro },
    { duration: 7.0, build: buildProblem },
    { duration: 6.3, build: buildDialog },
    { duration: 4.4, build: buildCrew },
    { duration: 4.0, build: buildLuna },
    { duration: 4.5, build: buildFaisca },
    { duration: 7.0, build: buildTinta },
    { duration: 7.0, build: buildBrilho },
    { duration: 8.0, build: buildBrasa },
    { duration: 6.2, build: buildSorte },
    { duration: 6.3, build: buildRecovery },
    { duration: 5.8, build: buildNumbers },
    { duration: 6.0, build: buildOutro },
];

const SHORT_SCRIPT = [
    { duration: 4.8, build: buildHook },
    { duration: 6.3, build: buildDialog },
    { duration: 8.0, build: buildRelay },
    { duration: 6.2, build: buildSorte },
    { duration: 5.8, build: buildNumbers },
    { duration: 6.0, build: buildOutro },
];

const SCRIPTS = { full: FULL_SCRIPT, short: SHORT_SCRIPT };

function readScript() {
    const version = new URLSearchParams(window.location.search).get("version");

    if (version === null) {
        return FULL_SCRIPT;
    }

    const script = SCRIPTS[version];

    if (script === undefined) {
        throw new Error(`Unknown film version "${version}". Use "full" or "short".`);
    }

    return script;
}

function buildTimeline() {
    readScript().reduce((start, entry) => {
        const root = createElement(stage, "scene");
        const scene = {
            start,
            duration: entry.duration,
            root,
            updaters: [],
            add: (updater) => scene.updaters.push(updater),
            cue: (time, type) => soundEvents.push({ time: start + time, type }),
        };
        entry.build(scene);
        scenes.push(scene);

        if (start > 0) {
            soundEvents.push({ time: start, type: "whoosh" });
        }

        return start + entry.duration;
    }, 0);
}

function computeSceneOpacity(scene, local, isLast) {
    // The opening scene starts fully visible: a black first frame loses the viewer on a feed.
    const fadeIn = Math.max(progress(local, 0, SCENE_FADE), Number(scene.start === 0));

    if (isLast) {
        return fadeIn * (1 - progress(local, scene.duration - FINAL_FADE, FINAL_FADE));
    }

    return fadeIn * (1 - progress(local, scene.duration, SCENE_FADE));
}

function seek(time) {
    scenes.forEach((scene, index) => {
        const local = time - scene.start;
        const isLast = index === scenes.length - 1;
        const isVisible = local >= 0 && local < scene.duration + SCENE_FADE;
        scene.root.style.display = "none";

        if (isVisible === false) {
            return;
        }

        scene.root.style.display = "block";
        const opacity = computeSceneOpacity(scene, local, isLast);
        const settle = Math.max(easeOutCubic(progress(local, 0, 0.6)), Number(scene.start === 0));
        scene.root.style.opacity = String(opacity);
        scene.root.style.transform = `scale(${mix(1.02, 1, settle)})`;
        scene.updaters.forEach((update) => update(local));
    });
}

buildTimeline();

const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
const startParameter = new URLSearchParams(window.location.search).get("t");

window.film = {
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    duration: totalDuration,
    sounds: soundEvents.toSorted((first, second) => first.time - second.time),
    seek,
};

if (startParameter !== null) {
    seek(Number(startParameter));
}

if (startParameter === null) {
    const startedAt = performance.now();
    const play = () => {
        seek(((performance.now() - startedAt) / 1000) % totalDuration);
        requestAnimationFrame(play);
    };
    requestAnimationFrame(play);
}
