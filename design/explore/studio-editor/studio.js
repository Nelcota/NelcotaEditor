// Real cues of "Perdidos em São Paulo com o ID4" (0:59,3 a 1:20,9).
const CUES = [
    [59.45, "Meu Deus,"],
    [60.33, "que loucura nós"],
    [60.85, "andando perdido em"],
    [61.57, "São Paulo."],
    [61.85, "É esse o"],
    [62.49, "lugar aqui,"],
    [63.03, "ó."],
    [63.53, "Põe aí,"],
    [64.13, "caminho rótimo."],
    [64.47, "Rua ZV do"],
    [65.11, "Soares."],
    [65.85, "Que que é"],
    [66.15, "que é rótimo?"],
    [66.51, "Não,"],
    [66.67, "isso aqui é"],
    [66.91, "um print."],
    [67.73, "Meu Deus,"],
    [68.47, "meu Deus,"],
    [69.07, "pera aí."],
    [69.79, "Isso aqui é"],
    [70.37, "um print."],
    [70.87, "Pera aí,"],
    [70.99, "pera aí."],
    [71.95, "Rua."],
    [73.63, "Rua."],
    [74.25, "A ZV do"],
    [74.97, "Soares."],
    [76.51, "Soares."],
    [77.93, "Ah,"],
    [78.73, "1.500."],
    [80.09, "1.500."],
];
const START = 59.3;
const END = 80.94;
const PLAYING = 5;

const ICONS = {
    back: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m9 14 2 2 4-4"/>',
    play: '<path d="M6 4v16l14-8z"/>',
    scissors:
        '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    palette:
        '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.7 1.7-1.7h2A5.5 5.5 0 0 0 22 11c0-5-4.5-9-10-9Z"/>',
    split: '<path d="M12 3v18M4 8l-2 4 2 4M20 8l2 4-2 4"/>',
    merge: '<path d="M8 6l4 6-4 6M16 6l-4 6 4 6"/>',
    render: '<path d="M20 4H4v16h16z"/><path d="m10 9 5 3-5 3z"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 12h18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    wand: '<path d="m15 4 5 5L9 20H4v-5z"/>',
    home: '<path d="M3 10 12 3l9 7v10H3z"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
};

function icon(name) {
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

function clock(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = (seconds % 60).toFixed(1).replace(".", ",").padStart(4, "0");
    return `${minutes}:${rest}`;
}

function relative(seconds) {
    return clock(seconds - START);
}

function preview(options = {}) {
    const editable = options.editable === true;
    const hint = options.hint ?? "";
    return `<div class="preview" style="--cap-size:${options.size ?? 22}px">
        <div class="scene"><div class="window"></div><div class="dash"><i></i></div></div>
        <div class="cap${editable ? " is-editable" : ""}">lugar <em>aqui,</em></div>
        ${hint === "" ? "" : `<span class="cap-hint">${hint}</span>`}
    </div>`;
}

function transport(compact) {
    return `<div class="transport">
        <span class="button ghost icon-only">${icon("back")}</span>
        <span class="play">${icon("play")}</span>
        <span class="button ghost icon-only">${icon("next")}</span>
        <span class="mono">${compact ? "0:03,4" : "0:03,4 / 0:21,6"}</span>
    </div>`;
}

function editorBar({ phone = false, back = "Cortes" } = {}) {
    if (phone) {
        return `<header class="editor-bar">
            <span class="button ghost icon-only">${icon("back")}</span>
            <div class="clip-switch"><div class="title"><b>Perdidos em São Paulo…</b><span>Corte 1 de 3 · 0:21,6</span></div></div>
            <span class="spacer"></span>
            <span class="button ghost icon-only">${icon("undo")}</span>
            <span class="button primary small">Renderizar</span>
        </header>`;
    }

    return `<header class="editor-bar">
        <span class="button ghost">${icon("back")} ${back}</span>
        <span class="divider-v"></span>
        <div class="clip-switch">
            <span class="button ghost icon-only">${icon("back")}</span>
            <div class="title"><b>Perdidos em São Paulo com o ID4</b><span>Corte 1 de 3 · 0:59 a 1:21 · Nota 85</span></div>
            <span class="button ghost icon-only">${icon("next")}</span>
        </div>
        <span class="spacer"></span>
        <span class="saved">${icon("cloud")} Rascunho salvo</span>
        <span class="button ghost icon-only">${icon("undo")}</span>
        <span class="button ghost icon-only">${icon("redo")}</span>
        <span class="button primary">${icon("render")} Renderizar corte</span>
    </header>`;
}

function cueRows({ editing = -1, count = CUES.length, flag = true } = {}) {
    return CUES.slice(0, count)
        .map(([seconds, text], index) => {
            const classes = ["cue"];

            if (index === PLAYING) {
                classes.push("is-playing");
            }

            if (index === editing) {
                classes.push("is-editing");
            }

            let shown = text;

            if (flag) {
                shown = shown.replace("rótimo", "<mark>rótimo</mark>");
            }

            const tools =
                index === editing
                    ? `<div class="cue-tools"><span class="button small">${icon("split")} Dividir</span><span class="button small">${icon("merge")} Juntar com o próximo</span><span class="button small ghost">Excluir</span></div>`
                    : "";
            return `<div class="${classes.join(" ")}"><span class="time">${relative(seconds)}</span><span class="text">${shown}</span></div>${tools}`;
        })
        .join("");
}

function appNav(current = "Vídeos") {
    const items = [
        ["home", "Início"],
        ["video", "Vídeos"],
        ["scissors", "Cortes"],
        ["chart", "Painel"],
        ["user", "Conta"],
    ];
    return `<nav class="app-nav"><div class="logo"><i></i>nelcota</div>${items
        .map(
            ([name, label]) =>
                `<a class="${label === current ? "is-current" : ""}">${icon(name)} ${label}</a>`,
        )
        .join("")}</nav>`;
}

function timeline({ compact = false } = {}) {
    const total = 30;
    const from = 56;
    const percent = (seconds) => `${((seconds - from) / total) * 100}%`;
    const ticks = [56, 60, 64, 68, 72, 76, 80, 84]
        .filter((tick) => compact === false || tick % 8 === 0)
        .map(
            (tick) =>
                `<span style="left:${percent(tick)}">${clock(tick)
                    .replace(/,\d$/, "")
                    .replace(/:(\d)\b/, ":0$1")}</span>`,
        )
        .join("");
    const blocks = CUES.map(
        ([seconds, text], index) =>
            `<span class="block${index === PLAYING ? " is-on" : ""}" style="left:${percent(seconds)};width:calc(${percent(seconds + (CUES[index + 1]?.[0] ?? seconds + 0.6) - seconds + from)} - 2px)">${compact ? "" : text}</span>`,
    ).join("");
    const frames = Array.from({ length: compact ? 14 : 36 }, () => "<i></i>").join("");
    const playhead = `<span class="playhead" style="left:${percent(START + 3.4)}"></span>`;
    const label = (name, text) =>
        compact ? "<label></label>" : `<label>${icon(name)} ${text}</label>`;
    const style = compact ? ' style="grid-template-columns:0 minmax(0,1fr);gap:0"' : "";

    return `<section class="timeline">
        ${compact ? "" : `<div class="ruler">${ticks}</div>`}
        <div class="track"${style}>${label("film", "Trecho")}<div class="lane film">${frames}
            <span class="outside" style="left:0;width:${percent(START)}"></span>
            <span class="outside" style="left:${percent(END)};right:0"></span>
            <span class="keep" style="left:${percent(START)};width:calc(${percent(END)} - ${percent(START)})"></span>${playhead}</div></div>
        <div class="track"${style}>${label("type", "Legendas")}<div class="lane cues">${blocks}${playhead}</div></div>
    </section>`;
}

function presetsGrid() {
    const presets = [
        [
            "Karaokê",
            '<span>MEU <em style="font-style:normal;color:var(--caption-yellow)">DEUS,</em></span>',
            true,
        ],
        [
            "Impacto",
            '<span style="font-family:Inter;font-weight:800;letter-spacing:-.02em">MEU <span style="color:var(--success)">DEUS,</span></span>',
            false,
        ],
        ["Bloco", '<span>MEU <span style="color:oklch(0.7 0.18 300)">DEUS,</span></span>', false],
        ["Clássica", '<span style="font-family:Inter;font-weight:700">Meu Deus,</span>', false],
        [
            "Destaque azul",
            '<span>MEU <span style="color:var(--primary-ink)">DEUS,</span></span>',
            false,
        ],
        ["Sem legenda", '<span class="muted" style="font:600 12px Inter">Só o vídeo</span>', false],
    ];
    return `<div class="presets">${presets
        .map(
            ([name, sample, on]) =>
                `<div class="preset${on ? " is-on" : ""}"><span class="sample">${sample}</span><b>${name}</b></div>`,
        )
        .join("")}</div>`;
}

function fineTune() {
    return `<div class="field"><label>Cor do destaque</label><div class="swatches">
            <i class="is-on" style="background:var(--caption-yellow)"></i><i style="background:var(--success)"></i><i style="background:oklch(0.7 0.18 300)"></i><i style="background:var(--primary-ink)"></i><i style="background:white"></i></div></div>
        <div class="field"><label>Tamanho</label><div class="segmented"><span>P</span><span class="is-on">M</span><span>G</span></div></div>
        <div class="field"><label>Posição</label><div class="segmented"><span>Topo</span><span>Meio</span><span class="is-on">Base</span></div></div>`;
}

/* A · Editor com linha do tempo */

function aDesk() {
    return `<div class="view desk is-on a-desk">
        ${editorBar()}
        <div class="a-main">
            <aside class="side">
                <div class="segmented"><span class="is-on">${icon("type")} Legendas</span><span>${icon("palette")} Estilo</span></div>
                <div style="display:grid;grid-template-rows:auto minmax(0,1fr);gap:10px;min-height:0;overflow:hidden">
                    <div class="side-head"><b>31 blocos</b><span class="muted">Clique para corrigir</span></div>
                    <div class="cue-list">${cueRows({ editing: 8, count: 13 })}</div>
                </div>
            </aside>
            <section class="stage">${preview({ editable: true, size: 30 })}${transport(false)}</section>
            <aside class="inspect">
                <h3>Bloco selecionado</h3>
                <div class="field"><label>Começa</label><div class="stepper"><span>−</span><span class="value">0:04,8</span><span>+</span></div></div>
                <div class="field"><label>Termina</label><div class="stepper"><span>−</span><span class="value">0:05,2</span><span>+</span></div></div>
                <span class="button">${icon("wand")} Colar no áudio</span>
                <h3 style="margin-top:12px">Trecho do corte</h3>
                <div class="field"><label>Início · Fim</label><div style="display:flex;gap:6px"><span class="chip mono">0:59,3</span><span class="chip mono">1:20,9</span><span class="chip">21,6 s</span></div></div>
                <span class="button">Marcar início aqui <span class="mono muted">I</span></span>
                <span class="button">Marcar fim aqui <span class="mono muted">O</span></span>
            </aside>
        </div>
        ${timeline()}
    </div>`;
}

function aPhone() {
    return `<div class="view phone is-on phone a-phone">
        ${editorBar({ phone: true })}
        <section class="stage">${preview({ editable: true, size: 20, hint: "Toque na legenda para editar" })}</section>
        <div style="padding:0 12px 8px;background:var(--stage)">${transport(true)}</div>
        ${timeline({ compact: true })}
        <nav class="toolbar-bottom"><span>${icon("scissors")} Trecho</span><span class="is-on">${icon("type")} Legendas</span><span>${icon("palette")} Estilo</span></nav>
    </div>`;
}

/* B · Editar pelo texto */

function docText() {
    const words = CUES.slice(0, 16).map(([, text], index) => {
        let shown = text.replace("rótimo", "<mark>rótimo</mark>");

        if (index === PLAYING) {
            shown = `<span class="w is-now">${shown}</span>`;
        }

        return shown;
    });
    return `<p class="doc-text"><span class="ctx">…e a gente saiu cedo pra testar a autonomia. </span><span class="edge">${icon("scissors")} Início</span>${words.join('<span class="brk"></span>')} <span class="ctx">[mais 15 blocos]</span><span class="edge">Fim ${icon("scissors")}</span><span class="ctx"> E aí, chegamos no posto…</span></p>`;
}

function bDesk() {
    return `<div class="view desk is-on b-desk">
        ${appNav()}
        <div class="b-work">
            ${editorBar({ back: "Vídeo" })}
            <div class="b-main">
                <section class="b-left">
                    ${preview({ size: 26 })}
                    ${transport(false)}
                    <div class="style-strip">
                        <span class="mini is-on">MEU <span style="color:var(--caption-yellow)">&nbsp;DEUS</span></span>
                        <span class="mini" style="font-family:Inter">MEU <span style="color:var(--success)">&nbsp;DEUS</span></span>
                        <span class="mini">MEU <span style="color:oklch(0.7 0.18 300)">&nbsp;DEUS</span></span>
                        <span class="button small">${icon("palette")} Estilo</span>
                    </div>
                </section>
                <section class="doc">
                    <div class="doc-head"><h2>Texto do corte</h2><span class="chip mono">0:59,3 a 1:20,9 · 21,6 s</span><span class="spacer"></span><span class="button small ghost">Voltar ao original</span></div>
                    <div class="legend-row">
                        <span>Clique numa palavra para corrigir</span>
                        <span><span class="brk" style="display:inline-block;width:2px;height:14px;background:var(--accent)"></span> troca de bloco: Enter divide, Backspace junta</span>
                        <span>Arraste <b style="color:var(--warning)">Início</b> e <b style="color:var(--warning)">Fim</b> para mudar o trecho</span>
                    </div>
                    ${docText()}
                    <div class="popover" style="justify-self:start;margin-left:120px">
                        <span class="muted" style="font-size:12px">"rótimo" · ouvido com pouca certeza</span>
                        <div style="display:flex;gap:6px"><span class="button small primary">Trocar por "ótimo"</span><span class="button small">Editar</span><span class="button small ghost">Manter</span></div>
                    </div>
                </section>
            </div>
        </div>
    </div>`;
}

function bPhone() {
    return `<div class="view phone is-on phone b-phone">
        ${editorBar({ phone: true })}
        <div class="top-preview">
            ${preview({ size: 14 })}
            <div style="display:grid;align-content:center;gap:12px">
                ${transport(true)}
                <span class="chip mono" style="justify-self:center">21,6 s · 31 blocos</span>
                <span class="button small">${icon("palette")} Estilo: Karaokê</span>
            </div>
        </div>
        <section class="doc">
            <div class="legend-row"><span>Toque numa palavra para corrigir</span></div>
            ${docText()}
        </section>
        <nav class="toolbar-bottom"><span>${icon("split")} Dividir</span><span>${icon("merge")} Juntar</span><span>${icon("undo")} Desfazer</span></nav>
    </div>`;
}

/* C · Uma coluna, sem passos */

function cSections(phone) {
    const rows = phone ? 7 : 9;
    return `<div class="c-section"><h2>Trecho <span>0:59,3 a 1:20,9 · 21,6 s</span></h2>
            <div class="mini-trim"><div class="lane film">${Array.from({ length: 24 }, () => "<i></i>").join("")}<span class="outside" style="left:0;width:10%"></span><span class="outside" style="left:34%;right:0"></span><span class="keep" style="left:10%;width:24%"></span></div>
            ${phone ? "" : '<div style="display:flex;gap:8px"><span class="button small">Marcar início aqui</span><span class="button small">Marcar fim aqui</span></div>'}</div></div>
        <div class="c-section"><h2>Legendas <span>31 blocos · toque no texto para corrigir</span></h2><div class="cue-list">${cueRows({ editing: phone ? -1 : 8, count: rows })}</div></div>
        <div class="c-section"><h2>Estilo</h2>${presetsGrid()}</div>`;
}

function cDesk() {
    return `<div class="view desk is-on c-desk">
        ${appNav()}
        <div class="c-work">
            <div class="c-head">
                <div style="display:flex;align-items:center;gap:12px"><h1 style="font-size:22px">PRIMEIRO ROLE DE VW ID4</h1><span class="spacer"></span><span class="button icon-only">${icon("more")}</span></div>
                <div class="tabs"><span>Cortes 3</span><span>Original</span><span class="is-on">Studio</span></div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;padding:16px 32px 0">
                <span class="button">${icon("back")}</span><div class="clip-switch"><div class="title"><b>Perdidos em São Paulo com o ID4</b><span>Corte 1 de 3</span></div></div><span class="button">${icon("next")}</span>
                <span class="spacer"></span><span class="saved">${icon("cloud")} Rascunho salvo</span><span class="button ghost icon-only">${icon("undo")}</span><span class="button ghost icon-only">${icon("redo")}</span>
            </div>
            <div class="c-main">
                <section class="c-left">${preview({ size: 24 })}${transport(false)}</section>
                <section class="c-right">${cSections(false)}
                    <div class="sticky-render"><span class="muted" style="font-size:13px">2 legendas mudaram desde a última renderização</span><span class="spacer"></span><span class="button primary">${icon("render")} Renderizar corte</span></div>
                </section>
            </div>
        </div>
    </div>`;
}

function cPhone() {
    return `<div class="view phone is-on phone c-phone">
        ${editorBar({ phone: true })}
        <div class="c-preview"><div style="height:300px">${preview({ size: 16 })}</div>${transport(true)}</div>
        <section class="c-right" style="overflow:hidden">${cSections(true)}</section>
        <div class="render-bar"><span class="muted" style="font-size:13px;align-self:center;flex:1">2 mudanças</span><span class="button primary">Renderizar corte</span></div>
    </div>`;
}

const VIEWS = {
    "a-desk": aDesk,
    "a-phone": aPhone,
    "b-desk": bDesk,
    "b-phone": bPhone,
    "c-desk": cDesk,
    "c-phone": cPhone,
};

const params = new URLSearchParams(location.search);
const key = `${params.get("o") ?? "a"}-${params.get("v") ?? "desk"}`;
// The render comes from the pair found by comparing names, never from indexing with the text from
// the address; anything unknown shows the first view.
const entries = Object.entries(VIEWS);
const entry = entries.find(([name]) => name === key) ?? entries[0];
const render = entry[1];
document.body.innerHTML = render();
document.body.style.width = "fit-content";
