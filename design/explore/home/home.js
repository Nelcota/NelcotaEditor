/* Início exploration: the same 9 videos drawn four ways. */

const icon = (name, size = 20) =>
    `<svg class="icon" style="width:${size}px;height:${size}px" viewBox="0 0 24 24" aria-hidden="true">${window.SOLAR[name] ?? ""}</svg>`;

function mascot(index, size = 32) {
    const set = index < 16 ? "shapes" : "objects";
    const tile = index % 16;
    const position = `${((tile % 4) * 100) / 3}% ${(Math.floor(tile / 4) * 100) / 3}%`;

    return `<span class="mascot" data-set="${set}" style="width:${size}px;height:${size}px;background-position:${position}" aria-hidden="true"></span>`;
}

const BRAND = 15;
const AVATAR = 4;
const CREW = {
    queued: 17,
    downloading: 24,
    transcribing: 23,
    selecting: 30,
    rendering: 21,
    done: 28,
    failed: 26,
    cancelled: 22,
};
const STAGE = { transcribing: "Transcrevendo", rendering: "Fazendo os cortes" };

const VIDEOS = [
    {
        m: 3,
        hue: 40,
        title: "ACELEREI O GOLF R 4X4 DE 600CV NA PISTA E OLHA NO QUE DEU",
        src: "YouTube",
        dur: "16:51",
        date: "hoje",
        status: "rendering",
        progress: 72,
        left: "~2 min",
        line: "Brasa está montando os cortes",
        ready: 3,
        total: 5,
    },
    {
        m: 7,
        hue: 250,
        title: "Entrevista completa com Maria Fernanda de Albuquerque Santos sobre carreira em tecnologia",
        src: "Arquivo",
        dur: "48:12",
        date: "hoje",
        status: "transcribing",
        progress: 34,
        left: "~6 min",
        line: "Tinta está escrevendo cada palavra",
        ready: 0,
        total: 8,
    },
    {
        m: 5,
        hue: 200,
        title: "Teste de velocidade 10 min",
        src: "YouTube",
        dur: "10:01",
        date: "ontem",
        status: "failed",
        line: "O vídeo é privado. Deixe público ou envie o arquivo.",
        ready: 0,
        total: 4,
    },
    {
        m: 9,
        hue: 120,
        title: "Dicas de produtividade para quem trabalha em casa",
        src: "Arquivo",
        dur: "1:15",
        date: "18/11",
        status: "done",
        ready: 3,
        total: 3,
    },
    {
        m: 1,
        hue: 20,
        title: "Podcast #42 — Como montar um estúdio caseiro gastando pouco",
        src: "YouTube",
        dur: "1:02:40",
        date: "17/11",
        status: "done",
        ready: 8,
        total: 8,
    },
    {
        m: 11,
        hue: 300,
        title: "Review do celular dobrável depois de 30 dias de uso",
        src: "YouTube",
        dur: "22:05",
        date: "15/11",
        status: "done",
        ready: 4,
        total: 5,
        failedClips: 1,
    },
    {
        m: 13,
        hue: 80,
        title: "Live de sexta: perguntas e respostas",
        src: "YouTube",
        dur: "1:34:10",
        date: "14/11",
        status: "cancelled",
        line: "Cogu guardou o que já estava pronto",
        ready: 2,
        total: 6,
    },
    {
        m: 2,
        hue: 160,
        title: "Receita de pão de fermentação natural",
        src: "Arquivo",
        dur: "12:44",
        date: "12/11",
        status: "done",
        ready: 5,
        total: 5,
    },
    {
        m: 6,
        hue: 340,
        title: "Vlog: um dia em São Paulo",
        src: "YouTube",
        dur: "18:30",
        date: "10/11",
        status: "done",
        ready: 5,
        total: 5,
    },
];

const COUNTS = { all: 12, processing: 2, done: 8, failed: 1 };

const isWorking = (video) => video.status === "rendering" || video.status === "transcribing";

/* ---------- Shared pieces ---------- */

function sidebar() {
    return `<aside class="side">
        <div class="side-brand">${mascot(BRAND, 34)}<span class="side-brand-name">Nelcota</span><span class="icon-button">${icon("sidebar")}</span></div>
        <span class="button button-primary" style="margin-bottom:8px">${icon("add", 18)}Novo vídeo</span>
        <div class="nav" aria-current="page">${icon("home")}Início<span class="nav-count">12</span></div>
        <div class="nav">${icon("clips")}Cortes<span class="nav-count">35</span></div>
        <div class="nav">${icon("account")}Conta</div>
        <div class="side-heading">Recentes</div>
        <div class="recent">${mascot(3, 30)}<div class="recent-text"><span class="recent-title truncate">ACELEREI O GOLF R 4X4 DE 600CV</span><span class="recent-note" data-tone="working">Brasa está montando os cortes</span></div></div>
        <div class="recent">${mascot(7, 30)}<div class="recent-text"><span class="recent-title truncate">Entrevista completa com Maria Fernanda</span><span class="recent-note" data-tone="working">Tinta está escrevendo</span></div></div>
        <div class="recent">${mascot(5, 30)}<div class="recent-text"><span class="recent-title truncate">Teste de velocidade 10 min</span><span class="recent-note" data-tone="danger">Guarda encontrou um problema</span></div></div>
        <span class="side-spacer"></span>
        <div class="me"><span class="avatar">${mascot(AVATAR, 28)}</span><div class="me-text"><strong class="truncate">Maria Fernanda de Albuquerque Santos</strong><span class="muted truncate" style="font-size:13px">maria.fernanda.albuquerque@exemplo.com.br</span></div>${icon("dots", 16)}</div>
    </aside>`;
}

function shell(content) {
    return `<div class="desk-v"><div class="frame">${sidebar()}<div class="content" style="max-width:1100px;width:100%;justify-self:center">${content}</div></div></div>`;
}

function header(description) {
    return `<header><h1 class="vtitle">Início</h1><p class="muted" style="margin-top:4px">${description}</p></header>`;
}

function toolbar({ withChips = true, sort = true } = {}) {
    const chips = [
        ["Todos", COUNTS.all, true],
        ["Processando", COUNTS.processing],
        ["Prontos", COUNTS.done],
        ["Com erro", COUNTS.failed],
    ]
        .map(
            ([label, count, pressed]) =>
                `<span class="chip" aria-pressed="${pressed === true}">${label}<span style="opacity:.7;font-size:12px">${count}</span></span>`,
        )
        .join("");

    return `<div class="toolbar"><span class="search">${icon("search", 16)}Buscar por título</span>${withChips ? chips : ""}<span style="flex:1"></span>${sort ? `<span class="select-like">${icon("sort", 16)}Mais recentes ${icon("down", 14)}</span>` : ""}</div>`;
}

function thumb(video, { badge = true, width = "100%" } = {}) {
    return `<div class="thumb" data-hue style="--hue:${video.hue};width:${width}">${badge ? `<span class="thumb-badge">${mascot(video.m, 22)}</span>` : ""}<span class="thumb-time">${video.dur}</span></div>`;
}

const TINTS = ["1", "2", "3"];

function minis(video, max = 5) {
    const shown = Math.min(video.ready, max);
    let html = "";

    for (let index = 0; index < shown; index += 1) {
        html += `<span class="frame916" data-tint="${TINTS[(index + video.m) % 3]}"></span>`;
    }

    if (video.failedClips !== undefined && shown < max) {
        html += `<span class="mini-failed"></span>`;
    }

    if (isWorking(video) === true) {
        for (let index = shown; index < Math.min(video.total, max); index += 1) {
            html += `<span class="mini-slot"></span>`;
        }
    }

    if (video.ready > max) {
        html += `<span class="more">+${video.ready - max}</span>`;
    }

    return `<span class="minis">${html}</span>`;
}

function statusPill(video) {
    if (video.status === "done") {
        return `<span class="status" data-tone="success">${icon("check", 14)}Pronto</span>`;
    }

    if (video.status === "failed") {
        return `<span class="status" data-tone="danger">${icon("danger", 14)}Com erro</span>`;
    }

    if (video.status === "cancelled") {
        return `<span class="status" style="background:var(--secondary);color:var(--muted-foreground)">Cancelado</span>`;
    }

    return `<span class="status" data-tone="working">${STAGE[video.status]}</span>`;
}

function meta(video) {
    return `<span class="muted" style="font-size:13px">${icon(video.src === "YouTube" ? "link" : "upload", 13)} ${video.src} · ${video.date}</span>`;
}

function clipsLabel(video) {
    if (video.failedClips !== undefined) {
        return `${video.ready} de ${video.total} cortes · 1 falhou`;
    }

    return `${video.ready} de ${video.total} cortes`;
}

function crewLine(video, size = 22) {
    if (video.status === "failed") {
        return `<span class="crew-line" data-tone="danger">${mascot(CREW.failed, size)}<span>${video.line}</span></span>`;
    }

    return `<span class="crew-line">${mascot(CREW[video.status], size)}<span class="truncate">${video.line}</span></span>`;
}

function progress(video) {
    return `<div style="display:grid;gap:6px"><div class="bar"><span style="width:${video.progress}%"></span></div><span class="muted" style="font-size:13px;font-variant-numeric:tabular-nums">${video.progress}% · falta ${video.left}</span></div>`;
}

/* ---------- Current ---------- */

function currentBoard() {
    const rows = VIDEOS.slice(0, 8)
        .map(
            (video) =>
                `<div class="row" style="grid-template-columns:minmax(0,1fr) 170px 90px 110px 32px"><div class="row-video">${mascot(video.m, 30)}<div style="min-width:0"><div class="row-title truncate">${video.title}</div><div class="row-meta muted">${video.src} · ${video.dur}</div></div></div><div>${statusPill(video)}</div><div><strong>${video.ready}</strong> <span class="muted">de ${video.total}</span></div><div class="muted">${video.date}</div>${icon("dots", 16)}</div>`,
        )
        .join("");

    return shell(
        `${header("Cada vídeo longo vira cortes verticais 9:16 com legenda.")}${toolbar({ sort: false })}<div class="list"><div class="row muted" style="grid-template-columns:minmax(0,1fr) 170px 90px 110px 32px;background:var(--muted);font-size:13px;font-weight:600"><span>Vídeo</span><span>Situação</span><span>Cortes</span><span>Criado em</span><span></span></div>${rows}</div>`,
    );
}

/* ---------- A: rows with thumbnails ---------- */

function rowSide(video) {
    if (video.status === "failed") {
        return `<div class="a-side"><span class="btn">${icon("restart", 16)}Tentar de novo</span></div>`;
    }

    if (isWorking(video) === true) {
        return `<div class="a-side" style="justify-items:stretch">${progress(video)}</div>`;
    }

    return `<div class="a-side">${minis(video)}<span class="muted" style="font-size:13px">${clipsLabel(video)}</span></div>`;
}

function rowStatusLine(video) {
    if (video.status === "done") {
        return `<span class="crew-line">${statusPill(video)}</span>`;
    }

    return crewLine(video);
}

function rowA(video) {
    return `<div class="a-row" data-tone="${video.status === "failed" ? "danger" : ""}">${thumb(video)}<div class="a-main"><span class="a-title">${video.title}</span>${meta(video)}${rowStatusLine(video)}</div>${rowSide(video)}<span class="btn btn-icon" style="border:0;background:none">${icon("dots", 18)}</span></div>`;
}

function boardA() {
    return shell(
        `${header("Seus vídeos, do mais novo ao mais antigo.")}${toolbar()}<div class="a-list">${VIDEOS.slice(0, 6).map(rowA).join("")}</div>`,
    );
}

/* ---------- B: now + library ---------- */

function nowCard(video) {
    if (video.status === "failed") {
        return `<div class="now-card" data-tone="danger"><div style="display:flex;gap:12px;align-items:center">${mascot(CREW.failed, 44)}<div style="min-width:0;flex:1"><strong style="display:block" class="truncate">${video.title}</strong>${meta(video)}</div></div><p style="font-size:14px;color:var(--destructive)">${video.line}</p><div style="display:flex;gap:8px"><span class="btn">${icon("restart", 16)}Tentar de novo</span><span class="btn" style="border:0;background:none">Ver vídeo</span></div></div>`;
    }

    return `<div class="now-card"><div style="display:flex;gap:12px;align-items:center">${mascot(CREW[video.status], 44)}<div style="min-width:0;flex:1"><strong style="display:block" class="truncate">${video.title}</strong>${meta(video)}</div></div><p class="muted" style="font-size:14px">${video.line}</p>${progress(video)}<div style="display:flex;justify-content:space-between;align-items:center">${minis(video)}<span class="muted" style="font-size:13px">${video.ready} de ${video.total}</span></div></div>`;
}

function libItem(video) {
    const note =
        video.status === "cancelled"
            ? `${statusPill(video)}`
            : `<span class="muted" style="font-size:13px">${clipsLabel(video)}</span>`;

    return `<div class="lib-item">${thumb(video, { badge: true })}<div style="display:grid;gap:4px;min-width:0"><strong class="a-title" style="font-size:15px">${video.title}</strong>${meta(video)}${note}</div>${icon("dots", 18)}</div>`;
}

function boardB() {
    const now = VIDEOS.filter((video) => isWorking(video) || video.status === "failed");
    const library = VIDEOS.filter(
        (video) => video.status === "done" || video.status === "cancelled",
    );

    return shell(`${header("O que a equipe está fazendo agora e tudo o que já ficou pronto.")}
        <section style="display:grid;gap:12px"><h2 class="section-title">Agora <span class="muted" style="font-size:14px;font-weight:600">2 em andamento · 1 com erro</span></h2><div class="now-grid">${now.map(nowCard).join("")}</div></section>
        <section style="display:grid;gap:12px"><div style="display:flex;align-items:center;gap:10px"><h2 class="section-title" style="flex:1">Biblioteca <span class="muted" style="font-size:14px;font-weight:600">9 vídeos</span></h2><span class="search" style="width:260px">${icon("search", 16)}Buscar por título</span><span class="select-like">${icon("sort", 16)}Mais recentes ${icon("down", 14)}</span></div><div class="lib-grid">${library.map(libItem).join("")}</div></section>`);
}

/* ---------- C: gallery ---------- */

function overlay(video) {
    if (video.status === "failed") {
        return `<div class="g-over" data-tone="danger">${mascot(CREW.failed, 40)}<span>${video.line}</span><span class="btn" style="height:32px">${icon("restart", 15)}Tentar de novo</span></div>`;
    }

    if (isWorking(video) === true) {
        return `<div class="g-over">${mascot(CREW[video.status], 44)}<span>${video.line}</span><div class="bar"><span style="width:${video.progress}%"></span></div><span class="muted" style="font-size:12px">${video.progress}% · falta ${video.left}</span></div>`;
    }

    return "";
}

function fan(video) {
    if (video.status !== "done") {
        return "";
    }

    let html = "";

    for (let index = 0; index < Math.min(video.ready, 3); index += 1) {
        html += `<span class="frame916" data-tint="${TINTS[(index + video.m) % 3]}"></span>`;
    }

    return `<span class="g-fan">${html}</span>`;
}

function card(video) {
    return `<div class="g-card"><div class="thumb" data-hue style="--hue:${video.hue}"><span class="thumb-badge">${mascot(video.m, 22)}</span>${fan(video)}${overlay(video)}<span class="thumb-time" style="left:6px;right:auto">${video.dur}</span></div><strong class="a-title" style="font-size:15px">${video.title}</strong><span class="muted" style="font-size:13px">${video.src} · ${video.date} · ${video.ready} de ${video.total} cortes</span></div>`;
}

function boardC() {
    return shell(
        `${header("Seus vídeos, do mais novo ao mais antigo.")}${toolbar()}<div class="gallery">${VIDEOS.slice(0, 6).map(card).join("")}</div>`,
    );
}

/* ---------- Phones ---------- */

function phoneTop() {
    return `<header class="phone-top">${mascot(BRAND, 30)}<strong style="flex:1">Início</strong>${icon("menu")}</header>`;
}

function phoneChips() {
    return `<div style="display:flex;gap:6px;overflow:hidden">${[
        ["Todos", 12, true],
        ["Processando", 2],
        ["Prontos", 8],
    ]
        .map(
            ([label, count, pressed]) =>
                `<span class="chip" aria-pressed="${pressed === true}">${label}<span style="opacity:.7;font-size:12px">${count}</span></span>`,
        )
        .join("")}</div>`;
}

function phoneSearch() {
    return `<span class="search" style="width:100%">${icon("search", 16)}Buscar por título</span>`;
}

function phoneRowA(video) {
    let below = `<div style="grid-column:1 / -1">${rowStatusLine(video)}</div>`;

    if (isWorking(video) === true) {
        below = `<div style="grid-column:1 / -1;display:grid;gap:8px">${crewLine(video, 20)}${progress(video)}</div>`;
    }

    if (video.status === "done") {
        below = `<div style="grid-column:1 / -1;display:flex;justify-content:space-between;align-items:center">${minis(video, 4)}<span class="muted" style="font-size:13px">${video.ready} de ${video.total} cortes</span></div>`;
    }

    return `<div class="a-row">${thumb(video)}<div class="a-main"><span class="a-title">${video.title}</span>${meta(video)}</div>${below}</div>`;
}

function phoneA() {
    return `<div class="phone-v">${phoneTop()}<div class="content">${phoneSearch()}${phoneChips()}<div class="a-list">${VIDEOS.slice(0, 4).map(phoneRowA).join("")}</div></div></div>`;
}

function phoneB() {
    const now = VIDEOS.filter((video) => isWorking(video) || video.status === "failed");

    return `<div class="phone-v">${phoneTop()}<div class="content"><h2 class="section-title">Agora</h2><div style="display:grid;gap:10px">${now.slice(0, 2).map(nowCard).join("")}</div><h2 class="section-title">Biblioteca</h2>${phoneSearch()}<div style="display:grid;gap:8px">${VIDEOS.slice(3, 5).map(libItem).join("")}</div></div></div>`;
}

function phoneC() {
    return `<div class="phone-v">${phoneTop()}<div class="content">${phoneSearch()}${phoneChips()}<div class="gallery" style="grid-template-columns:1fr">${VIDEOS.slice(0, 3).map(card).join("")}</div></div></div>`;
}

const BOARDS = {
    current: currentBoard,
    a: boardA,
    b: boardB,
    c: boardC,
    "phone-a": phoneA,
    "phone-b": phoneB,
    "phone-c": phoneC,
};
const render = BOARDS[document.body.dataset.board];
document.body.innerHTML = render === undefined ? "Board desconhecido" : render();
