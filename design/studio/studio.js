// Studio boards, direction A "Mesa de edição", built from the demo video's real data.
const STORAGE = "../../storage/videos/0abfb74f-16eb-4586-affb-cc2189c39e5c";
const SOURCE = `${STORAGE}/source.mp4`;
const CLIP_TITLE = "A história do Golf pintado na concessionária";
const START = 116.29;
const END = 155.0;
const NOW = 125.5;
const WINDOW_START = 108;
const WINDOW_END = 160;
const FIXES = { porcionária: "concessionária", golfe: "Golf", porcionário: "concessionário" };
const SELECTED_WORD = "golfe";
const CLIPS = [
    { rank: 1, title: CLIP_TITLE, time: "1:56–2:35" },
    { rank: 2, title: "Câmbio DQ381 de GLI no Golf 4x4", time: "0:28–1:11" },
    {
        rank: 3,
        title: "O plano original: carro de levar filho na escola e que acabou virando o projeto de 600 cavalos mais comentado do canal",
        time: "14:22–15:51",
    },
    { rank: 4, title: "510 cavalos de roda e forjado", time: "3:23–4:04" },
    { rank: 5, title: "Cat King e o coletor Racing Line", time: "4:05–4:25" },
];
const CREW = { fire: 21, shield: 26, clover: 28, star: 30, octopus: 23 };

const BOARD = new URLSearchParams(location.search).get("b") ?? "default";

const icon = (name, extra = "") =>
    `<svg class="i ${extra}" viewBox="0 0 24 24" aria-hidden="true">${window.ICONS[name] ?? ""}</svg>`;
const frame = (seconds) => `<video src="${SOURCE}#t=${seconds}" muted preload="auto"></video>`;
const mascot = (index, size = 32) => {
    const tile = index % 16;
    const x = (tile % 4) * (100 / 3);
    const y = Math.floor(tile / 4) * (100 / 3);
    const spriteSheet = index < 16 ? "shapes" : "objects";
    return `<span class="mascot" style="width:${size}px;height:${size}px;background-image:url(../../public/mascots/${spriteSheet}.webp);background-position:${x}% ${y}%"></span>`;
};
const clipClock = (seconds) => {
    const relative = Math.max(0, seconds - START);
    const whole = Math.floor(relative);
    const tenth = Math.floor((relative - whole) * 10);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")},${tenth}`;
};
const clock = (seconds) => {
    const s = Math.round(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const pctIn = (seconds, from, to) => `${((seconds - from) / (to - from)) * 100}%`;

/* ---------- Words and cues (same grouping rules as build-ass-subtitles.ts) ---------- */

const WORDS = window.WORDS.map(([text, start, end]) => ({
    original: text,
    text: FIXES[text] ?? text,
    isEdited: FIXES[text] !== undefined,
    start,
    end,
    isCut: start < START,
}));

function groupCues(words) {
    const cues = [];
    let current = [];
    for (const word of words) {
        const last = current.at(-1);
        const breaks =
            last !== undefined &&
            (current.length >= 3 || /[.!?…,;:]$/.test(last.text) || word.start - last.end > 0.6);
        if (breaks) {
            cues.push(current);
            current = [];
        }
        current.push(word);
    }
    if (current.length > 0) {
        cues.push(current);
    }
    return cues.map((group) => ({
        words: group,
        start: group[0].start,
        end: group.at(-1).end,
        isEdited: group.some((w) => w.isEdited),
        isPlaying: group[0].start <= NOW && NOW <= group.at(-1).end + 0.3,
        isCut: group.every((w) => w.isCut),
    }));
}

const LIVE_CUES = groupCues(WORDS).filter((cue) => cue.isCut === false);
const PLAYING = LIVE_CUES.find((cue) => cue.isPlaying) ?? LIVE_CUES[0];
const cueText = (cue) => cue.words.map((w) => w.text).join(" ");
const cueHtml = (cue) =>
    cue.words.map((w) => (w.isEdited ? `<span class="edited">${w.text}</span>` : w.text)).join(" ");

/* ---------- Page header, tabs, toolbar ---------- */

function pageHead({ studioCount = true, meta = "Pronto · YouTube · 16:51 · 5 cortes" } = {}) {
    return `
    <div class="page-head">
        <div class="thumb">${frame(140)}</div>
        <div style="display:grid;gap:2px;min-width:0">
            <h1>ACELEREI O GOLF R 4X4 DE 600CV</h1>
            <p class="muted">${meta}</p>
        </div>
    </div>
    <nav class="tabs">
        <span class="tab">${icon("film")}Cortes ${studioCount ? '<span class="count">5</span>' : ""}</span>
        <span class="tab is-active">${icon("pen")}Studio</span>
    </nav>`;
}

function clipSelect({ isOpen = false } = {}) {
    return `<span class="select" style="flex:0 1 400px;${isOpen ? "border-color:var(--ring);box-shadow:0 0 0 4px color-mix(in oklch,var(--ring) 35%,transparent)" : ""}">
        <span class="label" style="flex:none">Corte 1 de 5</span>
        <b>${CLIP_TITLE}</b>
        <span style="margin-left:auto">${icon("arrowDown")}</span>
    </span>`;
}

const SAVE_STATES = {
    saved: `<span class="save-state">${icon("cloud", "sm")}Rascunho salvo</span>`,
    saving: `<span class="save-state">${icon("cloud", "sm")}Salvando rascunho…</span>`,
    failed: `<span class="save-state" style="color:var(--destructive)">${icon("cloudCross", "sm")}Rascunho não salvo · <u>Tentar de novo</u></span>`,
    offline: `<span class="save-state">${icon("cloudCross", "sm")}Salvo no navegador</span>`,
    none: "",
};

function renderButton(kind) {
    const map = {
        ready: `<span class="btn primary">${icon("render")}Renderizar corte</span>`,
        clean: `<span class="btn primary" aria-disabled="true">${icon("render")}Renderizar corte</span>`,
        busy: `<span class="btn primary is-busy" aria-disabled="true">${icon("render")}Renderizando…</span>`,
        offline: `<span class="btn primary" aria-disabled="true">${icon("render")}Renderizar corte</span>`,
    };
    return map[kind];
}

function toolbar({
    save = "saved",
    dirty = "3 alterações não renderizadas",
    button = "ready",
    undo = true,
    open = false,
} = {}) {
    return `<div class="toolbar">
        ${clipSelect({ isOpen: open })}
        <span class="btn icon ghost" title="Desfazer" ${undo ? "" : 'aria-disabled="true"'}>${icon("undo")}</span>
        <span class="btn icon ghost" title="Refazer" aria-disabled="true">${icon("redo")}</span>
        <span class="grow"></span>
        ${SAVE_STATES[save]}
        ${dirty ? `<span class="dirty">${dirty}</span>` : ""}
        ${renderButton(button)}
    </div>`;
}

/* ---------- Preview ---------- */

function captionOverlay(widthPx, { text = null, size = 0.085 } = {}) {
    const fontPx = Math.round(widthPx * size);
    const playingWord = PLAYING.words.find((w) => w.start <= NOW && NOW <= w.end + 0.4);
    const html =
        text ??
        PLAYING.words
            .map((w) => (w === playingWord ? `<span class="hi">${w.text}</span>` : w.text))
            .join(" ");
    return `<div class="cap" style="bottom:22%;font-size:${fontPx}px">${html}</div>`;
}

function preview(widthPx, { note = null, caption = {}, showCaption = true, compact = false } = {}) {
    const played = ((NOW - START) / (END - START)) * 100;
    return `<div class="frame" style="width:${widthPx}px">
        ${frame(NOW)}
        ${showCaption ? captionOverlay(widthPx, caption) : ""}
        ${note ?? ""}
        <div class="frame-bar">
            ${icon("play", "sm")}
            ${compact ? "" : `<span class="tabular">${clipClock(NOW)} / ${clipClock(END)}</span>`}
            <span class="track"><i style="width:${played}%"></i></span>
            ${icon("full", "sm")}
        </div>
    </div>`;
}

/* ---------- Style panel ---------- */

function styleFields({ captionsOff = false } = {}) {
    const swatches = ["#FFE500", "#2CC056", "#FF4D4D", "#38BDF8", "#C084FC", "#FFFFFF"]
        .map(
            (c, i) =>
                `<span class="swatch ${i === 0 ? "is-on" : ""}" style="background:${c}"></span>`,
        )
        .join("");
    const lock = captionsOff ? 'class="is-locked"' : "";
    return `
        <label class="field"><span>${icon("subtitles")}Legenda</span>
            <span class="segmented"><span class="${captionsOff ? "" : "is-on"}">Karaokê</span><span>Clássica</span><span class="${captionsOff ? "is-on" : ""}">Sem</span></span>
        </label>
        <div ${lock} style="display:grid;gap:20px">
            <label class="field"><span>${icon("palette")}Cor do destaque</span><span class="swatches">${swatches}</span></label>
            <label class="field"><span>${icon("textSize")}Tamanho</span>
                <span class="segmented"><span>P</span><span class="is-on">M</span><span>G</span></span></label>
            <label class="field"><span>${icon("align")}Posição</span>
                <span class="segmented"><span>Cima</span><span>Meio</span><span class="is-on">Baixo</span></span></label>
            <label class="field"><span>${icon("text")}Fonte</span>
                <span class="select" style="width:100%"><b>Montserrat Black</b><span style="margin-left:auto">${icon("arrowDown")}</span></span></label>
        </div>
        <label class="field"><span>${icon("ratio")}Formato</span>
            <span class="segmented"><span class="is-on">9:16</span><span>1:1</span><span>16:9</span></span>
        </label>`;
}

function stylePanel(options = {}) {
    return `<section class="panel ${options.locked ? "is-locked" : ""}">
        <div class="panel-head">${icon("palette")}Estilo</div>
        <div class="panel-body">${styleFields(options)}</div>
    </section>`;
}

/* ---------- Caption list ---------- */

function cueRow(cue, { openWord = SELECTED_WORD } = {}) {
    if (openWord !== null && cue.words.some((w) => w.original === openWord)) {
        return `<div class="cue is-open">
            <div class="input is-focus">${cueHtml(cue)}<span class="caret"></span></div>
            <div class="time-pair">
                <span class="input">${clipClock(cue.start)}</span>
                <span class="input">${clipClock(cue.end)}</span>
                <span class="btn icon sm" title="Dividir bloco no cursor">${icon("scissors", "sm")}</span>
                <span class="btn icon sm" title="Voltar ao original">${icon("restart", "sm")}</span>
            </div>
            <span class="muted" style="font-size:13px">Antes: "${cue.words.map((w) => w.original).join(" ")}"</span>
        </div>`;
    }
    const classes = ["cue", cue === PLAYING && "is-playing"].filter(Boolean).join(" ");
    return `<div class="${classes}"><time>${clipClock(cue.start)}</time><span>${cueHtml(cue)}</span></div>`;
}

function captionHead(extra = "") {
    return `<div class="panel-head">${icon("subtitles")}Legendas <span class="muted" style="font-weight:600">· ${LIVE_CUES.length} blocos</span><span class="grow"></span>${extra}<span class="btn icon sm ghost" title="Voltar tudo ao original">${icon("restart", "sm")}</span></div>`;
}

function captionPanel({
    body = null,
    height = 556,
    locked = false,
    openWord = SELECTED_WORD,
    from = 4,
    follow = false,
} = {}) {
    const rows =
        body ??
        LIVE_CUES.slice(from, from + 11)
            .map((cue) => cueRow(cue, { openWord }))
            .join("");
    return `<section class="panel ${locked ? "is-locked" : ""}" style="position:relative">
        ${captionHead()}
        <div class="cues" style="height:${height}px">${rows}</div>
        ${follow ? `<span class="follow-pill">${icon("target", "sm")}Voltar ao trecho tocando</span>` : ""}
    </section>`;
}

/* ---------- Timeline ---------- */

function filmstrip(count, from, to) {
    const step = (to - from) / count;
    return Array.from(
        { length: count },
        (_, i) => `<span class="fill">${frame(from + step * (i + 0.5))}</span>`,
    ).join("");
}

function ruler(from, to, every) {
    const marks = [];
    for (let t = Math.ceil(from / every) * every; t <= to; t += every) {
        marks.push(`<span style="left:${pctIn(t, from, to)}">${clock(t)}</span>`);
    }
    return `<div class="ruler">${marks.join("")}</div>`;
}

function cueChips(from, to, selectedWord) {
    return LIVE_CUES.map((cue) => {
        const isSelected =
            selectedWord !== null && cue.words.some((w) => w.original === selectedWord);
        const classes = [
            "chip",
            cue === PLAYING && "is-playing",
            cue.isEdited && "is-edited",
            isSelected && "is-selected",
        ]
            .filter(Boolean)
            .join(" ");
        const grips = isSelected
            ? '<i class="grip" style="left:2px"></i><i class="grip" style="right:2px"></i>'
            : "";
        return `<span class="${classes}" title="${cueText(cue)}" style="left:${pctIn(cue.start, from, to)};width:calc(${pctIn(cue.end, from, to)} - ${pctIn(cue.start, from, to)} - 2px)">${grips}</span>`;
    }).join("");
}

function trimLane(
    from,
    to,
    { stripHeight = 56, frames = 12, tip = null, tipError = false, noFrames = false } = {},
) {
    const tipStyle = tipError ? "background:var(--destructive);color:#fff" : "";
    return `<div class="lane">
        <div class="strip" style="height:${stripHeight}px;${noFrames ? "background:var(--secondary)" : ""}">${noFrames ? "" : filmstrip(frames, from, to)}</div>
        <div class="outside" style="left:0;width:${pctIn(START, from, to)}"></div>
        <div class="outside" style="left:${pctIn(END, from, to)};right:0"></div>
        <div class="range" style="left:${pctIn(START, from, to)};width:calc(${pctIn(END, from, to)} - ${pctIn(START, from, to)})">
            <span class="handle start"></span><span class="handle end"></span>
        </div>
        ${tip ? `<span class="handle-tip" style="left:${pctIn(START, from, to)};${tipStyle}">${tip}</span>` : ""}
        <span class="playhead" style="left:${pctIn(NOW, from, to)}"></span>
    </div>`;
}

function timeline({
    locked = false,
    tip = "Início 1:56,3 · corte com 38,7 s",
    selectedWord = SELECTED_WORD,
    noFrames = false,
} = {}) {
    return `<section class="timeline ${locked ? "is-locked" : ""}">
        <div class="timeline-head">
            <span class="track-label">${icon("scissors", "sm")}Trecho do original</span>
            <span class="muted tabular">1:56,3 – 2:35,0 · 38,7 s (de 15 a 90 s)</span>
            <span class="grow"></span>
            <span class="btn sm ghost">Marcar início aqui <kbd>[</kbd></span>
            <span class="btn sm ghost">Marcar fim aqui <kbd>]</kbd></span>
        </div>
        ${ruler(WINDOW_START, WINDOW_END, 5)}
        ${trimLane(WINDOW_START, WINDOW_END, { tip, noFrames })}
        <div class="cue-track">${cueChips(WINDOW_START, WINDOW_END, selectedWord)}</div>
    </section>`;
}

/* ---------- The whole screen ---------- */

function studio({
    banner = "",
    bar = {},
    style = {},
    center = null,
    captions = {},
    line = null,
    time = {},
    after = "",
} = {}) {
    const hint =
        line ??
        `<span class="hint-line"><kbd>Espaço</kbd> tocar <kbd>J</kbd><kbd>L</kbd> 5 s <kbd>Ctrl Z</kbd> desfazer</span>`;
    return `<div class="shot" style="position:relative">
        ${pageHead()}
        ${banner}
        ${toolbar(bar)}
        <div style="display:grid;grid-template-columns:268px minmax(0,1fr) 360px;gap:16px;align-items:start">
            ${stylePanel(style)}
            <div style="display:grid;justify-items:center;gap:10px">
                ${center ?? preview(300)}
                ${hint}
            </div>
            ${captionPanel(captions)}
        </div>
        ${timeline(time)}
        ${after}
    </div>`;
}

/* ---------- Boards ---------- */

function brasaNote() {
    return `<div class="frame-note">
        ${mascot(CREW.fire, 48)}
        <b>Brasa está refazendo o corte</b>
        <span class="muted">Com as 3 alterações. Leva cerca de 1 minuto.</span>
        <div class="progress" style="width:80%"><i style="width:42%"></i></div>
        <span class="muted tabular" style="font-size:13px">42% · faltam cerca de 40 s</span>
    </div>`;
}

const LOCKED_LINE = `<span class="hint-line">${icon("lock", "sm")}A edição volta quando o corte ficar pronto. Pode sair desta página.</span>`;

const BOARDS = {
    default: () => studio(),

    loading: () => `<div class="shot" aria-busy="true">
        ${pageHead()}
        <div class="toolbar"><span class="skeleton" style="width:400px;height:40px"></span><span class="grow"></span><span class="skeleton" style="width:180px;height:40px"></span></div>
        <div style="display:grid;grid-template-columns:268px minmax(0,1fr) 360px;gap:16px;align-items:start">
            <span class="skeleton" style="height:580px;border-radius:16px"></span>
            <div style="display:grid;justify-items:center"><span class="skeleton" style="width:300px;aspect-ratio:9/16;border-radius:16px"></span></div>
            <span class="skeleton" style="height:612px;border-radius:16px"></span>
        </div>
        <span class="skeleton" style="height:150px;border-radius:16px"></span>
    </div>`,

    "not-ready": () => `<div class="shot">
        ${pageHead({ studioCount: false, meta: "Transcrevendo · YouTube · 16:51" })}
        <div class="panel"><div class="empty">
            ${mascot(CREW.octopus, 64)}
            <h2>O Studio abre quando os cortes ficarem prontos</h2>
            <p>Tinta está transcrevendo o vídeo (38% do total, faltam cerca de 6 min). Sem a transcrição ainda não dá para editar as legendas.</p>
            <span class="btn">${icon("film")}Acompanhar em Cortes</span>
        </div></div>
    </div>`,

    rendering: () =>
        studio({
            bar: { save: "none", dirty: "", button: "busy", undo: false },
            style: { locked: true },
            center: preview(300, { note: brasaNote() }),
            captions: { locked: true, openWord: null },
            line: LOCKED_LINE,
            time: { locked: true, tip: null, selectedWord: null },
        }),

    failed: () =>
        studio({
            banner: `<div class="banner is-error">${mascot(CREW.shield, 32)}<span class="grow"><b>Não foi possível refazer o corte.</b> <span class="muted">Guarda: o arquivo do vídeo original não abriu no servidor. Suas alterações continuam aqui.</span></span><span class="btn">${icon("restart")}Tentar de novo</span></div>`,
            bar: { save: "saved", dirty: "3 alterações não renderizadas", button: "ready" },
            captions: { openWord: null },
            time: { tip: null, selectedWord: null },
        }),

    rendered: () =>
        studio({
            bar: { save: "saved", dirty: "", button: "clean" },
            captions: { openWord: null },
            time: { tip: null, selectedWord: null },
            line: `<span class="hint-line" style="color:var(--success)">${icon("check", "sm")}Tocando o arquivo novo</span>`,
            after: `<div class="toast" style="position:absolute;right:32px;bottom:32px">${mascot(CREW.clover, 28)}<span><b>Corte refeito.</b> <span class="muted">O arquivo para baixar já é o novo.</span></span><span class="btn sm">${icon("download", "sm")}Baixar</span></div>`,
        }),

    "no-preview": () =>
        studio({
            center: `<div class="frame" style="width:300px;background:var(--card)">
                <div class="frame-note" style="background:transparent">
                    ${icon("videoOff")}
                    <b>Sem prévia ao vivo</b>
                    <span class="muted">Este navegador não toca o formato do vídeo original (HEVC). Você pode editar normalmente; o resultado aparece depois de renderizar.</span>
                    <span class="btn sm">${icon("eye", "sm")}Ver o corte atual</span>
                </div>
            </div>`,
            line: `<span class="hint-line">Sem miniaturas na linha do tempo pelo mesmo motivo.</span>`,
            captions: { openWord: null },
            time: { tip: null, selectedWord: null, noFrames: true },
        }),

    offline: () =>
        studio({
            banner: `<div class="banner">${icon("cloudCross")}<span class="grow"><b>Sem conexão desde 14:32.</b> <span class="muted">Pode continuar editando: as alterações ficam neste navegador e são salvas quando a conexão voltar.</span></span></div>`,
            bar: { save: "offline", dirty: "4 alterações não renderizadas", button: "offline" },
            captions: { openWord: null },
            time: { tip: null, selectedWord: null },
        }),

    sheet: () => sheet(),
    dialogs: () => dialogs(),
    "phone-default": () => phone(),
    "phone-rendering": () => phone({ rendering: true }),
    "phone-style": () => phone({ tab: "style" }),
    "phone-trim": () => phone({ tab: "trim" }),
};

/* ---------- State sheet: parts that change ---------- */

function miniPanel(body, height = 260) {
    return `<section class="panel" style="position:relative">${captionHead()}<div class="cues" style="height:${height}px">${body}</div></section>`;
}

function sheet() {
    const loadError = `<div class="empty" style="padding:40px 20px;gap:10px">${mascot(CREW.shield, 40)}<b>Não foi possível carregar as legendas</b><p style="font-size:14px">A prévia e o trecho continuam funcionando.</p><span class="btn sm">${icon("restart", "sm")}Tentar de novo</span></div>`;
    const noSpeech = `<div class="empty" style="padding:40px 20px;gap:10px">${mascot(CREW.octopus, 40)}<b>Nenhuma fala neste trecho</b><p style="font-size:14px">Tinta não ouviu ninguém falando entre 1:56 e 2:35. Mude o trecho para incluir fala, ou deixe o corte sem legenda.</p></div>`;
    const off = `<div class="banner" style="margin:12px;font-size:14px">${icon("info", "sm")}<span class="grow">Legenda desligada neste corte. O texto continua guardado.</span><span class="btn sm">Ligar</span></div>${LIVE_CUES.slice(
        5,
        8,
    )
        .map((cue) => cueRow(cue, { openWord: null }))
        .join("")}`;
    const many = LIVE_CUES.slice(20, 27)
        .map((cue) => cueRow(cue, { openWord: null }))
        .join("");
    const longCue = `<div class="cue is-open"><div class="input is-focus" style="line-height:1.4;padding:10px 12px;height:auto">INCONSTITUCIONALISSIMAMENTE transformado<span class="caret"></span></div><span style="font-size:13px;color:var(--destructive)">Esta palavra não cabe na largura do 9:16 e sai cortada. Abrevie ou diminua o tamanho.</span></div>`;
    return `<div class="sheet">
        <div class="sheet-title"><h1>Studio · peças que mudam</h1><p class="muted">Cada item mostra só a parte da tela que muda; o resto fica como na tela padrão.</p></div>
        <figure>${miniPanel(loadError)}<figcaption><b>Legendas não carregaram.</b> O erro fica no painel; o resto da tela segue usável.</figcaption></figure>
        <figure>${miniPanel(noSpeech)}<figcaption><b>Corte sem fala.</b> O estilo fica desativado; o trecho continua editável.</figcaption></figure>
        <figure>${miniPanel(off)}<figcaption><b>Legenda desligada</b> ("Sem" no estilo). Dá para editar o texto e ligar de novo.</figcaption></figure>
        <figure>${miniPanel(many)}<span class="follow-pill" style="position:relative;left:auto;bottom:auto;transform:none;justify-self:center;margin-top:-52px">${icon("target", "sm")}Voltar ao trecho tocando</span><figcaption><b>Muitos blocos (corte de 90 s, ~60 blocos).</b> A lista acompanha o vídeo; se você rolar com a mão, ela para de acompanhar e aparece este botão.</figcaption></figure>
        <figure>${miniPanel(longCue, 140)}<div style="display:grid;justify-items:center;margin-top:8px">${preview(170, { caption: { text: 'INCONSTITUCIONALISSIMAMENTE <span class="hi">TRANSFORMADO</span>', size: 0.085 }, compact: true })}</div><figcaption><b>Palavra longa demais.</b> A prévia mostra o corte como a Brasa vai gerar, e o aviso diz o que fazer.</figcaption></figure>
        <figure>
            <div class="timeline" style="padding:44px 16px 16px">${trimLane(WINDOW_START, WINDOW_END, { tip: "Mínimo de 15 s", tipError: true, frames: 8 })}</div>
            <div class="timeline" style="padding:16px">
                <div class="cue-track">${cueChips(WINDOW_START, WINDOW_END, SELECTED_WORD)}</div>
                <span class="hint-line">${icon("info", "sm")}Um bloco não passa por cima do vizinho nem sai do trecho.</span>
            </div>
            <figcaption><b>Limites ao arrastar.</b> A alça para em 15 s e em 90 s e diz o motivo em vermelho; os blocos param encostados no vizinho.</figcaption>
        </figure>
        <figure style="grid-column:1 / -1">
            <div style="display:grid;gap:10px">
                ${toolbar({ save: "saving" })}
                ${toolbar({ save: "failed" })}
                ${toolbar({ save: "saved", dirty: "", button: "clean", undo: false })}
            </div>
            <figcaption><b>Rascunho e botão Renderizar.</b> Salvando… → salvo (a cada alteração, sem botão). Se falhar, fica em vermelho com "Tentar de novo" e as alterações seguem na tela. Sem alterações, Renderizar fica desativado e o texto some.</figcaption>
        </figure>
        <figure>
            <div class="menu">${CLIPS.map((c, i) => `<div class="menu-item ${i === 0 ? "is-on" : ""}"><span class="rank">${c.rank} de 5</span><b>${c.title}</b><span class="muted tabular" style="font-size:13px">${i === 0 ? "● " : ""}${c.time}</span></div>`).join("")}</div>
            <figcaption><b>Trocar de corte.</b> Melhores primeiro, como em Cortes; o ponto verde indica alterações não renderizadas naquele corte.</figcaption>
        </figure>
        <figure>
            <div class="toast">${icon("trash")}<span>Bloco apagado.</span><span class="btn sm">Desfazer</span></div>
            <div class="toast">${icon("check")}<span>Voltou ao texto original.</span><span class="btn sm">Desfazer</span></div>
            <figcaption><b>Apagar todo o texto de um bloco</b> remove o bloco; o aviso fica 8 s com Desfazer (Ctrl Z também desfaz depois).</figcaption>
        </figure>
        <figure>
            <div class="banner" style="font-size:14px">${icon("keyboard")}<span class="grow"><b>Atalhos:</b> <kbd>Espaço</kbd> tocar · <kbd>J</kbd> <kbd>L</kbd> 5 s · <kbd>[</kbd> <kbd>]</kbd> início e fim · <kbd>Ctrl Z</kbd> desfazer</span><span class="btn icon sm ghost" title="Fechar">${icon("close", "sm")}</span></div>
            <figcaption><b>Primeira vez no Studio.</b> Uma linha com os atalhos acima da prévia; depois de fechada, não volta.</figcaption>
        </figure>
    </div>`;
}

/* ---------- Dialogs ---------- */

function dialogs() {
    return `<div class="sheet">
        <div class="sheet-title"><h1>Studio · diálogos</h1><p class="muted">Só aparecem quando algo pode se perder.</p></div>
        <figure>
            <div class="dialog">
                <h3>Renderizar o corte de novo?</h3>
                <p>O arquivo atual do corte 1 é substituído pelo novo. Ele está com link público: quem abrir o link verá a versão nova depois que a Brasa terminar.</p>
                <div class="actions"><span class="btn">Cancelar</span><span class="btn primary">Renderizar</span></div>
            </div>
            <figcaption><b>Confirmação, só quando o corte está compartilhado.</b> Nos outros casos, Renderizar vai direto: o rascunho continua salvo e a edição pode ser refeita.</figcaption>
        </figure>
        <figure>
            <div class="dialog">
                <h3>Este corte mudou em outra aba</h3>
                <p>O corte 1 foi editado em outra aba às 14:41. Se você renderizar agora, as alterações daquela aba se perdem.</p>
                <div class="actions"><span class="btn">Ver a outra versão</span><span class="btn primary">Manter as minhas</span></div>
            </div>
            <figcaption><b>Mudou em outra aba.</b> O servidor compara a versão do rascunho antes de salvar ou renderizar.</figcaption>
        </figure>
        <figure>
            <div class="dialog">
                <h3>Sua sessão expirou</h3>
                <p>Suas 3 alterações ficaram guardadas neste navegador. Entre de novo para continuar de onde parou.</p>
                <div class="actions"><span class="btn primary">Entrar</span></div>
            </div>
            <figcaption><b>Sessão expirou</b> durante a edição: nada se perde.</figcaption>
        </figure>
    </div>`;
}

/* ---------- Phone ---------- */

function phone({ rendering = false, tab = "captions" } = {}) {
    const tabs = { captions: "Legendas", style: "Estilo", trim: "Trecho" };
    const nav = Object.entries(tabs)
        .map(([key, label]) => `<span class="${key === tab ? "is-on" : ""}">${label}</span>`)
        .join("");
    const bodies = {
        captions: () =>
            `<div class="panel ${rendering ? "is-locked" : ""}"><div class="cues">${LIVE_CUES.slice(
                7,
                12,
            )
                .map((cue) => cueRow(cue, { openWord: rendering ? null : SELECTED_WORD }))
                .join("")}</div></div>`,
        style: () => `<div class="panel"><div class="panel-body">${styleFields()}</div></div>`,
        trim: () => `<div class="panel" style="padding:12px;display:grid;gap:12px">
            <span class="track-label">${icon("scissors", "sm")}Trecho · 38,7 s (de 15 a 90 s)</span>
            ${["Início", "Fim"].map((label, i) => `<label class="field"><span>${label}</span><div style="display:grid;grid-template-columns:44px 1fr 44px;gap:8px"><span class="btn" style="height:44px">−0,5</span><span class="input" style="text-align:center">${i === 0 ? "1:56,3" : "2:35,0"}</span><span class="btn" style="height:44px">+0,5</span></div></label>`).join("")}
            <span class="btn" style="height:44px">Usar o ponto da prévia como início</span>
        </div>`,
    };
    const footer = rendering
        ? `<div style="display:grid;gap:8px"><span class="btn primary is-busy" aria-disabled="true" style="width:100%;height:44px">Renderizando… 42%</span></div>`
        : `<div style="display:grid;gap:8px"><span class="save-state">${icon("cloud", "sm")}Rascunho salvo · 3 alterações</span><span class="btn primary" style="width:100%;height:44px">${icon("render")}Renderizar corte</span></div>`;
    return `<div class="phone">
        <div style="display:flex;align-items:center;gap:10px"><div class="thumb" style="width:56px">${frame(140)}</div><b style="font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">ACELEREI O GOLF R 4X4 DE 600CV</b></div>
        <nav class="tabs"><span class="tab">Cortes <span class="count">5</span></span><span class="tab is-active">Studio</span></nav>
        <span class="select" style="width:100%"><span class="label">1/5</span><b>${CLIP_TITLE}</b>${icon("arrowDown")}</span>
        <div style="display:grid;justify-items:center">${preview(200, { note: rendering ? brasaNote() : null })}</div>
        <nav class="segmented ${rendering ? "is-locked" : ""}">${nav}</nav>
        ${bodies[tab]()}
        ${footer}
    </div>`;
}

document.body.innerHTML = BOARDS[BOARD]();
