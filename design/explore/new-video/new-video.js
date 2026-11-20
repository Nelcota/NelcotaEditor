/* New video dialog: current + three directions, over the Início page. Helpers from ../video-page/video.js. */

const CREW_ORDER = [
    [24, "Faísca"],
    [23, "Tinta"],
    [30, "Brilho"],
    [21, "Brasa"],
];

const LINK = "https://www.youtube.com/watch?v=Xk2pR9aL0qE";
const YT_TITLE = "CARIANI E BALESTRIN FORAM NUM RESTAURANTE ITALIANO RAIZ !!!";

function pageBehind() {
    const cards = [3, 5, 9, 1, 11, 2]
        .map(
            () =>
                `<div style="display:grid;gap:8px"><div class="thumb" style="border-radius:14px"></div><span style="height:12px;width:70%;border-radius:6px;background:var(--muted)"></span></div>`,
        )
        .join("");

    return `<header><h1 class="vtitle">Início</h1><p class="muted" style="margin-top:4px">Cada vídeo longo vira cortes verticais 9:16 com legenda.</p></header><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${cards}</div>`;
}

function overDesk(dialog) {
    return shell(pageBehind())
        .replace(
            /<\/div><\/div><\/div>$/,
            `</div><div class="backdrop">${dialog}</div></div></div>`,
        )
        .replace('<div class="frame">', '<div class="frame" style="position:relative">');
}

const CLOSE = `<span class="close">${icon("close", 20)}</span>`;

function segmented(selected = 5) {
    return `<div class="segmented">${[3, 5, 8, 10]
        .map((count) => `<span aria-pressed="${count === selected}">${count}</span>`)
        .join("")}<span>Outro</span></div>`;
}

function crewStrip() {
    return `<div class="crew-strip">${CREW_ORDER.map(([index, label]) => `${mascot(index, 22)}<span>${label}</span>`).join(`<span style="opacity:.4">›</span>`)}</div>`;
}

function preview() {
    return `<div class="preview"><div class="thumb" style="border-radius:10px"></div><div style="display:grid;gap:4px;min-width:0"><strong style="font-size:15px;line-height:1.3">${YT_TITLE}</strong><span class="muted" style="font-size:13px">${icon("link", 13)} YouTube · vídeo encontrado</span></div><span class="btn btn-icon" style="border:0;background:none">${icon("close", 16)}</span></div>`;
}

/* ---------- Current ---------- */

function currentDialog() {
    return `<div class="dialog" style="width:576px">${CLOSE}
        <div><h2>Novo vídeo</h2><p class="muted" style="margin-top:4px;font-size:14px">Cole um link do YouTube ou envie um arquivo. Os cortes ficam prontos em alguns minutos.</p></div>
        <div style="display:flex;gap:20px;border-bottom:1px solid var(--border);font-weight:600;font-size:14px"><span style="padding-bottom:10px;border-bottom:2px solid var(--foreground)">Link do YouTube</span><span class="muted" style="padding-bottom:10px">Arquivo do computador</span></div>
        <div style="display:grid;grid-template-columns:1fr 144px;gap:16px"><div class="field"><label>Link do vídeo</label><div class="input muted">https://www.youtube.com/watch?v=…</div><span class="muted" style="font-size:12px">O vídeo precisa ser público e ter até 3 horas.</span></div><div class="field"><label>Cortes</label><div class="input select">5 cortes ${icon("down", 16)}</div></div></div>
        <div style="display:flex;justify-content:flex-end"><span class="btn btn-primary btn-lg">Gerar cortes</span></div>
    </div>`;
}

/* ---------- A: one field ---------- */

function dialogA(state) {
    let source = `<div class="drop"><div class="link-input" data-focus="true">${icon("link", 18)}<span class="muted" style="flex:1">Cole o link do YouTube</span><span class="kbd">Ctrl V</span></div><div class="or">ou</div><span style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px">${icon("upload", 18)}Arraste um arquivo aqui ou <u>escolha no computador</u></span><span class="muted" style="font-size:12px">YouTube público ou arquivo MP4, MOV, MKV, WEBM · até 3 horas</span></div>`;

    if (state === "filled") {
        source = preview();
    }

    if (state === "drag") {
        source = `<div class="drop" data-state="drag" style="padding:56px 20px">${icon("upload", 28)}<strong>Solte para enviar</strong><span class="muted" style="font-size:13px">Um arquivo de vídeo por vez</span></div>`;
    }

    if (state === "invalid") {
        source = `<div class="drop"><div class="link-input" data-invalid="true">${icon("link", 18)}<span style="flex:1" class="truncate">youtube.com/playlist?list=PL8…</span></div><p style="color:var(--destructive);font-size:13px;justify-self:start">${icon("danger", 14)} Isso é uma playlist. Cole o link de um vídeo só.</p><div class="or">ou</div><span style="font-weight:600;font-size:14px">${icon("upload", 18)} Arraste um arquivo aqui</span></div>`;
    }

    return `<div class="dialog">${CLOSE}
        <h2>Novo vídeo</h2>
        ${source}
        <div style="display:grid;gap:8px"><span style="font-weight:600;font-size:14px">Quantos cortes?</span>${segmented()}</div>
        <div class="footer">${crewStrip()}<span class="btn btn-primary btn-lg" ${state === "filled" ? "" : 'style="opacity:.5"'}>Gerar cortes</span></div>
    </div>`;
}

/* ---------- B: two steps ---------- */

function dialogB(step) {
    if (step === 1) {
        return `<div class="dialog">${CLOSE}
            <div class="steps"><i data-on="true"></i><i></i><span>Passo 1 de 2</span></div>
            <div><h2>De onde vem o vídeo?</h2></div>
            <div class="source-choice">
                <div class="choice" aria-pressed="true"><span class="ico">${icon("link", 20)}</span><strong>Link do YouTube</strong><span class="muted" style="font-size:13px">Vídeo público, até 3 horas</span></div>
                <div class="choice"><span class="ico">${icon("upload", 20)}</span><strong>Arquivo do computador</strong><span class="muted" style="font-size:13px">MP4, MOV, MKV, WEBM</span></div>
            </div>
            <div class="link-input" data-focus="true">${icon("link", 18)}<span class="truncate" style="flex:1">${LINK}</span></div>
            <div class="footer" style="justify-content:flex-end"><span class="btn btn-primary btn-lg">Continuar ${icon("right", 16)}</span></div>
        </div>`;
    }

    return `<div class="dialog">${CLOSE}
        <div class="steps"><i data-on="true"></i><i data-on="true"></i><span>Passo 2 de 2</span></div>
        <h2>Confira antes de começar</h2>
        ${preview()}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="field"><label>Cortes</label>${segmented().replace("grid-template-columns:repeat(5, 1fr)", "")}</div>
            <div class="field"><label>Idioma</label><div class="input select" style="height:44px">Detectar automaticamente ${icon("down", 16)}</div></div>
        </div>
        <div class="speech" style="padding:12px 14px">${mascot(24, 30)}<span style="font-size:14px"><strong>Faísca</strong> <span class="muted">traz o vídeo e a equipe entrega os cortes em cerca de 6 minutos.</span></span></div>
        <div class="footer"><span class="btn" style="border:0;background:none">${icon("left", 16)} Voltar</span><span class="btn btn-primary btn-lg">Gerar cortes</span></div>
    </div>`;
}

/* ---------- C: command bar ---------- */

function dialogC() {
    return `<div class="command">
        <div class="command-input">${icon("link", 22)}<span style="flex:1" class="truncate">${LINK}</span><span class="kbd">Esc</span></div>
        <div class="command-body">
            ${preview()}
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="muted" style="font-size:14px">Cortes</span>${[3, 5, 8, 10].map((count) => `<span class="chip" aria-pressed="${count === 5}" style="height:36px">${count}</span>`).join("")}<span style="flex:1"></span><span class="muted" style="font-size:14px">Idioma</span><span class="chip" style="height:36px">Automático ${icon("down", 14)}</span></div>
            <div class="command-row" aria-selected="true">${mascot(24, 26)}<span style="flex:1"><strong>Gerar 5 cortes deste vídeo</strong> <span class="muted">· a equipe começa agora</span></span><span class="kbd">Enter</span></div>
            <div class="command-row">${icon("upload", 20)}<span style="flex:1">Enviar um arquivo do computador</span><span class="kbd">Ctrl U</span></div>
        </div>
        <div class="command-footer">${crewStrip()}<span style="flex:1"></span><span>Cole um link · arraste um arquivo</span></div>
    </div>`;
}

/* ---------- Phones ---------- */

function phoneSheet(inner) {
    return `<div class="phone-v" style="position:relative"><header class="phone-top">${mascot(BRAND, 30)}<strong style="flex:1">Início</strong>${icon("menu")}</header><div class="content">${pageBehind()}</div><div style="position:absolute;inset:0;background:rgb(0 0 0 / .7);display:grid;align-content:end"><div style="background:var(--popover);border-radius:20px 20px 0 0;border-top:1px solid var(--border);padding:20px 16px 28px;display:grid;gap:16px">${inner}</div></div></div>`;
}

function phoneA() {
    return phoneSheet(
        `<div style="width:40px;height:4px;border-radius:9px;background:var(--muted);justify-self:center"></div><h2 style="font-size:20px;font-weight:800">Novo vídeo</h2>${preview().replace("grid-template-columns: 136px", "")}<div style="display:grid;gap:8px"><span style="font-weight:600;font-size:14px">Quantos cortes?</span>${segmented()}</div><span class="btn btn-primary btn-lg" style="justify-content:center">Gerar cortes</span>`,
    );
}

function phoneB() {
    return phoneSheet(
        `<div class="steps"><i data-on="true"></i><i></i><span>Passo 1 de 2</span></div><h2 style="font-size:20px;font-weight:800">De onde vem o vídeo?</h2><div class="source-choice" style="grid-template-columns:1fr">${`<div class="choice" aria-pressed="true" style="grid-template-columns:40px 1fr;align-items:center"><span class="ico">${icon("link", 20)}</span><strong>Link do YouTube</strong></div><div class="choice" style="grid-template-columns:40px 1fr;align-items:center"><span class="ico">${icon("upload", 20)}</span><strong>Arquivo do celular</strong></div>`}</div><span class="btn btn-primary btn-lg" style="justify-content:center">Continuar</span>`,
    );
}

function phoneC() {
    return `<div class="phone-v" style="position:relative"><div style="position:absolute;inset:0;background:var(--popover);display:grid;align-content:start;grid-template-columns:minmax(0,1fr)"><div class="command-input" style="height:60px;font-size:16px">${icon("link", 20)}<span class="truncate" style="flex:1">${LINK}</span>${icon("close", 20)}</div><div class="command-body">${preview()}<div style="display:flex;gap:6px;flex-wrap:wrap">${[3, 5, 8, 10].map((count) => `<span class="chip" aria-pressed="${count === 5}">${count} cortes</span>`).join("")}</div><span class="btn btn-primary btn-lg" style="justify-content:center">Gerar 5 cortes</span><div class="command-row">${icon("upload", 20)}<span>Enviar um arquivo do celular</span></div></div></div></div>`;
}

const NEW_VIDEO_BOARDS = {
    current: () => overDesk(currentDialog()),
    a: () => overDesk(dialogA("filled")),
    "a-states": () =>
        `<div class="mini-states"><div><h4>Vazio</h4>${dialogA("empty")}</div><div><h4>Arrastando um arquivo</h4>${dialogA("drag")}</div><div><h4>Link que não serve</h4>${dialogA("invalid")}</div></div>`,
    b: () => overDesk(dialogB(1)),
    "b-step2": () => overDesk(dialogB(2)),
    c: () => overDesk(dialogC()),
    "phone-a": phoneA,
    "phone-b": phoneB,
    "phone-c": phoneC,
};

const renderNewVideo = NEW_VIDEO_BOARDS[document.body.dataset.board];
document.body.innerHTML = renderNewVideo === undefined ? "Board desconhecido" : renderNewVideo();
