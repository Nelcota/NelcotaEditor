/* Navigation exploration: the same data drawn in the current layout and three directions. */

const icon = (name, extra = "") =>
    `<svg class="icon ${extra}" viewBox="0 0 24 24" aria-hidden="true">${window.SOLAR[name]}</svg>`;

function mascot(index, size = 32) {
    const set = index < 16 ? "shapes" : "objects";
    const tile = index % 16;
    const position = `${((tile % 4) * 100) / 3}% ${(Math.floor(tile / 4) * 100) / 3}%`;

    return `<span class="mascot" data-set="${set}" style="width:${size}px;height:${size}px;background-position:${position}" aria-hidden="true"></span>`;
}

const BRAND = 15;
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
const CREW_NAMES = { transcribing: "Tinta", rendering: "Brasa", done: "Sorte", failed: "Guarda" };

const VIDEOS = [
    {
        mascot: 6,
        title: "CARIANI E BALESTRIN FORAM NUM RESTAURANTE ITALIANO RAIZ !!!",
        source: "YouTube",
        duration: "35:37",
        status: "transcribing",
        progress: 41,
        clips: "10 pedidos",
        line: "Tinta está escrevendo cada palavra",
    },
    {
        mascot: 1,
        title: "Flow Podcast #412 — Carlos Bertolazzi fala sobre negócios, cozinha e televisão",
        source: "YouTube",
        duration: "2:41:07",
        status: "rendering",
        progress: 86,
        clips: "3 de 8",
        line: "Brasa está montando os cortes",
    },
    {
        mascot: 3,
        title: "ACELEREI O GOLF R 4X4 DE 600CV",
        source: "YouTube",
        duration: "16:51",
        status: "done",
        progress: 100,
        clips: "5 cortes",
        line: "5 cortes prontos",
    },
    {
        mascot: 5,
        title: "Teste de velocidade 10 min",
        source: "Arquivo",
        duration: "10:01",
        status: "done",
        progress: 100,
        clips: "4 cortes",
        line: "4 cortes prontos",
    },
    {
        mascot: 9,
        title: "Podcast Café com Código — ep. 88",
        source: "YouTube",
        duration: "1:31:02",
        status: "failed",
        progress: 40,
        clips: "6 pedidos",
        line: "O YouTube bloqueou o download",
    },
    {
        mascot: 11,
        title: "Dicas de produtividade",
        source: "Arquivo",
        duration: "1:15",
        status: "done",
        progress: 100,
        clips: "3 cortes",
        line: "3 cortes prontos",
    },
];

const STATUS = {
    transcribing: { label: "Transcrevendo", tone: "working" },
    rendering: { label: "Fazendo cortes", tone: "working" },
    done: { label: "Pronto", tone: "success" },
    failed: { label: "Falhou", tone: "danger" },
};

const TONES = { transcribing: "working", rendering: "working", done: "", failed: "danger" };

/** A video mascot carrying its live mark: progress ring while working, red dot when it failed. */
function markedMascot(video, size) {
    let mark = "";

    if (STATUS[video.status].tone === "working") {
        mark = `<span class="ring" style="--progress:${video.progress}"></span>`;
    }

    if (video.status === "failed") {
        mark = '<span class="dot"></span>';
    }

    return `<span class="marked">${mark}${mascot(video.mascot, size)}</span>`;
}

function statusCell(video) {
    const status = STATUS[video.status];
    const bar =
        status.tone === "working"
            ? `<div class="bar"><span style="width:${video.progress}%"></span></div>`
            : "";

    return `<div class="row-status"><span class="status" data-tone="${status.tone}">${status.label}</span>${bar}</div>`;
}

function row(video) {
    return `<div class="row">
        <div class="row-video">${mascot(video.mascot)}<div class="truncate"><div class="row-title truncate">${video.title}</div><div class="row-meta muted">${video.source} · ${video.duration}</div></div></div>
        ${statusCell(video)}
        <div class="row-clips muted">${video.clips}</div>
        <span class="muted">${icon("dots")}</span>
    </div>`;
}

function toolbar() {
    const chips = ["Todos 6", "Processando 2", "Prontos 3", "Com erro 1"]
        .map((chip, index) => `<span class="chip" aria-pressed="${index === 0}">${chip}</span>`)
        .join("");

    return `<div class="toolbar"><span class="search">${icon("search", "icon-sm")}Buscar por título</span>${chips}</div>`;
}

/** "Início": the same content in every option, so only the navigation differs. */
function homePage(options = {}) {
    const title = options.hideTitle === true ? "" : '<h1 class="page-title">Início</h1>';
    const extra = options.extra ?? "";

    return `<div class="page">${title}${extra}${options.noToolbar === true ? "" : toolbar()}<div class="list">${VIDEOS.map(row).join("")}</div></div>`;
}

/* ---------- Current ---------- */

function currentBoard() {
    const rail = `<nav class="cur-rail">${mascot(BRAND, 36)}<span class="icon-button">${icon("video")}</span>${VIDEOS.slice(
        0,
        4,
    )
        .map((video) => markedMascot(video, 32))
        .join(
            "",
        )}<span class="icon-button">${icon("add")}</span><span style="flex:1"></span><span class="avatar">CD</span></nav>`;
    const nav = [
        ["Todos", 6],
        ["Processando", 2],
        ["Prontos", 3],
        ["Com erro", 1],
    ]
        .map(
            ([label, count], index) =>
                `<div class="nav" ${index === 0 ? 'aria-current="page"' : ""}>${icon("video")}${label}<span class="nav-count">${count}</span></div>`,
        )
        .join("");
    const side = `<aside class="cur-side">
        <div class="me" style="border:0;padding:6px">${mascot(BRAND, 36)}<div class="me-text"><strong>Nelcota</strong><span class="muted truncate" style="font-size:13px">demo@nelcota.test</span></div>${icon("sort", "icon-sm")}</div>
        <span class="button button-primary" style="margin:8px 0">${icon("add", "icon-sm")}Novo vídeo</span>
        <div class="side-heading" style="text-transform:none;letter-spacing:0;color:var(--foreground)">Vídeos</div>${nav}
        <div class="side-heading" style="text-transform:none;letter-spacing:0;color:var(--foreground)">Biblioteca</div><div class="nav">${icon("clips")}Cortes<span class="nav-count">12</span></div>
        <div class="side-heading" style="text-transform:none;letter-spacing:0;color:var(--foreground)">Conta</div><div class="nav">${icon("chart")}Uso</div><div class="nav">${icon("settings")}Preferências</div>
    </aside>`;

    return `<div class="desk cur">${rail}<div class="frame cur-frame">${side}<div class="scroll"><div class="cur-bar">Vídeos ${icon("sort", "icon-sm")}</div>${homePage({ hideTitle: true })}</div></div></div>`;
}

/* ---------- A: one sidebar ---------- */

function recentItem(video, isCollapsed) {
    if (isCollapsed === true) {
        return `<div class="recent" title="${video.title}">${markedMascot(video, 30)}</div>`;
    }

    return `<div class="recent">${markedMascot(video, 30)}<div class="recent-text"><span class="recent-title truncate">${video.title}</span><span class="recent-note truncate muted" data-tone="${TONES[video.status]}">${video.line}</span></div></div>`;
}

function sidebarA(isCollapsed) {
    const label = (text) => (isCollapsed === true ? "" : text);
    const brand =
        isCollapsed === true
            ? `<div class="side-brand" style="padding:4px 0 12px">${mascot(BRAND, 36)}</div>`
            : `<div class="side-brand">${mascot(BRAND, 34)}<span class="side-brand-name">Nelcota</span><span class="icon-button" title="Recolher barra">${icon("sidebar")}</span></div>`;
    const newButton =
        isCollapsed === true
            ? `<span class="button button-primary" title="Novo vídeo">${icon("add")}</span>`
            : `<span class="button button-primary" style="margin-bottom:8px">${icon("add", "icon-sm")}Novo vídeo</span>`;
    const count = (value) =>
        isCollapsed === true ? "" : `<span class="nav-count">${value}</span>`;
    const me =
        isCollapsed === true
            ? `<span class="avatar">${mascot(4, 28)}</span>`
            : `<div class="me"><span class="avatar">${mascot(4, 28)}</span><div class="me-text"><strong class="truncate">Conta Demo</strong><span class="muted truncate" style="font-size:13px">demo@nelcota.test</span></div>${icon("dots", "icon-sm")}</div>`;
    const heading =
        isCollapsed === true
            ? '<span class="dock-divider" style="margin:10px 0"></span>'
            : '<div class="side-heading">Recentes</div>';

    return `<aside class="side">
        ${brand}${newButton}
        <div class="nav" aria-current="page">${icon("home")}${label("Início")}${count(6)}</div>
        <div class="nav">${icon("clips")}${label("Cortes")}${count(12)}</div>
        <div class="nav">${icon("account")}${label("Conta")}</div>
        ${heading}
        ${VIDEOS.slice(0, 5)
            .map((video) => recentItem(video, isCollapsed))
            .join("")}
        <span class="side-spacer"></span>${me}
    </aside>`;
}

function boardA(isCollapsed = false) {
    const frameClass = isCollapsed === true ? "frame a-frame is-collapsed" : "frame a-frame";

    return `<div class="desk a"><div class="${frameClass}">${sidebarA(isCollapsed)}<div class="scroll">${homePage()}</div></div></div>`;
}

/* ---------- B: top bar with tabs ---------- */

function shelfCard(video) {
    return `<div class="shelf-card">${mascot(CREW[video.status], 44)}<div class="truncate"><div class="row-title truncate">${video.title}</div><div class="muted" style="font-size:14px"><strong style="color:var(--foreground)">${CREW_NAMES[video.status]}</strong> ${video.line.replace(CREW_NAMES[video.status] + " ", "")} · ${video.progress}%</div><div class="bar" style="margin-top:8px"><span style="width:${video.progress}%"></span></div></div></div>`;
}

function boardB() {
    const tabs = [
        ["home", "Início", true],
        ["clips", "Cortes", false],
        ["account", "Conta", false],
    ]
        .map(
            ([iconName, label, isCurrent]) =>
                `<span class="tab" ${isCurrent ? 'aria-current="page"' : ""}>${icon(iconName, "icon-sm")}${label}</span>`,
        )
        .join("");
    const top = `<header class="topbar">${mascot(BRAND, 34)}<strong style="font-size:17px;margin-left:-16px">Nelcota</strong><nav class="tabs">${tabs}</nav><span style="flex:1"></span><span class="button button-primary">${icon("add", "icon-sm")}Novo vídeo</span><span class="avatar">${mascot(4, 28)}</span></header>`;
    const shelf = `<section style="display:grid;gap:10px"><h2 style="font-size:17px;font-weight:800">Em andamento</h2><div class="shelf">${VIDEOS.slice(0, 2).map(shelfCard).join("")}</div></section><h2 style="font-size:17px;font-weight:800">Seus vídeos</h2>`;

    return `<div class="desk b">${top}<div class="scroll">${homePage({ hideTitle: true, extra: shelf })}</div></div>`;
}

/* ---------- C: mascot dock ---------- */

function dockVideo(video) {
    return `<div class="dock-item" title="${video.title}">${markedMascot(video, 36)}<span class="dock-label">${video.title}</span></div>`;
}

function boardC() {
    const dock = `<nav class="dock">
        ${mascot(BRAND, 40)}
        <span class="dock-divider"></span>
        <div class="dock-item" aria-current="page">${icon("home")}Início</div>
        <div class="dock-item">${icon("clips")}Cortes</div>
        <div class="dock-item" style="color:var(--primary)">${icon("add")}Novo</div>
        <span class="dock-divider"></span>
        ${VIDEOS.slice(0, 4).map(dockVideo).join("")}
        <span style="flex:1"></span>
        <div class="dock-item"><span class="avatar">${mascot(4, 28)}</span>Conta</div>
    </nav>`;
    const crew = `<div class="speech">${mascot(CREW.transcribing, 40)}<div><strong>Tinta</strong> <span class="muted">está escrevendo cada palavra de</span> CARIANI E BALESTRIN… <span class="muted">· 41%</span></div><span style="flex:1"></span>${mascot(CREW.rendering, 40)}<div><strong>Brasa</strong> <span class="muted">montou 3 de 8 cortes</span></div></div>`;

    return `<div class="desk c">${dock}<div class="frame scroll">${homePage({ extra: crew })}</div></div>`;
}

/* ---------- Phones ---------- */

function phoneA() {
    const top = `<header class="phone-top">${mascot(BRAND, 32)}<strong style="flex:1">Início</strong><span class="avatar" style="width:32px;height:32px">${mascot(4, 24)}</span><span class="icon-button">${icon("menu")}</span></header>`;
    const fab = `<div style="padding:0 16px 16px"><span class="button button-primary" style="width:100%">${icon("add", "icon-sm")}Novo vídeo</span></div>`;

    return `<div class="phone">${top}<div class="scroll">${homePage({ hideTitle: true, noToolbar: true })}</div>${fab}</div>`;
}

function phoneB() {
    const top = `<header class="phone-top">${mascot(BRAND, 32)}<strong style="flex:1">Nelcota</strong><span class="avatar" style="width:32px;height:32px">${mascot(4, 24)}</span></header>`;
    const tabs = `<nav class="bottom-tabs"><span class="bottom-tab" aria-current="page">${icon("home")}Início</span><span class="bottom-tab">${icon("clips")}Cortes</span><span class="bottom-tab is-primary">${icon("add")}Novo</span><span class="bottom-tab">${icon("account")}Conta</span></nav>`;

    return `<div class="phone">${top}<div class="scroll">${homePage({ hideTitle: true, noToolbar: true, extra: `<div class="shelf" style="grid-template-columns:1fr">${shelfCard(VIDEOS[0])}</div>` })}</div>${tabs}</div>`;
}

function phoneC() {
    const top = `<header class="phone-top">${mascot(BRAND, 32)}<strong style="flex:1">Início</strong><span class="avatar" style="width:32px;height:32px">${mascot(4, 24)}</span></header>`;
    const dock = `<nav class="bottom-tabs" style="grid-template-columns:repeat(5,1fr)"><span class="bottom-tab" aria-current="page">${icon("home")}Início</span><span class="bottom-tab">${icon("clips")}Cortes</span><span class="bottom-tab is-primary">${icon("add")}Novo</span>${VIDEOS.slice(
        0,
        2,
    )
        .map(
            (video) =>
                `<span class="bottom-tab">${markedMascot(video, 26)}<span class="truncate" style="max-width:64px">${video.title}</span></span>`,
        )
        .join("")}</nav>`;

    return `<div class="phone">${top}<div class="scroll">${homePage({ hideTitle: true, noToolbar: true })}</div>${dock}</div>`;
}

/* ---------- Cast ---------- */

const CAST = [
    {
        index: BRAND,
        name: "Nel",
        role: "A marca · anfitrião",
        trait: "Acolhedor. Aparece quando ainda não há nada.",
        line: "Oi! Cole um link e a equipe começa.",
        where: "Telas vazias, primeiro acesso, login",
    },
    {
        index: CREW.queued,
        name: "Luna",
        role: "Na fila",
        trait: "Calma e paciente. Nunca apressa.",
        line: "Luna está guardando seu lugar na fila.",
        where: "Vídeo e corte na fila",
    },
    {
        index: CREW.downloading,
        name: "Faísca",
        role: "Download",
        trait: "Rápido, direto ao ponto.",
        line: "Faísca está trazendo o vídeo do YouTube.",
        where: "Etapa de download",
    },
    {
        index: CREW.transcribing,
        name: "Tinta",
        role: "Transcrição",
        trait: "Atento a cada palavra; muitos braços.",
        line: "Tinta está escrevendo cada palavra.",
        where: "Etapa de transcrição",
    },
    {
        index: CREW.selecting,
        name: "Brilho",
        role: "Melhores momentos",
        trait: "Exigente: só escolhe o que brilha.",
        line: "Brilho está escolhendo os melhores momentos.",
        where: "Etapa de seleção",
    },
    {
        index: CREW.rendering,
        name: "Brasa",
        role: "Cortes com legenda",
        trait: "Energética, mão na massa.",
        line: "Brasa montou 3 de 8 cortes.",
        where: "Etapa de renderização, corte renderizando",
    },
    {
        index: CREW.done,
        name: "Sorte",
        role: "Pronto",
        trait: "Comemora, mas sem exagero.",
        line: "Pronto! 8 cortes esperando por você.",
        where: "Vídeo pronto, aviso de conclusão",
    },
    {
        index: CREW.failed,
        name: "Guarda",
        role: "Falhou",
        trait: "Sério e claro: diz o que houve e o que fazer.",
        line: "O YouTube bloqueou o download. Tente de novo em alguns minutos.",
        where: "Erros de vídeo e de carregamento",
    },
    {
        index: CREW.cancelled,
        name: "Cogu",
        role: "Cancelado",
        trait: "Tranquilo; guardou tudo para depois.",
        line: "Cogu guardou o que já estava pronto. Retome quando quiser.",
        where: "Vídeo cancelado",
    },
];

function castBoard() {
    const cards = CAST.map(
        (
            member,
        ) => `<article style="display:grid;grid-template-columns:auto 1fr;gap:14px;padding:16px;border:1px solid var(--border);border-radius:16px;background:var(--popover)">
        ${mascot(member.index, 64)}
        <div style="display:grid;gap:4px;align-content:start"><div><strong style="font-size:18px">${member.name}</strong> <span class="muted" style="font-size:14px">· ${member.role}</span></div>
        <p class="muted" style="font-size:14px">${member.trait}</p>
        <p style="font-size:14px;padding:8px 10px;border-radius:10px;background:var(--secondary);margin-top:4px">“${member.line}”</p>
        <p class="muted" style="font-size:13px;margin-top:2px">Aparece em: ${member.where}</p></div>
    </article>`,
    ).join("");

    return `<div style="width:1280px;padding:32px;display:grid;gap:20px">
        <div><h1 class="page-title">Elenco</h1><p class="muted" style="margin-top:4px">Tom simpático e discreto: uma frase curta, sempre ao lado da informação, nunca no lugar dela.</p></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${cards}</div>
    </div>`;
}

const BOARDS = {
    current: currentBoard,
    a: () => boardA(false),
    "a-collapsed": () => boardA(true),
    b: boardB,
    c: boardC,
    "phone-a": phoneA,
    "phone-b": phoneB,
    "phone-c": phoneC,
    cast: castBoard,
};

const render = BOARDS[document.body.dataset.board];
document.body.innerHTML = render === undefined ? "Board desconhecido" : render();
