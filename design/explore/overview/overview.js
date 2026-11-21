/* Painel exploration: the same 30 days of numbers drawn four ways. Data is the local account's. */

const STROKE =
    'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"';
Object.assign(window.SOLAR, {
    upload: `<g ${STROKE}><path d="M12 15V3m0 0l4 4.5M12 3L8 7.5"/><path d="M3 15c0 2.8 0 4.2.9 5.1.9.9 2.3.9 5.1.9h6c2.8 0 4.2 0 5.1-.9.9-.9.9-2.3.9-5.1"/></g>`,
    mic: `<g ${STROKE}><rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 11a7 7 0 0014 0M12 18v4"/></g>`,
    star: `<path ${STROKE} d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>`,
    warn: `<g ${STROKE}><path d="M12 4L2.5 20h19z"/><path d="M12 10v4M12 17h.01"/></g>`,
    funnel: `<path ${STROKE} d="M4 5h16l-6 8v5l-4 2v-7z"/>`,
});

const icon = (name, size = 20) =>
    `<svg class="icon" style="width:${size}px;height:${size}px" viewBox="0 0 24 24" aria-hidden="true">${window.SOLAR[name]}</svg>`;

function mascot(index, size = 32) {
    const set = index < 16 ? "shapes" : "objects";
    const tile = index % 16;
    const position = `${((tile % 4) * 100) / 3}% ${(Math.floor(tile / 4) * 100) / 3}%`;

    return `<span class="mascot" data-set="${set}" style="width:${size}px;height:${size}px;background-position:${position}" aria-hidden="true"></span>`;
}

const BRAND = 15;
const AVATAR = 4;

const METRICS = [
    { icon: "upload", label: "Vídeos enviados", value: "3", spark: true },
    { icon: "scissors", label: "Cortes gerados", value: "8", spark: true },
    { icon: "mic", label: "Minutos transcritos", value: "69", unit: "min", spark: true },
    {
        icon: "clock",
        label: "Tempo médio por vídeo",
        value: "Sem dados",
        empty: "nenhum vídeo concluído",
    },
    { icon: "star", label: "Nota média do Brilho", value: "87", unit: "/100" },
    { icon: "warn", label: "Falhas", value: "0", sub: "nenhuma falha" },
];

const CLIPS = [
    {
        score: 92,
        title: "A vez que a Mansão Maromba fechou as portas",
        source: "ESSA HISTÓRIA DA URSO",
        tint: 1,
    },
    {
        score: 90,
        title: "De fã a sócio: a virada do Balestrin",
        source: "CARIANI E BALESTRIN",
        tint: 2,
    },
    {
        score: 90,
        title: "Por que ele recusou o contrato",
        source: "ESSA HISTÓRIA DA URSO",
        tint: 3,
    },
    {
        score: 88,
        title: "Perdidos em São Paulo com o ID4",
        source: "PRIMEIRO ROLE DE VW ID4",
        tint: 1,
    },
    { score: 85, title: "O ID4 não tem som assinado?", source: "PRIMEIRO ROLE DE VW ID4", tint: 2 },
];

const FUNNEL = [
    ["Enviados", 3],
    ["Transcritos", 3],
    ["Momentos escolhidos", 3],
    ["Cortes prontos", 3],
];

function sidebar() {
    return `<aside class="side">
        <div class="side-brand">${mascot(BRAND, 34)}<span class="side-brand-name">Nelcota</span><span class="icon-button">${icon("sidebar")}</span></div>
        <span class="button button-primary" style="margin-bottom:8px">${icon("add", 18)}Novo vídeo</span>
        <div class="nav">${icon("home")}Início<span class="nav-count">3</span></div>
        <div class="nav">${icon("clips")}Cortes<span class="nav-count">8</span></div>
        <div class="nav" aria-current="page">${icon("chart")}Painel</div>
        <div class="nav">${icon("account")}Conta</div>
        <div class="side-heading">Recentes</div>
        <div class="recent">${mascot(3, 30)}<div class="recent-text"><span class="recent-title truncate">PRIMEIRO ROLE DE VW ID4</span><span class="recent-note muted">3 cortes prontos</span></div></div>
        <div class="recent">${mascot(5, 30)}<div class="recent-text"><span class="recent-title truncate">ESSA HISTÓRIA DA URSO</span><span class="recent-note muted">3 cortes prontos</span></div></div>
        <span class="side-spacer"></span>
        <div class="me"><span class="avatar">${mascot(AVATAR, 28)}</span><div class="me-text"><strong class="truncate">Haniel</strong><span class="muted truncate" style="font-size:13px">sua conta</span></div>${icon("dots", 16)}</div>
    </aside>`;
}

function shell(content) {
    return `<div class="desk-o"><div class="frame">${sidebar()}<div class="content">${content}</div></div></div>`;
}

function periods(labels) {
    return `<div class="periods">${labels.map((label, index) => `<span aria-selected="${index === 1}">${label}</span>`).join("")}</div>`;
}

function header(periodLabels) {
    return `<div class="phead"><div><h1 class="ptitle">Painel</h1><p class="muted" style="margin-top:4px">Quanto você enviou, quantos cortes saíram e como foi cada etapa.</p></div>${periods(periodLabels)}</div>`;
}

const LONG_PERIODS = ["Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias"];
const SHORT_PERIODS = ["7 dias", "30 dias", "90 dias"];
const NOTE = `<p class="note">Nada no período anterior para comparar: as variações aparecem a partir do próximo período.</p>`;

function spark(width = 84) {
    return `<svg class="spark" style="width:${width}px" viewBox="0 0 84 28"><polyline fill="none" stroke="var(--muted-foreground)" stroke-width="1.5" points="0,26 60,26 66,26 70,4 74,26 84,26"/></svg>`;
}

function metric(definition) {
    const valueClass = definition.empty === undefined ? "metric-value" : "metric-value is-empty";
    const unit = definition.unit === undefined ? "" : `<small>${definition.unit}</small>`;
    const sub = definition.empty ?? definition.sub ?? "";
    const trailing = definition.spark === true ? spark() : "";

    return `<div class="metric"><span class="metric-label">${icon(definition.icon, 18)}${definition.label}</span><div class="metric-row"><span class="${valueClass}">${definition.value}${unit}</span>${trailing}</div>${sub === "" ? "" : `<span class="metric-sub">${sub}</span>`}</div>`;
}

function clip(data, options = {}) {
    const titleClass = options.clamp === true ? "clip-title clamp2" : "clip-title truncate";

    return `<div class="clip"><div class="frame916" data-tint="${data.tint}"><span class="clip-score">Nota ${data.score}</span></div><span class="${titleClass}">${data.title}</span><span class="clip-source truncate">${data.source}</span></div>`;
}

function chart(height = 220) {
    const points = "0,200 520,200 560,196 600,150 620,40";

    return `<svg class="chart" viewBox="0 0 640 220" preserveAspectRatio="none" style="height:${height}px">
        ${[0, 1, 2, 3].map((line) => `<line x1="0" x2="640" y1="${20 + line * 60}" y2="${20 + line * 60}" stroke="var(--border)" stroke-dasharray="3 4"/>`).join("")}
        <polyline fill="none" stroke="var(--muted-foreground)" stroke-dasharray="5 4" stroke-width="1.5" points="0,200 640,200"/>
        <polyline fill="oklch(0.7 0.15 245 / 0.15)" stroke="none" points="${points} 620,200"/>
        <polyline fill="none" stroke="oklch(0.7 0.15 245)" stroke-width="2.5" points="${points}"/>
    </svg>`;
}

function chartPanel(height) {
    return `<section class="panel"><div class="panel-head">${icon("chart", 20)}<span class="grow">Cortes acumulados</span></div><p style="font-size:15px"><b style="font-size:22px">8</b> <span class="muted">cortes · eram 0 no período anterior</span></p>${chart(height)}<div class="legend-row"><span><i></i>Este período</span><span><i class="prev"></i>Período anterior</span></div></section>`;
}

function funnelBars() {
    return `<section class="panel"><div class="panel-head">${icon("funnel", 20)}<span class="grow">Do envio ao corte</span><span class="link">vídeos por etapa</span></div><div class="funnel-bars">${FUNNEL.map(() => "<div></div>").join("")}</div><div class="funnel-labels">${FUNNEL.map(([label, value]) => `<span><b>${value}</b><br><span class="muted">${label}</span></span>`).join("")}</div></section>`;
}

function funnelSteps() {
    return `<section class="panel"><div class="panel-head">${icon("funnel", 20)}<span class="grow">Do envio ao corte</span><span class="link">100% chegaram aos cortes</span></div><div class="steps">${FUNNEL.map(([label, value]) => `<div class="step"><strong>${value}</strong><span>${label}</span></div>`).join("")}</div></section>`;
}

/* ---------- Current: what ships today at 1280 px ---------- */

function currentBoard() {
    const narrowClips = CLIPS.slice(0, 3)
        .map(
            (data) =>
                `<div class="clip" style="width:100%"><div class="frame916" data-tint="${data.tint}"><span class="clip-score">Nota ${data.score}</span></div><span class="clip-title clamp2">${data.title}</span><span class="clip-source truncate">${data.source}</span></div>`,
        )
        .join("");

    return shell(`${header(LONG_PERIODS)}${NOTE}
        <div style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:16px">
            <div class="squeeze" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-content:start">${METRICS.map(metric).join("")}</div>
            <section class="panel"><div class="panel-head">${icon("star", 20)}<span class="grow">Melhores cortes do período</span><span class="link" style="white-space:normal;width:44px">Ver todos</span></div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">${narrowClips}</div></section>
        </div>
        <div style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:16px">${chartPanel(200)}${funnelBars()}</div>`);
}

/* ---------- A: Números em faixa ---------- */

function boardA() {
    return shell(`${header(LONG_PERIODS)}${NOTE}
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">${METRICS.map(metric).join("")}</div>
        <div style="display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:16px">${chartPanel(190)}${funnelSteps()}</div>
        <section class="panel"><div class="panel-head">${icon("star", 20)}<span class="grow">Melhores cortes do período</span><span class="link">Ver todos ${icon("right", 14)}</span></div><div class="rail" style="grid-template-columns:repeat(5,minmax(0,1fr))">${CLIPS.map((data) => clip(data, { clamp: true })).join("")}</div></section>`);
}

/* ---------- B: Cortes em destaque ---------- */

function listRow(definition) {
    const unit =
        definition.unit === undefined
            ? ""
            : ` <span class="muted" style="font-size:14px">${definition.unit}</span>`;

    return `<div class="row-o">${icon(definition.icon, 18)}<span class="grow">${definition.label}</span><strong>${definition.value}${unit}</strong></div>`;
}

function boardB() {
    return shell(`${header(LONG_PERIODS)}
        <section class="panel"><div class="panel-head">${icon("star", 20)}<span class="grow">Melhores cortes do período</span><span class="link">Ver todos ${icon("right", 14)}</span></div><div class="rail" style="grid-template-columns:repeat(5,minmax(0,1fr))">${CLIPS.map((data) => clip(data, { clamp: true })).join("")}</div></section>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:16px">
            <section class="panel"><div class="panel-head">${icon("chart", 20)}<span class="grow">Em números</span></div>${NOTE}<div class="rows-o">${METRICS.map(listRow).join("")}</div></section>
            <div style="display:grid;gap:16px;align-content:start">${chartPanel(150)}${funnelSteps()}</div>
        </div>`);
}

/* ---------- C: Resumo em uma frase ---------- */

function hero() {
    return `<section class="hero"><p class="hero-line">Em 30 dias, <em>3 vídeos</em> viraram <em>8 cortes</em>, com nota média 87.</p><div class="hero-stats"><div class="hero-stat"><strong>3</strong><span>vídeos enviados</span></div><div class="hero-stat"><strong>8</strong><span>cortes gerados</span></div><div class="hero-stat"><strong>87<small class="muted" style="font-size:15px">/100</small></strong><span>nota média do Brilho</span></div></div><div class="mini-stats"><span class="mini-stat">${icon("mic", 16)}<b>69 min</b> transcritos</span><span class="mini-stat">${icon("clock", 16)}Tempo médio: <b>sem dados</b></span><span class="mini-stat">${icon("warn", 16)}<b>0</b> falhas</span></div></section>`;
}

function boardC() {
    return shell(`${header(LONG_PERIODS)}${hero()}
        ${chartPanel(170)}
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:16px">${funnelSteps()}<section class="panel"><div class="panel-head">${icon("star", 20)}<span class="grow">Melhores cortes</span><span class="link">Ver todos ${icon("right", 14)}</span></div><div class="rail" style="grid-template-columns:repeat(3,minmax(0,1fr))">${CLIPS.slice(
            0,
            3,
        )
            .map((data) => clip(data, { clamp: true }))
            .join("")}</div></section></div>`);
}

/* ---------- Phones ---------- */

function phoneTop() {
    return `<header class="phone-top">${mascot(BRAND, 30)}<strong style="flex:1">Nelcota</strong>${icon("menu")}</header>`;
}

function phone(content) {
    return `<div class="phone-o">${phoneTop()}<div class="content"><div><h1 class="ptitle">Painel</h1><p class="muted" style="margin-top:4px;font-size:15px">Quanto você enviou, quantos cortes saíram e como foi cada etapa.</p></div>${periods(SHORT_PERIODS)}${content}</div></div>`;
}

function phoneRail() {
    return `<section class="panel" style="padding:14px"><div class="panel-head">${icon("star", 20)}<span class="grow">Melhores cortes</span><span class="link">Ver todos</span></div><div class="phone-rail">${CLIPS.map((data) => clip(data, { clamp: true })).join("")}</div></section>`;
}

function phoneA() {
    return phone(
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${METRICS.map((definition) => metric({ ...definition, spark: false })).join("")}</div>${chartPanel(140)}${funnelSteps().replace('class="steps"', 'class="steps" style="grid-template-columns:1fr 1fr"')}${phoneRail()}`,
    );
}

function phoneB() {
    return phone(
        `${phoneRail()}<section class="panel"><div class="panel-head">${icon("chart", 20)}<span class="grow">Em números</span></div><div class="rows-o">${METRICS.map(listRow).join("")}</div></section>${chartPanel(130)}`,
    );
}

function phoneC() {
    return phone(
        `${hero().replace('class="hero-line"', 'class="hero-line" style="font-size:20px"')}${chartPanel(130)}${phoneRail()}`,
    );
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
