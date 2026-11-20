/* Account page exploration: the same person, usage and preferences drawn four ways. */

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
const CREW = { downloading: 24, transcribing: 23, selecting: 30, rendering: 21 };

const USER = {
    name: "Maria Fernanda de Albuquerque Santos",
    email: "maria.fernanda.albuquerque@exemplo.com.br",
};
const USAGE = {
    videos: 3,
    ready: 3,
    minutes: "28 min",
    clips: 12,
    clipsMonth: 12,
    storage: "1,1 GB",
    storageParts: [
        ["Originais", 62, "var(--primary)"],
        ["Cortes", 30, "oklch(0.76 0.16 155)"],
        ["Áudio", 8, "var(--muted-foreground)"],
    ],
};

function sidebar() {
    return `<aside class="side">
        <div class="side-brand">${mascot(BRAND, 34)}<span class="side-brand-name">Nelcota</span><span class="icon-button">${icon("sidebar")}</span></div>
        <span class="button button-primary" style="margin-bottom:8px">${icon("add", 18)}Novo vídeo</span>
        <div class="nav">${icon("home")}Início<span class="nav-count">3</span></div>
        <div class="nav">${icon("clips")}Cortes<span class="nav-count">12</span></div>
        <div class="nav" aria-current="page">${icon("account")}Conta</div>
        <div class="side-heading">Recentes</div>
        <div class="recent">${mascot(3, 30)}<div class="recent-text"><span class="recent-title truncate">ACELEREI O GOLF R 4X4 DE 600CV</span><span class="recent-note muted">5 cortes prontos</span></div></div>
        <div class="recent">${mascot(5, 30)}<div class="recent-text"><span class="recent-title truncate">Teste de velocidade 10 min</span><span class="recent-note muted">4 cortes prontos</span></div></div>
        <span class="side-spacer"></span>
        <div class="me"><span class="avatar">${mascot(AVATAR, 28)}</span><div class="me-text"><strong class="truncate">${USER.name}</strong><span class="muted truncate" style="font-size:13px">${USER.email}</span></div>${icon("dots", 16)}</div>
    </aside>`;
}

function shell(content) {
    return `<div class="desk-v"><div class="frame">${sidebar()}<div class="content" style="max-width:1000px;width:100%;justify-self:center">${content}</div></div></div>`;
}

function pageTitle(description) {
    return `<header><h1 class="vtitle">Conta</h1><p class="muted" style="margin-top:4px">${description}</p></header>`;
}

function bigAvatar() {
    return `<span class="big-avatar">${mascot(AVATAR, 64)}<span class="avatar-edit" title="Trocar foto">${icon("gallery", 16)}</span></span>`;
}

const SAVED = `<span class="saved">${icon("check", 15)}Salvo automaticamente</span>`;

function profileFields() {
    return `<div style="display:grid;gap:14px">
        <div class="field"><label>Nome</label><div class="input">${USER.name}</div></div>
        <div class="field"><label>E-mail</label><div class="input is-readonly">${USER.email}</div><span class="muted" style="font-size:13px">É o e-mail de entrada; não dá para trocar por aqui.</span></div>
        <div class="field"><label>Senha</label><div style="display:flex;gap:8px"><div class="input is-readonly" style="flex:1">••••••••••</div><span class="btn">${icon("lock", 16)}Trocar senha</span></div></div>
    </div>`;
}

function preferenceFields() {
    return `<div style="display:grid;gap:14px">
        <div class="field"><label>Cortes por vídeo</label><div class="input select">5 cortes ${icon("down", 16)}</div><span class="muted" style="font-size:13px">Já vem escolhido quando você adiciona um vídeo.</span></div>
        <div class="field"><label>Idioma da transcrição</label><div class="input select">Detectar automaticamente ${icon("down", 16)}</div><span class="muted" style="font-size:13px">Escolher o idioma deixa a legenda mais precisa.</span></div>
    </div>`;
}

/* ---------- Current ---------- */

function currentBoard() {
    const tiles = [
        ["Vídeos", "3", "3 prontos"],
        ["Tempo processado", "28 min", "somando os vídeos prontos"],
        ["Cortes gerados", "12", "12 este mês"],
        ["Espaço em disco", "1,1 GB", "originais, áudio e cortes"],
    ]
        .map(
            ([label, value, detail]) =>
                `<div class="card-a" style="padding:16px;display:grid;gap:4px"><span class="muted" style="font-size:14px">${label}</span><strong style="font-size:26px">${value}</strong><span class="muted" style="font-size:14px">${detail}</span></div>`,
        )
        .join("");

    return shell(`${pageTitle("Seu perfil, o quanto você já usou e suas preferências.")}
        <div class="card-a" style="padding:18px;display:flex;gap:14px;align-items:center"><span class="avatar" style="width:56px;height:56px">${mascot(AVATAR, 44)}</span><div style="flex:1;min-width:0"><strong class="truncate" style="display:block">${USER.name}</strong><span class="muted truncate" style="display:block">${USER.email}</span></div><span class="btn">${icon("gallery", 16)}Trocar foto</span><span class="btn" style="border:0;background:none">${icon("logout", 16)}Sair</span></div>
        <div><h2 class="section-title">Uso</h2></div><div class="crew-grid">${tiles}</div>
        <div><h2 class="section-title">Preferências</h2></div><div class="card-a" style="padding:18px">${preferenceFields()}</div>`);
}

/* ---------- A: tabs ---------- */

function boardA() {
    const tabs = `<nav class="tabs-a"><span class="tab-a" aria-selected="true">${icon("user", 18)}Perfil</span><span class="tab-a">${icon("chart", 18)}Uso</span><span class="tab-a">${icon("tuning", 18)}Preferências</span></nav>`;
    const profile = `<div style="display:grid;grid-template-columns:200px minmax(0,1fr);gap:32px">
        <div style="display:grid;gap:12px;justify-items:start;align-content:start">${bigAvatar()}<span class="btn">${icon("gallery", 16)}Trocar foto</span><span class="muted" style="font-size:13px">PNG, JPG ou WebP, até 2 MB. Ou escolha um mascote.</span></div>
        <div style="display:grid;gap:20px">${profileFields()}<div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--border)">${SAVED}<span class="btn" style="color:var(--destructive);border-color:transparent;background:none">${icon("logout", 16)}Sair da conta</span></div></div>
    </div>`;

    return shell(
        `${pageTitle("Perfil, uso e preferências, um de cada vez.")}${tabs}<div class="card-a" style="padding:24px">${profile}</div>`,
    );
}

/* ---------- B: crew panel ---------- */

function crewStat(index, name, value, line) {
    return `<div class="card-a crew-stat">${mascot(index, 40)}<span class="value">${value}</span><span style="font-size:14px"><strong>${name}</strong> <span class="muted">${line}</span></span></div>`;
}

function boardB() {
    const header = `<div class="card-a" style="padding:20px;display:flex;gap:18px;align-items:center">${bigAvatar()}
        <div style="flex:1;min-width:0;display:grid;gap:2px"><strong class="truncate" style="font-size:20px">${USER.name}</strong><span class="muted truncate">${USER.email}</span></div>
        <span class="btn">${icon("pen", 16)}Editar perfil</span><span class="btn">${icon("lock", 16)}Trocar senha</span><span class="btn btn-icon" title="Sair">${icon("logout", 16)}</span></div>`;
    const crew = `<section style="display:grid;gap:12px"><div><h2 class="section-title">O que a equipe já fez por você</h2><p class="muted" style="font-size:14px">Desde que você criou a conta.</p></div>
        <div class="crew-grid">${crewStat(CREW.downloading, "Faísca", "1", "vídeo baixado do YouTube")}${crewStat(CREW.transcribing, "Tinta", "28 min", "de áudio transcrito")}${crewStat(CREW.selecting, "Brilho", "12", "momentos escolhidos")}${crewStat(CREW.rendering, "Brasa", "12", "cortes com legenda · 12 este mês")}</div>
        <div class="card-a" style="padding:16px;display:grid;gap:10px"><div style="display:flex;justify-content:space-between"><strong>Espaço em disco</strong><span><strong>1,1 GB</strong> <span class="muted">em 3 vídeos</span></span></div>
            <div class="storage-bar">${USAGE.storageParts.map(([, percent, color]) => `<span style="width:${percent}%;background:${color}"></span>`).join("")}</div>
            <div style="display:flex;gap:16px;font-size:13px" class="muted">${USAGE.storageParts.map(([label, percent, color]) => `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:${color}"></span>${label} ${percent}%</span>`).join("")}</div></div></section>`;
    const prefs = `<section style="display:grid;gap:12px"><div style="display:flex;justify-content:space-between;align-items:end"><h2 class="section-title">Preferências</h2>${SAVED}</div>
        <div class="card-a" style="padding:18px;display:grid;grid-template-columns:1fr 1fr;gap:20px">${preferenceFields().replace('<div style="display:grid;gap:14px">', '<div style="display:contents">')}</div></section>`;

    return shell(
        `${pageTitle("Seu perfil, o trabalho da equipe e suas preferências.")}${header}${crew}${prefs}`,
    );
}

/* ---------- C: grouped settings list ---------- */

function row(iconName, label, value, options = {}) {
    const trailing = options.trailing ?? icon("right", 18);
    const tone = options.danger === true ? 'style="color:var(--destructive)"' : "";

    return `<div class="set-row"><span class="set-icon" ${tone}>${icon(iconName, 18)}</span><span ${tone} style="font-weight:600">${label}</span><span class="set-value">${value}${trailing}</span></div>`;
}

function boardC() {
    const profile = `<div class="group"><span class="group-label">Perfil</span><div class="rows">
        <div class="set-row" style="grid-template-columns:64px minmax(0,1fr) auto"><span class="avatar" style="width:56px;height:56px">${mascot(AVATAR, 44)}</span><div style="min-width:0"><strong class="truncate" style="display:block">${USER.name}</strong><span class="muted truncate" style="display:block;font-size:14px">${USER.email}</span></div><span class="set-value">Trocar foto ${icon("right", 18)}</span></div>
        ${row("user", "Nome", `<span class="truncate" style="max-width:260px">${USER.name}</span>`)}
        ${row("letter", "E-mail", `<span class="truncate" style="max-width:260px">${USER.email}</span>`, { trailing: "" })}
        ${row("lock", "Senha", "Trocar")}
    </div></div>`;
    const usage = `<div class="group"><span class="group-label">Uso</span><div class="rows">
        ${row("video", "Vídeos", "3 · 3 prontos", { trailing: "" })}
        ${row("clock", "Tempo processado", "28 min", { trailing: "" })}
        ${row("scissors", "Cortes gerados", "12 · 12 este mês", { trailing: "" })}
        ${row("disk", "Espaço em disco", "1,1 GB", { trailing: "" })}
    </div></div>`;
    const prefs = `<div class="group"><div style="display:flex;justify-content:space-between;align-items:center"><span class="group-label">Preferências</span>${SAVED}</div><div class="rows">
        ${row("scissors", "Cortes por vídeo", "5 cortes", { trailing: icon("down", 18) })}
        ${row("translate", "Idioma da transcrição", "Detectar automaticamente", { trailing: icon("down", 18) })}
    </div></div>`;
    const exit = `<div class="rows">${row("logout", "Sair da conta", "", { danger: true, trailing: "" })}</div>`;

    return shell(
        `${pageTitle("Tudo da sua conta numa lista; as mudanças salvam sozinhas.")}<div style="display:grid;gap:22px;max-width:720px">${profile}${usage}${prefs}${exit}</div>`,
    );
}

/* ---------- Phones ---------- */

function phoneTop() {
    return `<header class="phone-top">${mascot(BRAND, 30)}<strong style="flex:1">Conta</strong>${icon("menu")}</header>`;
}

function phoneA() {
    return `<div class="phone-v">${phoneTop()}<div class="content"><nav class="tabs-a" style="overflow:hidden"><span class="tab-a" aria-selected="true">Perfil</span><span class="tab-a">Uso</span><span class="tab-a">Preferências</span></nav><div style="display:grid;justify-items:center;gap:10px">${bigAvatar()}<span class="btn">${icon("gallery", 16)}Trocar foto</span></div>${profileFields()}${SAVED}</div></div>`;
}

function phoneB() {
    return `<div class="phone-v">${phoneTop()}<div class="content"><div class="card-a" style="padding:16px;display:grid;justify-items:center;gap:8px;text-align:center">${bigAvatar()}<strong style="font-size:17px">${USER.name}</strong><span class="muted" style="font-size:13px;word-break:break-all">${USER.email}</span><div style="display:flex;gap:8px"><span class="btn">${icon("pen", 16)}Editar</span><span class="btn">${icon("lock", 16)}Senha</span></div></div><div class="crew-grid" style="grid-template-columns:1fr 1fr">${crewStat(CREW.transcribing, "Tinta", "28 min", "transcritos")}${crewStat(CREW.rendering, "Brasa", "12", "cortes")}</div></div></div>`;
}

function phoneC() {
    return `<div class="phone-v">${phoneTop()}<div class="content"><div class="group"><span class="group-label">Perfil</span><div class="rows">${row("user", "Nome", "")}${row("letter", "E-mail", "", { trailing: "" })}${row("lock", "Senha", "Trocar")}</div></div><div class="group"><span class="group-label">Uso</span><div class="rows">${row("clock", "Tempo", "28 min", { trailing: "" })}${row("scissors", "Cortes", "12", { trailing: "" })}${row("disk", "Disco", "1,1 GB", { trailing: "" })}</div></div><div class="group"><span class="group-label">Preferências</span><div class="rows">${row("scissors", "Cortes por vídeo", "5", { trailing: icon("down", 18) })}</div></div></div></div>`;
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
