// Builds the player options from the demo video's real data (ACELEREI O GOLF R 4X4 DE 600CV).
const STORAGE = "../../../storage/videos/0abfb74f-16eb-4586-affb-cc2189c39e5c";
const SOURCE = `${STORAGE}/source.mp4`;
const CLIP_FILE = `${STORAGE}/clips/75275db6-60a5-426d-9deb-d40ee5635a58.mp4`;
const DURATION = 1011;
const NOW = 131;
const BUFFERED = 330;
const CLIPS = [
    { rank: 1, start: 116, end: 155, title: "A história do Golf pintado na concessionária" },
    { rank: 2, start: 28, end: 71, title: "Câmbio DQ381 de GLI no Golf 4x4" },
    { rank: 3, start: 862, end: 951, title: "O plano original: carro de levar filho na escola" },
    { rank: 4, start: 203, end: 244, title: "510 cavalos de roda e forjado" },
    { rank: 5, start: 245, end: 265, title: "Cat King e o coletor Racing Line" },
];
const SELECTED = CLIPS[0];

const pct = (seconds) => `${(seconds / DURATION) * 100}%`;
const clock = (seconds) => {
    const s = Math.round(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const icon = (name) =>
    `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${window.ICONS[name]}</svg>`;
const frame = (seconds, src = SOURCE) =>
    `<video src="${src}#t=${seconds}" muted preload="auto"></video>`;
const button = (name, extra = "") => `<span class="icon-button ${extra}">${icon(name)}</span>`;

const volume = () =>
    `<span class="volume">${button("volume")}<span class="volume-track"></span></span>`;

/* ---------- A: controls on the video ---------- */

function trackA({ hover = false, hoverAt = 128, knob = true } = {}) {
    const clips = CLIPS.map(
        (clip) =>
            `<i class="track-clip ${clip === SELECTED ? "is-selected" : ""}" style="left:${pct(clip.start)};width:${pct(clip.end - clip.start)}"></i>`,
    ).join("");
    const tip = hover
        ? `<div class="hover-tip" style="left:${pct(hoverAt)}"><div class="frame">${frame(hoverAt)}</div><div class="bubble">${clock(hoverAt)} · <b>Corte 1</b></div></div>`
        : "";

    return `<div class="track ${hover ? "is-hover" : ""}">
        <div class="track-rail">
            <i class="track-buffer" style="width:${pct(BUFFERED)}"></i>
            <i class="track-played" style="width:${pct(NOW)}"></i>
            ${clips}
            ${knob ? `<i class="track-knob" style="left:${pct(NOW)}"></i>` : ""}
        </div>${tip}
    </div>`;
}

function controlsA({ playing = false, hover = false, compact = false } = {}) {
    const clipSwitch = compact
        ? ""
        : `<span class="clip-switch">${button("prev")}<span>Corte 1 de 5</span>${button("next")}</span>`;
    const extra = compact ? "" : `${button("back10")}${button("fwd10")}`;
    const vol = compact ? button("volume") : volume();

    return `<div class="scrim"></div>
    <div class="overlay-controls">
        ${trackA({ hover })}
        <div class="control-row">
            ${button(playing ? "pause" : "play")}${extra}${vol}
            <span class="time">${clock(NOW)} <span>/ ${clock(DURATION)}</span></span>
            <span class="spacer"></span>
            ${clipSwitch}
            <span class="speed">1×</span>
            ${button("full")}
        </div>
    </div>`;
}

function playerA(options = {}) {
    const { state = "paused", compact = false } = options;
    const states = {
        paused: () => `${controlsA({ compact })}<span class="big-play">${icon("play")}</span>`,
        hover: () => controlsA({ playing: true, hover: !compact, compact }),
        playing: () =>
            `<div class="overlay-controls" style="padding:0">${trackA({ knob: false })}</div>`,
        loading: () => `${controlsA({ playing: true, compact })}<span class="spinner"></span>`,
    };

    return `<div class="player">${frame(NOW)}${states[state]()}</div>`;
}

function verticalA({ state = "paused", tiny = false } = {}) {
    if (tiny) {
        return `<div class="vertical is-tiny">${frame(14, CLIP_FILE)}<span class="big-play">${icon("play")}</span><div class="mini-controls" style="padding:0 8px 8px"><div class="thin-progress"><i style="width:36%"></i></div></div></div>`;
    }

    const center = state === "paused" ? `<span class="big-play">${icon("play")}</span>` : "";

    return `<div class="vertical">${frame(14, CLIP_FILE)}<div class="scrim"></div>${center}
        <div class="mini-controls">
            <div class="thin-progress"><i style="width:36%"></i></div>
            <div class="mini-row">${button(state === "paused" ? "play" : "pause")}<span class="time">0:14 <span>/ 0:39</span></span><span class="spacer"></span>${button("volume")}${button("full")}</div>
        </div></div>`;
}

/* ---------- B: dock under the video ---------- */

function scrubberB({ withTip = true } = {}) {
    const segments = CLIPS.map(
        (clip) =>
            `<i class="seg ${clip === SELECTED ? "is-selected" : ""}" style="left:${pct(clip.start)};width:${pct(Math.max(clip.end - clip.start, 12))}">${clip.end - clip.start > 30 ? `<b>${clip.rank}</b>` : ""}</i>`,
    ).join("");
    const tip = withTip
        ? `<span class="head-tip" style="left:${pct(NOW)}">${clock(NOW)}</span>`
        : "";

    return `<div class="scrubber"><i class="played" style="width:${pct(NOW)}"></i>${segments}<i class="head" style="left:${pct(NOW)}"></i>${tip}</div>`;
}

function ticks() {
    return `<div class="ticks">${[0, 0.25, 0.5, 0.75, 1].map((f) => `<span>${clock(DURATION * f)}</span>`).join("")}</div>`;
}

function dockB({ playing = false, compact = false } = {}) {
    if (compact) {
        return `<div class="dock">
            ${scrubberB({ withTip: false })}
            <div class="control-row">
                <span class="play-round">${icon(playing ? "pause" : "play")}</span>
                <span class="timecode">${clock(NOW)} <span>/ ${clock(DURATION)}</span></span>
                <span class="spacer"></span>
                <span class="segmented">${button("prev")}<span class="label-mid">1 de 5</span>${button("next")}</span>
            </div>
            <div class="control-row">
                <span class="toggle is-on">${icon("loop")}Só este corte</span>
                <span class="spacer"></span>
                <span class="speed">1×</span>${button("volume")}${button("full")}
            </div>
        </div>`;
    }

    return `<div class="dock">
        <div class="control-row">
            <span class="play-round">${icon(playing ? "pause" : "play")}</span>
            ${button("back10")}${button("fwd10")}
            <span class="timecode">${clock(NOW)} <span>/ ${clock(DURATION)}</span></span>
            <span class="spacer"></span>
            <span class="segmented">${button("prev")}<span class="label-mid">Corte 1 de 5</span>${button("next")}</span>
            <span class="toggle is-on">${icon("loop")}Só este corte</span>
            <span class="spacer"></span>
            <span class="speed">1×</span>${volume()}${button("full")}
        </div>
        <div class="stack" style="gap:6px">${scrubberB({ withTip: false })}${ticks()}</div>
    </div>`;
}

function playerB({ state = "paused" } = {}) {
    const states = {
        paused: "",
        playing: `<span class="flash">${icon("pause")}</span>`,
        loading: `<span class="spinner"></span>`,
    };

    return `<div class="player is-attached">${frame(NOW)}${states[state]}</div>`;
}

function verticalB() {
    return `<div class="vertical">${frame(14, CLIP_FILE)}
        <div class="mini-controls" style="padding:0"><div class="thin-progress" style="border-radius:0"><i style="width:36%;border-radius:0"></i></div></div></div>
        <div style="display:flex;align-items:center;gap:6px">
            <span class="play-round" style="width:36px;height:36px">${icon("play")}</span>
            <span class="timecode" style="font-size:13px">0:14 <span>/ 0:39</span></span>
        </div>`;
}

/* ---------- C: the clip in focus ---------- */

function focusBar({ compact = false } = {}) {
    const clipLength = SELECTED.end - SELECTED.start;
    const playedShare = ((NOW - SELECTED.start) / clipLength) * 100;
    const contextRow = compact
        ? ""
        : `<div class="focus-context">${CLIPS.map((clip) => `<i style="left:${pct(clip.start)};width:${pct(Math.max(clip.end - clip.start, 8))};opacity:${clip === SELECTED ? 1 : 0.35}"></i>`).join("")}</div>`;

    return `<div class="focus-bar">
        ${contextRow}
        <div class="focus-rail"><i class="played" style="width:${playedShare}%"></i><i class="track-knob" style="left:${playedShare}%"></i></div>
        <div class="focus-labels"><span>${clock(NOW)}</span>${compact ? "" : `<span>${clock(SELECTED.start)} → ${clock(SELECTED.end)} · ${clipLength}s</span>`}<span>${clock(SELECTED.end)}</span></div>
    </div>`;
}

function controlsC({ playing = false, compact = false } = {}) {
    const side = compact
        ? ""
        : `<span class="pill is-on">${icon("loop")}Repetir corte</span><span class="pill">Ver vídeo inteiro</span>`;

    return `<div class="scrim" style="height:60%"></div><div class="scrim-top"></div>
        <span class="corner-chip"><span class="num">1</span><span class="text">${SELECTED.title}</span></span>
        <div class="overlay-controls" style="gap:${compact ? 4 : 10}px">
            ${focusBar({ compact })}
            <div class="control-row">
                <span style="display:flex;gap:6px;flex:1">${side}</span>
                <span class="transport">${button("prev")}<span class="play-round">${icon(playing ? "pause" : "play")}</span>${button("next")}</span>
                <span style="display:flex;gap:2px;flex:1;justify-content:flex-end">${compact ? "" : '<span class="speed">1×</span>'}${button("volume")}${button("full")}</span>
            </div>
        </div>`;
}

function playerC({ state = "paused", compact = false } = {}) {
    const states = {
        paused: () => controlsC({ compact }),
        playing: () =>
            `<span class="corner-chip"><span class="num">1</span><span class="text">${SELECTED.title}</span></span><div class="overlay-controls" style="padding:0"><div class="focus-rail" style="border-radius:0;height:3px"><i class="played" style="width:38%;border-radius:0"></i></div></div>`,
        whole: () => `${controlsA({ playing: true, compact: true })}`,
        end: () =>
            `<div style="position:absolute;inset:0;background:rgb(0 0 0 / 0.65)"></div><div style="position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:12px;color:#fff;text-align:center"><span style="font-size:13px;font-weight:700;opacity:.75">Fim do corte 1 · próximo em 3 s</span><span style="font-size:16px;font-weight:800;max-width:260px">Câmbio DQ381 de GLI no Golf 4x4</span><span style="display:flex;gap:8px"><span class="pill">${icon("restart")}De novo</span><span class="pill is-on">${icon("next")}Próximo</span></span></div>`,
    };

    return `<div class="player">${frame(NOW)}${states[state]()}</div>`;
}

/* ---------- Current (native controls) ---------- */

function playerNative() {
    return `<div class="player native"><video src="${SOURCE}#t=${NOW}" controls muted preload="auto"></video></div>`;
}

function verticalNative() {
    return `<div class="vertical">${frame(14, CLIP_FILE)}<span class="big-play" style="width:48px;height:48px;margin:-24px 0 0 -24px;backdrop-filter:none">${icon("play")}</span></div>`;
}

window.P = {
    playerA,
    verticalA,
    playerB,
    dockB,
    verticalB,
    playerC,
    playerNative,
    verticalNative,
    scrubberB,
    ticks,
    clock,
    icon,
    CLIPS,
    SELECTED,
};

function studio(left, right) {
    return `<div class="studio"><div class="stack">${left}</div><div class="stack" style="gap:8px"><p class="label">Vira este corte</p>${right}</div></div>`;
}

window.P.studio = studio;
