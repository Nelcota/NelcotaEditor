// Shared bits for the Studio mocks: Solar-style icons, the real captions and the desktop window.
const P = (d) =>
    `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
window.ICONS = {
    undo: P('<path d="M4 7h11a5 5 0 0 1 0 10H8"/><path d="M7 4 4 7l3 3"/>'),
    redo: P('<path d="M20 7H9a5 5 0 0 0 0 10h7"/><path d="m17 4 3 3-3 3"/>'),
    cloud: P(
        '<path d="M7 18a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5H7Z"/><path d="m9.5 13.5 2 2 3.5-3.5"/>',
    ),
    render: P(
        '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18M8 5l-2 4M14 5l-2 4"/><path d="m10.5 12.5 4 2-4 2z"/>',
    ),
    play: '<path fill="currentColor" d="M7 4.8v14.4a1 1 0 0 0 1.5.86l12-7.2a1 1 0 0 0 0-1.72l-12-7.2A1 1 0 0 0 7 4.8Z"/>',
    pause: '<g fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></g>',
    back5: P('<path d="M12 5a7 7 0 1 1-7 7"/><path d="M5 5v4h4"/>'),
    fwd5: P('<path d="M12 5a7 7 0 1 0 7 7"/><path d="M19 5v4h-4"/>'),
    subs: P(
        '<rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M6.5 14.5h4M13.5 14.5h4M6.5 11h2M11.5 11h6"/>',
    ),
    palette: P(
        '<path d="M12 21a9 9 0 1 1 9-9c0 2.5-2 3.5-4 3.5h-1.5a1.5 1.5 0 0 0-1 2.6c.6.6.3 2.9-2.5 2.9Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="15.5" cy="8.5" r="1"/>',
    ),
    text: P('<path d="M5 7V5h14v2M12 5v14M9 19h6"/>'),
    size: P('<path d="M3 8V6h10v2M8 6v12M6 18h4M14 12v-1h7v1M17.5 11v7M16 18h3"/>'),
    position: P('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 16h8"/>'),
    crop: P('<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M2 6h14a2 2 0 0 1 2 2v14"/>'),
    scissors: P(
        '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 16 18 3M16 16 6 3"/>',
    ),
    chevron: P('<path d="m6 9 6 6 6-6"/>'),
    left: P('<path d="m15 5-7 7 7 7"/>'),
    right: P('<path d="m9 5 7 7-7 7"/>'),
    search: P('<circle cx="11" cy="11" r="8"/><path d="m17 17 4 4"/>'),
    video: P('<rect x="2.5" y="5" width="14" height="14" rx="3"/><path d="m16.5 10 5-3v10l-5-3"/>'),
    chart: P('<path d="M4 20V10M10 20V4M16 20v-7M2 20h20"/>'),
    shield: P('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/>'),
    moon: P('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'),
    sidebar: P('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    dots: '<g fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></g>',
    check: P('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    target: P('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'),
    split: P('<path d="M12 3v18M7 8l-3 4 3 4M17 8l3 4-3 4"/>'),
    merge: P('<path d="M4 12h6M14 12h6M7 9l3 3-3 3M17 9l-3 3 3 3"/>'),
    trash: P('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    edit: P('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13 7 4 4"/>'),
    sparkle: P(
        '<path d="M12 3c.6 4.2 2.4 6 6.5 6.5-4.1.6-5.9 2.4-6.5 6.5-.6-4.1-2.4-5.9-6.5-6.5C9.6 9 11.4 7.2 12 3Z"/>',
    ),
    film: P(
        '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4"/>',
    ),
    sliders: P(
        '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    ),
    x: P('<path d="M6 6l12 12M18 6 6 18"/>'),
    keyboard: P(
        '<rect x="2.5" y="6" width="19" height="12" rx="3"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>',
    ),
};
window.icon = (name, size) =>
    `<svg class="i" viewBox="0 0 24 24" style="${size ? `width:${size}px;height:${size}px` : ""}">${window.ICONS[name]}</svg>`;

// The real captions of clip 1 ("Perdidos em São Paulo com o ID4"), seconds from the clip start.
window.CUES = [
    [0.0, 1.0, "Meu Deus,"],
    [1.0, 1.9, "que loucura nós"],
    [1.9, 2.5, "andando perdido em"],
    [2.5, 3.1, "São Paulo."],
    [3.1, 3.6, "É esse o"],
    [3.6, 4.1, "lugar aqui,"],
    [4.1, 4.4, "ó."],
    [4.4, 5.0, "Põe aí,"],
    [5.0, 5.5, "caminho rótimo."],
    [5.5, 6.2, "Rua ZV do"],
    [6.2, 7.0, "Soares."],
    [7.0, 7.4, "Que que é"],
    [7.4, 7.8, "que é rótimo?"],
    [7.8, 7.95, "Não,"],
    [7.95, 8.3, "isso aqui é"],
    [8.3, 8.7, "um print."],
    [8.7, 9.3, "Meu Deus,"],
    [9.3, 10.0, "meu Deus,"],
    [10.0, 10.5, "pera aí."],
    [10.5, 11.2, "Isso aqui é"],
    [11.2, 12.0, "um print."],
    [12.0, 12.5, "Pera aí,"],
    [12.5, 13.2, "pera aí."],
    [13.2, 14.0, "Rua."],
    [14.0, 15.0, "Rua."],
    [15.0, 16.0, "A ZV do"],
    [16.0, 17.0, "Soares."],
    [17.0, 18.5, "Soares."],
    [19.0, 19.6, "Ah,"],
    [19.6, 20.8, "1.500."],
    [21.0, 21.6, "1.500."],
];
window.PLAYING = 3;
window.clock = (s) => `0:${String(Math.floor(s)).padStart(2, "0")}`;
window.strip = (count, from) =>
    `<div class="strip">${Array.from({ length: count }, (_, i) => `<i style="background-image:url(img/strip${(from || 0) + i}.jpg)"></i>`).join("")}</div>`;

window.renderShell = () => {
    const page = document.getElementById("page");
    const I = window.icon;
    const win = document.createElement("div");
    win.className = "win";
    win.innerHTML = `
      <aside class="side">
        <div class="brand"><span class="ghost"></span>Nelcota<span class="sp"></span><span style="color:var(--muted)">${I("sidebar")}</span></div>
        <div class="search">${I("search", 16)}Buscar</div>
        <div class="nav">${I("video")}Vídeos<span class="c">3</span></div>
        <div class="nav">${I("scissors")}Cortes<span class="c">8</span></div>
        <div class="nav">${I("chart")}Painel</div>
        <div class="nav">${I("shield")}Admin</div>
        <h6>Prontos</h6>
        <div class="vid on"><span class="dot" style="background:#ef6a6a"></span>PRIMEIRO ROLE DE VW ID4</div>
        <div class="vid"><span class="dot" style="background:#e5484d"></span>ESSA HISTÓRIA DA URSO…</div>
        <div class="vid"><span class="dot" style="background:#f5c542"></span>CARIANI E BALESTRIN FO…</div>
        <div class="me"><img src="img/avatar.png" alt="" />Haniel</div>
      </aside>
      <header class="top">
        <div class="tab on"><span class="dot" style="width:12px;height:12px;border-radius:4px;background:#ef6a6a"></span>PRIMEIRO ROLE DE VW…</div>
        <div class="tab"><span class="dot" style="width:12px;height:12px;border-radius:4px;background:#e5484d"></span>ESSA HISTÓRIA DA…</div>
        <span style="align-self:center;color:var(--muted);padding:0 8px">${I("plus", 16)}</span>
        <span class="sp"></span>
        <span class="tools">${I("moon")}${I("sidebar")}</span>
      </header>
      <main class="panel">
        <div class="vhead">
          <h1>PRIMEIRO ROLE DE VW ID4</h1>
          <span class="pill">${I("check", 14)}Pronto</span>
          <div class="vtabs"><span>${I("scissors", 15)}Cortes <b>3</b></span><span>${I("video", 15)}Original</span><span class="on">${I("edit", 15)}Studio</span></div>
          <span class="sp"></span>
          <button class="btn icon outline" style="width:34px;height:34px">${I("dots")}</button>
        </div>
      </main>`;
    win.querySelector(".panel").append(...page.childNodes);
    page.replaceWith(win);
};
