// Builds the board's mocks from one set of sample data, so every direction shows the same account.

const CLIPS = [
    { title: "O erro que todo iniciante comete", score: 94, cap: ["Acordava ", "cedo", " e"] },
    { title: "A jogada que virou a partida", score: 91, cap: ["Ninguém ", "fala", " sobre"] },
    { title: "Revisão em 3 passos", score: 88, cap: ["Durante ", "anos", " eu"] },
    { title: "Por que isso funciona", score: 85, cap: ["Espere ", "30 dias", ""] },
    { title: "Câmbio DQ381 de perto", score: 84, cap: ["Olha ", "isso", " aqui"] },
];

const JOBS = [
    {
        title: "ACELEREI O GOLF 4X4 DE 600CV",
        crew: "Tinta escrevendo as legendas",
        percent: 62,
        thumb: "",
    },
    { title: "Dicas de produtividade", crew: "Faísca trazendo o vídeo", percent: 18, thumb: "c" },
];

function sidebar() {
    return `<aside class="side">
        <div class="brand"><span class="ghost"></span>nelcota</div>
        <div class="new-card"><i></i><div><small>NOVO VÍDEO</small>Link ou arquivo</div></div>
        <nav class="nav"><span class="on">Início</span><span>Vídeos</span><span>Cortes</span><span>Painel</span><span>Conta</span></nav>
        <div class="side-foot">Armazenamento<br /><b>1,1 GB</b> de 20 GB</div>
    </aside>`;
}

function app(page) {
    return `<div class="app">${sidebar()}<section class="panel"><div class="crumb"><b>Início</b></div><div class="page">${page}</div></section></div>`;
}

function phone(body) {
    return `<div class="phone"><div class="top"><span class="ghost"></span><b style="color:var(--fg)">Início</b></div>
        <div class="body">${body}</div>
        <nav class="tabbar"><span class="on">Início</span><span>Vídeos</span><span>Cortes</span><span>Painel</span><span>Conta</span></nav></div>`;
}

function greeting(size) {
    return `<div><h2 class="greet" style="font-size:${size}px"><span class="ghost"></span>Boa noite, Conta.</h2></div>`;
}

function composer() {
    return `<div class="composer"><span class="ph">Cole um link do YouTube para cortar...</span>
        <div class="bar"><span class="pill">+ Arquivo</span><span class="pill">5 cortes</span><span class="pill">Livre</span><span class="send"></span></div></div>`;
}

function inlineComposer() {
    return `<div class="composer inline"><span class="ph">Cole um link do YouTube ou envie um arquivo...</span><span class="btn">Gerar cortes</span></div>`;
}

function job(item, withAction) {
    const action = withAction ? `<span class="btn soft sm">Ver vídeo</span>` : "<span></span>";

    return `<div class="job"><span class="thumb ${item.thumb}"></span>
        <div><b>${item.title}</b><span class="crew">${item.crew} · ${item.percent}%</span><div class="progress"><i style="width:${item.percent}%"></i></div></div>${action}</div>`;
}

function clip(item, withButton) {
    const button = withButton ? `<span class="btn sm">Baixar</span>` : "";

    return `<div class="clip"><div class="frame"><span class="score">Nota ${item.score}</span><span class="cap">${item.cap[0]}<em>${item.cap[1]}</em>${item.cap[2]}</span></div>
        <div class="meta"><b>${item.title}</b>${button}</div></div>`;
}

function sectionHead(title, link) {
    return `<div class="section-head"><h3>${title}</h3><a>${link}</a></div>`;
}

const PAGES = {
    current: () =>
        `<div class="hero" style="padding-top:150px">${greeting(28)}<p class="sub">Sou o Nel: transformo seus vídeos longos em cortes verticais com legenda, prontos para postar.</p>${composer()}
        <div style="display:flex;gap:8px"><span class="pill">Enviar arquivo</span><span class="pill">Ver meus cortes</span><span class="pill">Analisar meus resultados</span></div></div>`,
    a: () =>
        `${greeting(26)}${composer()}
        <div style="display:grid;gap:10px">${sectionHead("Na fila", "Ver todos os vídeos")}${JOBS.map((item) => job(item, true)).join("")}</div>
        <div style="display:grid;gap:10px">${sectionHead("Prontos para postar", "Ver todos os cortes")}<div class="clips small">${CLIPS.map((item) => clip(item, false)).join("")}</div></div>`,
    b: () =>
        `${greeting(24)}${inlineComposer()}
        <div class="split"><div style="display:grid;gap:10px">${sectionHead("Cortes novos", "Ver todos")}<div class="clips" style="grid-template-columns:repeat(4,1fr)">${CLIPS.slice(
            0,
            4,
        )
            .map((item) => clip(item, true))
            .join("")}</div></div>
        <div style="display:grid;gap:12px"><div class="aside-card"><b>Na fila</b>${JOBS.map((item) => `<div class="mini-job"><b>${item.title}</b><span class="crew">${item.crew}</span><div class="progress"><i style="width:${item.percent}%"></i></div></div>`).join("")}</div>
        <div class="aside-card"><b>Esta semana</b><div class="stats" style="grid-template-columns:1fr 1fr">${["12 cortes", "3 vídeos", "Nota 87", "28 min"].map((text) => `<div class="stat"><b style="font-size:17px">${text}</b></div>`).join("")}</div></div></div></div>`,
    c: () =>
        `<div class="hero">${greeting(28)}<p class="sub">Cole um link e eu faço o resto. Enquanto isso, o que pede sua atenção:</p>${composer()}</div>
        <div class="next">
            <div class="next-item is-ok"><span class="ico">4</span><div><b>4 cortes novos de "Teste de velocidade"</b><small>O melhor tirou nota 94</small></div><span class="btn sm">Ver cortes</span></div>
            <div class="next-item"><span class="ico">62%</span><div><b>ACELEREI O GOLF 4X4 DE 600CV</b><small>Tinta escrevendo as legendas · uns 3 minutos</small><div class="progress"><i style="width:62%"></i></div></div><span class="btn soft sm">Ver vídeo</span></div>
            <div class="next-item is-bad"><span class="ico">!</span><div><b>"Dicas de produtividade" parou</b><small>O link ficou privado no YouTube</small></div><span class="btn soft sm">Tentar de novo</span></div>
        </div>`,
};

const PHONES = {
    current: () =>
        `<div class="hero" style="padding-top:120px">${greeting(21)}<p class="sub">Sou o Nel: transformo seus vídeos longos em cortes verticais.</p>${composer()}</div>`,
    a: () =>
        `${greeting(21)}${composer()}<div style="display:grid;gap:8px">${sectionHead("Na fila", "Ver")}${job(JOBS[0], false)}</div>
        <div style="display:grid;gap:8px">${sectionHead("Prontos para postar", "Ver")}<div class="clips small">${CLIPS.map((item) => clip(item, false)).join("")}</div></div>`,
    b: () =>
        `${greeting(21)}${composer()}<div style="display:grid;gap:8px">${sectionHead("Cortes novos", "Ver todos")}<div class="clips">${CLIPS.map((item) => clip(item, true)).join("")}</div></div>`,
    c: () =>
        `<div class="hero">${greeting(21)}${composer()}</div><div class="next">
            <div class="next-item is-ok"><span class="ico">4</span><div><b>4 cortes novos</b><small>Nota até 94</small></div><span class="btn sm">Ver</span></div>
            <div class="next-item"><span class="ico">62%</span><div><b>Golf 4x4 na fila</b><small>Uns 3 minutos</small></div><span></span></div>
            <div class="next-item is-bad"><span class="ico">!</span><div><b>Um vídeo parou</b><small>Link privado</small></div><span class="btn soft sm">Ver</span></div></div>`,
};

const CRITIQUE = `<div class="critique"><b>O que falta hoje</b><ul>
    <li>Não diz se os vídeos já ficaram prontos: a pessoa precisa ir até Vídeos ou Cortes.</li>
    <li>Os cortes, que são o resultado, nunca aparecem aqui.</li>
    <li>Uma falha passa despercebida até alguém abrir a lista.</li>
    <li>Os três atalhos repetem a sidebar.</li>
</ul></div>`;

document.querySelectorAll("[data-render]").forEach((row) => {
    const key = row.dataset.render;
    const side =
        key === "current"
            ? `<div style="display:grid;gap:20px"><div><div class="caption">Celular</div>${phone(PHONES[key]())}</div>${CRITIQUE}</div>`
            : `<div><div class="caption">Celular</div>${phone(PHONES[key]())}</div>`;

    row.innerHTML = `<div><div class="caption">Desktop</div>${app(PAGES[key]())}</div>${side}`;
});
