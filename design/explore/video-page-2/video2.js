/* Video page, second round. Reuses data and helpers from ../video-page/video.js (loaded first). */

function headerNow() {
    return `<header class="vhead2">
        <div class="thumb"></div>
        <div style="display:grid;gap:10px">
            <div class="title-row"><h1 class="vtitle">${VIDEO.title}</h1><span class="btn btn-icon">${icon("dots", 18)}</span></div>
            <div class="vmeta" style="margin-top:0"><span class="status" data-tone="success">${icon("check", 15)}Pronto</span><span>${icon("link", 15)}Abrir no YouTube</span><span>${icon("calendar", 15)}${VIDEO.date}</span><span>${icon("clock", 15)}${VIDEO.duration}</span></div>
        </div>
    </header>`;
}

function segments(selectedIndex, extraStyle = "") {
    return CLIPS.map(
        (clip, index) =>
            `<span class="segment" ${index === selectedIndex ? 'data-selected="true"' : ""} style="left:${(clip.start / VIDEO.durationSeconds) * 100}%;width:${Math.max((clip.length / VIDEO.durationSeconds) * 100, 0.9)}%;${clip.failed === true ? "background:var(--destructive);" : ""}${extraStyle}"></span>`,
    ).join("");
}

function brilho(clip) {
    return `<div class="why">${mascot(STAR, 30)}<div><strong>Brilho deu ${clip.score}/100</strong> <span class="muted">— ${clip.reason}</span></div></div>`;
}

const CLIP_ACTIONS = `<span class="btn btn-primary" style="height:40px">${icon("download", 18)}Baixar corte</span><span class="btn" style="height:40px">${icon("copy", 16)}Copiar título</span>`;

/* ---------- Current (direction C, as it is in the app now) ---------- */

function currentNow() {
    const timeline = `<section class="timeline"><div style="display:flex;justify-content:space-between"><strong>De onde vêm os cortes</strong><span class="muted" style="font-size:13px">Clique num trecho para ir ao corte</span></div><div class="track">${segments(0)}</div><div class="ticks"><span>0:00</span><span>10:00</span><span>20:00</span><span>30:00</span><span>${VIDEO.duration}</span></div></section>`;
    const rows = CLIPS.slice(0, 2)
        .map(
            (clip, index) => `<article class="c-row">
        ${frame(clip, { withPlay: true, captionSize: 10, style: "width:120px" })}
        <div style="display:grid;gap:8px;align-content:start"><span class="muted" style="font-size:13px;font-weight:700">#${index + 1} · ${clip.from}–${clip.to} · ${clip.length}s</span><h3>${clip.title}</h3><p class="muted" style="font-size:14px">${clip.reason}</p>
            <div style="display:flex;gap:8px;margin-top:4px"><span class="btn btn-primary" style="height:40px">${icon("download", 16)}Baixar</span><span class="btn" style="height:40px">${icon("copy", 16)}Copiar título</span></div></div>
        <div class="meter"><span style="display:flex;align-items:center;gap:8px">${mascot(STAR, 24)}<strong>Nota do Brilho</strong></span><span style="font-size:28px;font-weight:800">${clip.score}<span class="muted" style="font-size:15px">/100</span></span><div class="bar"><span style="width:${clip.score}%"></span></div></div>
    </article>`,
        )
        .join("");

    return shell(
        `${headerNow()}${timeline}<h2 style="font-size:18px;font-weight:800">Cortes <span class="muted" style="font-size:14px;font-weight:600">8 de 8 prontos · pela nota do Brilho</span></h2><div class="c-rows">${rows}</div>`,
    );
}

/* ---------- A: theatre (player + ranked list) ---------- */

function theatreA() {
    const clip = CLIPS[0];
    const player = `<div class="player-col">
        ${frame(clip, { captionSize: 22, extra: playerControls(clip), style: "width:360px" })}
        <div style="display:flex;gap:8px">${CLIP_ACTIONS.replace('class="btn btn-primary"', 'class="btn btn-primary" style="flex:1;justify-content:center;height:40px"')}</div>
    </div>`;
    const detail = `<div class="list-col" style="gap:8px">
        <div style="display:grid;gap:10px;padding:0 4px 16px;border-bottom:1px solid var(--border);margin-bottom:6px">
            <span class="muted" style="font-size:13px;font-weight:700">CORTE 1 DE 8 · ${clip.length}s · ${clip.from}–${clip.to} no original</span>
            <h2 style="font-size:22px;font-weight:800;line-height:1.25">${clip.title}</h2>
            ${brilho(clip)}
            <div style="display:grid;gap:6px"><span class="muted" style="font-size:12px;font-weight:700">ONDE ESTÁ NO VÍDEO ORIGINAL</span><div class="mini-track">${segments(0)}</div></div>
        </div>
        <div class="list-head"><strong>Todos os cortes</strong><span class="muted" style="font-size:13px">pela nota do Brilho</span></div>
        ${CLIPS.slice(0, 6)
            .map((item, index) => clipRow(item, index, index === 0))
            .join("")}
    </div>`;

    return shell(`${headerNow()}<div class="theatre">${player}${detail}</div>`);
}

/* ---------- B: reel grid + side sheet ---------- */

function reel(clip, index, isCurrent) {
    const media =
        clip.failed === true
            ? frame(clip, { small: true })
            : frame(clip, { withScore: true, withDuration: true, captionSize: 12 });
    const note =
        clip.failed === true
            ? `<span class="row-sub" style="color:var(--destructive)">Não deu para renderizar · <u>Tentar de novo</u></span>`
            : `<span class="row-sub">#${index + 1} · ${clip.from}–${clip.to}</span>`;

    return `<article class="reel" ${isCurrent ? 'aria-current="true"' : ""}>${media}<h3>${clip.title}</h3>${note}</article>`;
}

function reelsB(withSheet) {
    const grid = `<div style="display:flex;align-items:baseline;justify-content:space-between"><h2 style="font-size:18px;font-weight:800">8 cortes <span class="muted" style="font-size:14px;font-weight:600">· pela nota do Brilho</span></h2><span class="muted" style="font-size:13px">Clique para assistir</span></div><div class="reels">${CLIPS.map((clip, index) => reel(clip, index, withSheet && index === 0)).join("")}</div>`;
    let sheet = "";

    if (withSheet === true) {
        const clip = CLIPS[0];
        sheet = `<aside class="sheet">
            <div style="display:flex;justify-content:space-between;align-items:center"><span class="muted" style="font-size:13px;font-weight:700">CORTE 1 DE 8</span><span style="display:flex;gap:4px">${icon("left")}${icon("right")}${icon("close")}</span></div>
            ${frame(clip, { captionSize: 18, extra: playerControls(clip), style: "width:250px;justify-self:center" })}
            <h2 style="font-size:19px;font-weight:800;line-height:1.25">${clip.title}</h2>
            ${brilho(clip)}
            <div style="display:flex;gap:8px">${CLIP_ACTIONS}</div>
        </aside>`;
    }

    return shell(`${headerNow()}${grid}`)
        .replace('<div class="content">', '<div class="content" style="position:relative">')
        .replace(/<\/div><\/div><\/div>$/, `</div>${sheet}</div></div>`);
}

/* ---------- C: studio (original video + scrubber + clip side by side) ---------- */

function studioC() {
    const clip = CLIPS[0];
    const playheadLeft = ((clip.start + 12) / VIDEO.durationSeconds) * 100;
    const chips = CLIPS.slice(0, 6)
        .map(
            (item, index) =>
                `<span class="clip-chip" ${index === 0 ? 'aria-current="true"' : ""}><span class="num">${index + 1}</span><span class="truncate">${item.title}</span><span class="score-pill" style="padding:2px 7px">${item.score}</span></span>`,
        )
        .join("");

    return shell(`${headerNow()}
        <div class="studio">
            <div style="display:grid;gap:12px">
                <div class="source"><span class="duration" style="right:10px;bottom:10px">23:43 / ${VIDEO.duration}</span><span class="play-big"><span>${icon("play", 22)}</span></span></div>
                <div class="scrubber">${segments(0, "opacity:.9")}<span class="playhead" style="left:${playheadLeft}%"></span></div>
                <div class="ticks"><span>0:00</span><span>10:00</span><span>20:00</span><span>30:00</span><span>${VIDEO.duration}</span></div>
            </div>
            <div style="display:grid;gap:10px">
                <span class="muted" style="font-size:12px;font-weight:700">VIRA ESTE CORTE</span>
                ${frame(clip, { captionSize: 15, extra: playerControls(clip), style: "width:230px" })}
            </div>
        </div>
        <div style="display:grid;gap:12px;padding:16px;border:1px solid var(--border);border-radius:16px;background:var(--popover)">
            <div style="display:flex;gap:16px;align-items:flex-start"><div style="flex:1;display:grid;gap:8px"><span class="muted" style="font-size:13px;font-weight:700">CORTE 1 DE 8 · ${clip.from}–${clip.to} · ${clip.length}s</span><h2 style="font-size:20px;font-weight:800">${clip.title}</h2>${brilho(clip)}</div><div style="display:grid;gap:8px">${CLIP_ACTIONS}</div></div>
        </div>
        <div class="chips-row">${chips}</div>`);
}

/* ---------- Phones ---------- */

function phoneTopNow() {
    return `<header class="phone-top">${mascot(BRAND, 30)}<strong style="flex:1">Nelcota</strong>${icon("menu")}</header>`;
}

function phoneA2() {
    const clip = CLIPS[0];

    return `<div class="phone-v">${phoneTopNow()}<div class="content">${frame(clip, { captionSize: 20, extra: playerControls(clip), style: "width:250px;height:444px;justify-self:center" })}<div style="display:flex;gap:8px"><span class="btn btn-primary" style="flex:1;justify-content:center;height:44px">${icon("download", 18)}Baixar corte</span><span class="btn btn-icon" style="height:44px;width:44px">${icon("copy", 16)}</span></div><h2 style="font-size:18px;font-weight:800">${clip.title}</h2>${brilho(clip)}<div style="display:grid;gap:4px">${CLIPS.slice(
        1,
        4,
    )
        .map((item, index) => clipRow(item, index + 1, false))
        .join("")}</div></div></div>`;
}

function phoneB2() {
    return `<div class="phone-v">${phoneTopNow()}<div class="content"><h1 style="font-size:20px;font-weight:800;line-height:1.2">${VIDEO.title}</h1><strong>8 cortes</strong><div class="reels" style="grid-template-columns:1fr 1fr">${CLIPS.slice(
        0,
        4,
    )
        .map((clip, index) => reel(clip, index, false))
        .join("")}</div></div></div>`;
}

function phoneC2() {
    const clip = CLIPS[0];

    return `<div class="phone-v">${phoneTopNow()}<div class="content"><div class="source"><span class="play-big"><span>${icon("play", 20)}</span></span></div><div class="scrubber" style="height:32px">${segments(0)}</div><div style="display:flex;gap:12px">${frame(clip, { captionSize: 10, withPlay: true, style: "width:110px;flex-shrink:0" })}<div style="display:grid;gap:8px;align-content:start"><span class="score-pill" style="justify-self:start">${icon("star", 13)}${clip.score}</span><strong style="font-size:15px">${clip.title}</strong><span class="btn btn-primary" style="justify-content:center;height:40px">${icon("download", 16)}Baixar</span></div></div><div class="chips-row">${CLIPS.slice(
        1,
        3,
    )
        .map(
            (item, index) =>
                `<span class="clip-chip"><span class="num">${index + 2}</span><span class="truncate">${item.title}</span></span>`,
        )
        .join("")}</div></div></div>`;
}

const ROUND_TWO = {
    current: currentNow,
    a: theatreA,
    b: () => reelsB(false),
    "b-sheet": () => reelsB(true),
    c: studioC,
    "phone-a": phoneA2,
    "phone-b": phoneB2,
    "phone-c": phoneC2,
};

const renderRoundTwo = ROUND_TWO[document.body.dataset.board];
document.body.innerHTML = renderRoundTwo === undefined ? "Board desconhecido" : renderRoundTwo();
