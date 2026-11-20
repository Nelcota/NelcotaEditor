/* Video page exploration: the same video and clips drawn four ways, inside the new sidebar. */

const icon = (name, size = 20) =>
    `<svg class="icon" style="width:${size}px;height:${size}px" viewBox="0 0 24 24" aria-hidden="true">${window.SOLAR[name]}</svg>`;

function mascot(index, size = 32) {
    const set = index < 16 ? "shapes" : "objects";
    const tile = index % 16;
    const position = `${((tile % 4) * 100) / 3}% ${(Math.floor(tile / 4) * 100) / 3}%`;

    return `<span class="mascot" data-set="${set}" style="width:${size}px;height:${size}px;background-position:${position}" aria-hidden="true"></span>`;
}

const BRAND = 15;
const STAR = 30;
const SHIELD = 26;

const VIDEO = {
    title: "CARIANI E BALESTRIN FORAM NUM RESTAURANTE ITALIANO RAIZ !!!",
    duration: "35:37",
    durationSeconds: 2137,
    date: "19/11/2026",
    mascot: 6,
};

/* Ranked by score, as Brilho picked them. One failed to render. */
const CLIPS = [
    {
        title: "De fã a sócio: a transformação do Balestrin que virou negócio",
        reason: "História de transformação pessoal que emociona e reforça a marca; tem começo, virada e fecho em 34 segundos.",
        score: 90,
        from: "23:31",
        to: "24:05",
        start: 1411,
        length: 34,
        caption: ["De fã a", "sócio", "em um ano"],
        tint: 2,
    },
    {
        title: "Por que escolhemos abrir a segunda loja numa cidade pequena",
        reason: "Explica os critérios de expansão e o propósito da marca, com uma resposta direta a uma dúvida comum.",
        score: 88,
        from: "21:38",
        to: "22:27",
        start: 1298,
        length: 49,
        caption: ["Vamos", "lá", "explicar"],
        tint: 1,
    },
    {
        title: "A massa que o Cariani nunca come (e por quê)",
        reason: "Opinião forte e inesperada; gancho nos primeiros 3 segundos.",
        score: 86,
        from: "04:12",
        to: "04:51",
        start: 252,
        length: 39,
        caption: ["Essa eu", "nunca", "como"],
        tint: 3,
    },
    {
        title: "Quanto custa um prato desses de verdade",
        reason: "Números concretos que geram comentário.",
        score: 83,
        from: "11:02",
        to: "11:44",
        start: 662,
        length: 42,
        caption: ["Sabe quanto", "custa", "isso?"],
        tint: 1,
    },
    {
        title: "O garçom que reconheceu o Balestrin pela voz",
        reason: "Momento engraçado e espontâneo, bom para abrir o perfil.",
        score: 81,
        from: "07:40",
        to: "08:05",
        start: 460,
        length: 25,
        caption: ["Pela", "voz", "cara!"],
        tint: 2,
    },
    {
        title: "Dieta flexível na prática: o que eles pedem num rodízio",
        reason: "Dica prática e aplicável, conversa com o público fitness.",
        score: 79,
        from: "15:20",
        to: "16:12",
        start: 920,
        length: 52,
        caption: ["O que eu", "peço", "aqui"],
        tint: 3,
    },
    {
        title: "A sobremesa mais cara do cardápio vale a pena?",
        reason: "Pergunta clara com resposta no final; prende até o fim.",
        score: 76,
        from: "29:01",
        to: "29:40",
        start: 1741,
        length: 39,
        caption: ["Vale", "a pena", "?"],
        tint: 1,
    },
    {
        title: "Resposta à pergunta sobre treino em jejum",
        reason: "Tema polêmico tratado com calma.",
        score: 74,
        from: "32:10",
        to: "32:58",
        start: 1930,
        length: 48,
        caption: ["Jejum", "funciona", "?"],
        tint: 2,
        failed: true,
    },
];

function frame(clip, options = {}) {
    if (clip.failed === true) {
        return `<div class="frame916 failed916" style="${options.style ?? ""}">${mascot(SHIELD, options.small === true ? 24 : 44)}${options.small === true ? "" : "Guarda: não deu para renderizar"}</div>`;
    }

    const caption =
        options.small === true
            ? ""
            : `<span class="caption" style="font-size:${options.captionSize ?? 15}px">${clip.caption[0]} <mark>${clip.caption[1]}</mark> ${clip.caption[2]}</span>`;
    const score =
        options.withScore === true
            ? `<span class="score">${icon("star", 12)} ${clip.score}</span>`
            : "";
    const duration =
        options.withDuration === true ? `<span class="duration">${clip.length}s</span>` : "";
    const play =
        options.withPlay === true
            ? `<span class="play-big"><span>${icon("play", 22)}</span></span>`
            : "";

    return `<div class="frame916" data-tint="${clip.tint}" style="${options.style ?? ""}">${caption}${score}${duration}${play}${options.extra ?? ""}</div>`;
}

function playerControls(clip) {
    return `<div class="controls"><div class="scrub"><span></span></div><div class="controls-row">${icon("pause", 18)}<span>0:13 / 0:${clip.length}</span><span style="flex:1"></span>${icon("volume", 18)}${icon("fullscreen", 18)}</div></div>`;
}

/* ---------- Shell: sidebar of direction A ---------- */

function sidebar() {
    const recent = [
        [VIDEO.mascot, "CARIANI E BALESTRIN FORAM NUM…", "8 cortes prontos", true],
        [3, "ACELEREI O GOLF R 4X4 DE 600CV", "5 cortes prontos", false],
        [5, "Teste de velocidade 10 min", "4 cortes prontos", false],
    ]
        .map(
            ([index, title, line, current]) =>
                `<div class="recent" ${current ? 'aria-current="page"' : ""}>${mascot(index, 30)}<div class="recent-text"><span class="recent-title truncate">${title}</span><span class="recent-note truncate muted">${line}</span></div></div>`,
        )
        .join("");

    return `<aside class="side">
        <div class="side-brand">${mascot(BRAND, 34)}<span class="side-brand-name">Nelcota</span><span class="icon-button">${icon("sidebar")}</span></div>
        <span class="button button-primary" style="margin-bottom:8px">${icon("add", 18)}Novo vídeo</span>
        <div class="nav" aria-current="page">${icon("home")}Início<span class="nav-count">3</span></div>
        <div class="nav">${icon("clips")}Cortes<span class="nav-count">15</span></div>
        <div class="nav">${icon("account")}Conta</div>
        <div class="side-heading">Recentes</div>${recent}
        <span class="side-spacer"></span>
        <div class="me"><span class="avatar">CD</span><div class="me-text"><strong class="truncate">Conta Demo</strong><span class="muted truncate" style="font-size:13px">demo@nelcota.test</span></div>${icon("dots", 16)}</div>
    </aside>`;
}

function shell(content) {
    return `<div class="desk-v"><div class="frame">${sidebar()}<div class="content">${content}</div></div></div>`;
}

/** Shared header fix: thumbnail without the mascot on top, title, one meta line, actions grouped. */
function header(actions) {
    return `<header class="vhead">
        <div class="thumb"></div>
        <div><h1 class="vtitle">${VIDEO.title}</h1>
            <div class="vmeta"><span class="status" data-tone="success">${icon("check", 15)}8 cortes prontos</span><span>${icon("link", 15)}Abrir no YouTube</span><span>${icon("calendar", 15)}${VIDEO.date}</span><span>${icon("clock", 15)}${VIDEO.duration}</span></div>
        </div>
        <div class="actions">${actions}</div>
    </header>`;
}

const MORE_BUTTON = `<span class="btn btn-icon" title="Mais ações (excluir)">${icon("dots", 18)}</span>`;

/* ---------- Current ---------- */

function currentBoard() {
    const cards = CLIPS.slice(0, 2)
        .map(
            (
                clip,
            ) => `<article style="width:180px;display:grid;gap:8px;padding:10px;border:1px solid var(--border);border-radius:16px;background:var(--popover)">
        ${frame(clip, { withScore: true, captionSize: 11 })}
        <strong style="font-size:15px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${clip.title}</strong>
        <span class="row-sub">${clip.from} – ${clip.to} · ${clip.length}s</span>
        <span class="muted" style="font-size:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${clip.reason}</span>
        <span class="btn" style="justify-content:center">${icon("download", 16)}Baixar corte</span>
    </article>`,
        )
        .join("");
    const head = `<header class="vhead" style="grid-template-columns:192px minmax(0,1fr) auto"><div class="thumb">${mascot(VIDEO.mascot, 36).replace('class="mascot"', 'class="mascot" style="position:absolute;left:-8px;bottom:-8px"')}</div><div><h1 class="vtitle">${VIDEO.title}</h1><div class="vmeta"><span class="status" data-tone="success">Pronto</span><span>Abrir no YouTube</span><span>${VIDEO.date}</span><span>${VIDEO.duration}</span></div></div><span class="muted" style="align-self:start">${icon("trash", 16)} Excluir</span></header>`;

    return shell(
        `${head}<h2 style="font-size:18px;font-weight:800">Cortes <span class="muted" style="font-size:14px">2 de 2 prontos</span></h2><div style="display:flex;gap:16px">${cards}</div>`,
    );
}

/* ---------- A: player + ranked list ---------- */

function clipRow(clip, index, isCurrent) {
    const thumb =
        clip.failed === true
            ? `<div class="frame916 failed916 mini916" style="padding:4px">${mascot(SHIELD, 22)}</div>`
            : frame(clip, { small: true, style: "width:46px;border-radius:8px" });
    const right =
        clip.failed === true
            ? `<span class="btn" style="height:32px;color:var(--destructive)">${icon("restart", 15)}Tentar de novo</span>`
            : `<span class="score-pill">${icon("star", 13)}${clip.score}</span>`;
    const sub =
        clip.failed === true
            ? "Não deu para renderizar"
            : `${clip.length}s · ${clip.from}–${clip.to}`;

    return `<div class="clip-row" ${isCurrent ? 'aria-current="true"' : ""}><span class="rank">${index + 1}</span>${thumb}<div class="row-main"><strong>${clip.title}</strong><span class="row-sub" ${clip.failed === true ? 'style="color:var(--destructive)"' : ""}>${sub}</span></div>${right}</div>`;
}

function boardA() {
    const clip = CLIPS[0];
    const player = `<div class="player-col">
        ${frame(clip, { captionSize: 22, withScore: false, extra: playerControls(clip), style: "width:340px" })}
        <div style="display:flex;gap:8px"><span class="btn btn-primary" style="flex:1;justify-content:center">${icon("download", 18)}Baixar corte</span><span class="btn">${icon("copy", 16)}Copiar título</span></div>
    </div>`;
    const detail = `<div class="list-col">
        <div class="clip-detail" style="display:grid;gap:10px;padding:0 4px 14px;border-bottom:1px solid var(--border);margin-bottom:8px">
            <span class="muted" style="font-size:13px;font-weight:700">CORTE 1 DE 8 · ${clip.length}s · ${clip.from}–${clip.to} no original</span>
            <h2>${clip.title}</h2>
            <div class="why">${mascot(STAR, 30)}<div><strong>Brilho deu ${clip.score}</strong> <span class="muted">— ${clip.reason}</span></div></div>
        </div>
        <div class="list-head"><strong>Todos os cortes</strong><span class="muted" style="font-size:13px">pela nota do Brilho</span></div>
        ${CLIPS.map((item, index) => clipRow(item, index, index === 0)).join("")}
    </div>`;

    return shell(
        `${header(`<span class="btn">${icon("download", 16)}Baixar todos</span>${MORE_BUTTON}`)}<div class="a-body">${player}${detail}</div>`,
    );
}

/* ---------- B: big cards + player window ---------- */

function card(clip) {
    if (clip.failed === true) {
        return `<article class="card">${frame(clip)}<h3>${clip.title}</h3><span class="btn" style="justify-content:center;color:var(--destructive)">${icon("restart", 15)}Tentar de novo</span></article>`;
    }

    return `<article class="card">${frame(clip, { withScore: true, withDuration: true, withPlay: true, captionSize: 14 })}<h3>${clip.title}</h3><p>${clip.reason}</p></article>`;
}

function boardB(withModal) {
    const grid = `<h2 style="font-size:18px;font-weight:800">8 cortes <span class="muted" style="font-size:14px;font-weight:600">· ordenados pela nota do Brilho</span></h2><div class="cards">${CLIPS.slice(0, 4).map(card).join("")}</div>`;
    let modal = "";

    if (withModal === true) {
        const clip = CLIPS[0];
        modal = `<div class="scrim-v"><div class="modal-v">
            ${frame(clip, { captionSize: 22, extra: playerControls(clip) })}
            <div style="display:grid;gap:14px;align-content:start">
                <div style="display:flex;justify-content:space-between;align-items:center"><span class="muted" style="font-size:13px;font-weight:700">CORTE 1 DE 8</span><span style="display:flex;gap:6px">${icon("left")}${icon("right")}${icon("close")}</span></div>
                <h2 style="font-size:22px;font-weight:800;line-height:1.25">${clip.title}</h2>
                <span class="row-sub">${clip.length}s · ${clip.from}–${clip.to} no original</span>
                <div class="why">${mascot(STAR, 30)}<div><strong>Brilho deu ${clip.score}</strong> <span class="muted">— ${clip.reason}</span></div></div>
                <div style="display:flex;gap:8px"><span class="btn btn-primary">${icon("download", 18)}Baixar corte</span><span class="btn">${icon("copy", 16)}Copiar título</span></div>
            </div>
        </div></div>`;
    }

    return shell(
        `${header(`<span class="btn">${icon("download", 16)}Baixar todos</span>${MORE_BUTTON}`)}${grid}`,
    )
        .replace('<div class="content">', '<div class="content" style="position:relative">')
        .replace("</div></div></div>", `</div>${modal}</div></div>`);
}

/* ---------- C: source timeline + one clip per row ---------- */

function boardC() {
    const segments = CLIPS.map(
        (clip, index) =>
            `<span class="segment" ${index === 0 ? 'data-selected="true"' : ""} style="left:${(clip.start / VIDEO.durationSeconds) * 100}%;width:${Math.max((clip.length / VIDEO.durationSeconds) * 100, 0.8)}%;${clip.failed === true ? "background:var(--destructive)" : ""}"></span>`,
    ).join("");
    const timeline = `<section class="timeline"><div style="display:flex;justify-content:space-between"><strong>De onde vêm os cortes</strong><span class="muted" style="font-size:13px">clique num trecho para ir ao corte</span></div><div class="track">${segments}</div><div class="ticks"><span>0:00</span><span>10:00</span><span>20:00</span><span>30:00</span><span>${VIDEO.duration}</span></div></section>`;
    const rows = CLIPS.slice(0, 3)
        .map(
            (
                clip,
                index,
            ) => `<article class="c-row" ${index === 0 ? 'style="border-color:var(--primary)"' : ""}>
        ${frame(clip, { withPlay: true, captionSize: 10, style: "width:120px" })}
        <div style="display:grid;gap:8px"><span class="muted" style="font-size:13px;font-weight:700">#${index + 1} · ${clip.from}–${clip.to} · ${clip.length}s</span><h3>${clip.title}</h3><p class="muted" style="font-size:14px">${clip.reason}</p>
            <div style="display:flex;gap:8px;margin-top:4px"><span class="btn btn-primary">${icon("download", 16)}Baixar</span><span class="btn">${icon("copy", 16)}Copiar título</span></div></div>
        <div class="meter"><span style="display:flex;align-items:center;gap:8px">${mascot(STAR, 24)}<strong>Nota do Brilho</strong></span><span style="font-size:28px;font-weight:800">${clip.score}<span class="muted" style="font-size:15px">/100</span></span><div class="bar"><span style="width:${clip.score}%"></span></div></div>
    </article>`,
        )
        .join("");

    return shell(
        `${header(`<span class="btn">${icon("download", 16)}Baixar todos</span>${MORE_BUTTON}`)}${timeline}<div class="c-rows">${rows}</div>`,
    );
}

/* ---------- Phones ---------- */

function phoneTop() {
    return `<header class="phone-top">${icon("left")}<strong class="truncate" style="flex:1">CARIANI E BALESTRIN…</strong>${icon("dots")}</header>`;
}

function phoneA() {
    const clip = CLIPS[0];
    const list = CLIPS.slice(0, 4)
        .map((item, index) => clipRow(item, index, index === 0))
        .join("");

    return `<div class="phone-v">${phoneTop()}<div class="content">${frame(clip, { captionSize: 20, extra: playerControls(clip), style: "width:240px;height:427px;justify-self:center;flex-shrink:0" })}<div style="display:flex;gap:8px"><span class="btn btn-primary" style="flex:1;justify-content:center">${icon("download", 18)}Baixar corte</span><span class="btn btn-icon">${icon("copy", 16)}</span></div><h2 style="font-size:17px;font-weight:800">${clip.title}</h2><div style="display:grid;gap:4px">${list}</div></div></div>`;
}

function phoneB() {
    return `<div class="phone-v">${phoneTop()}<div class="content"><strong>8 cortes</strong><div class="cards" style="grid-template-columns:1fr 1fr;gap:12px">${CLIPS.slice(0, 4).map(card).join("")}</div></div></div>`;
}

function phoneC() {
    const clip = CLIPS[0];
    const segments = CLIPS.map(
        (item) =>
            `<span class="segment" style="left:${(item.start / VIDEO.durationSeconds) * 100}%;width:1.4%"></span>`,
    ).join("");

    return `<div class="phone-v">${phoneTop()}<div class="content"><div class="track" style="height:24px">${segments}</div><article class="c-row" style="grid-template-columns:100px 1fr">${frame(clip, { withPlay: true, captionSize: 9, style: "width:100px" })}<div style="display:grid;gap:6px"><span class="score-pill" style="justify-self:start">${icon("star", 13)}${clip.score}</span><h3 style="font-size:15px">${clip.title}</h3><span class="btn btn-primary" style="justify-content:center">${icon("download", 16)}Baixar</span></div></article><article class="c-row" style="grid-template-columns:100px 1fr">${frame(CLIPS[1], { withPlay: true, captionSize: 9, style: "width:100px" })}<div style="display:grid;gap:6px"><span class="score-pill" style="justify-self:start">${icon("star", 13)}${CLIPS[1].score}</span><h3 style="font-size:15px">${CLIPS[1].title}</h3><span class="btn btn-primary" style="justify-content:center">${icon("download", 16)}Baixar</span></div></article></div></div>`;
}

const BOARDS = {
    current: currentBoard,
    a: boardA,
    b: () => boardB(false),
    "b-modal": () => boardB(true),
    c: boardC,
    "phone-a": phoneA,
    "phone-b": phoneB,
    "phone-c": phoneC,
};

const render = BOARDS[document.body.dataset.board];
document.body.innerHTML = render === undefined ? "Board desconhecido" : render();
