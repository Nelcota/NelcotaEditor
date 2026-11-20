/* Design boards for the Nelcota console. Each board's <body data-board="..."> picks what to render. */

const ICONS = {
    scissors:
        '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
    film: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    slash: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    clapper:
        '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3ZM6.2 5.3l3.1 3.9M12.4 3.4l3.1 4M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    wifiOff:
        '<path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M5 12.86a10 10 0 0 1 5.17-2.69M19 12.86a10 10 0 0 0-2-1.52M2 8.82a15 15 0 0 1 4.18-2.64M22 8.82a15 15 0 0 0-11.29-3.76M2 2l20 20"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    play: '<path d="M6 3l14 9-14 9z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    searchX: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8.5 8.5l5 5M13.5 8.5l-5 5"/>',
};

function icon(name, extraClass = "") {
    return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

/** 32 mascots: 0–15 from the "shapes" sprite, 16–31 from the "objects" sprite (4x4 each). */
function mascot(index, sizeClass = "") {
    const set = index < 16 ? "shapes" : "objects";
    const tile = index % 16;
    const column = tile % 4;
    const row = Math.floor(tile / 4);
    const position = `${(column * 100) / 3}% ${(row * 100) / 3}%`;

    return `<span class="mascot ${sizeClass}" data-set="${set}" style="background-position:${position}" aria-hidden="true"></span>`;
}

const STATUS = {
    queued: { label: "Na fila", tone: "neutral", icon: "clock" },
    downloading: { label: "Baixando do YouTube", tone: "working", icon: "loader" },
    transcribing: { label: "Transcrevendo o áudio", tone: "working", icon: "loader" },
    selecting: { label: "Escolhendo momentos", tone: "working", icon: "loader" },
    rendering: { label: "Renderizando cortes", tone: "working", icon: "loader" },
    done: { label: "Pronto", tone: "success", icon: "check" },
    failed: { label: "Falhou", tone: "danger", icon: "alert" },
    cancelled: { label: "Cancelado", tone: "neutral", icon: "slash" },
};

const VIDEOS = [
    {
        id: "v01",
        mascot: 6,
        title: "Flow Podcast #412 — Carlos Bertolazzi fala sobre negócios, cozinha e televisão",
        source: "youtube",
        duration: "2:41:07",
        status: "rendering",
        progress: 72,
        clips: [0, 10],
        created: "19/11/2026",
    },
    {
        id: "v02",
        mascot: 21,
        title: "Aula aberta: como montar um funil de vendas do zero",
        source: "upload",
        duration: "58:12",
        status: "transcribing",
        progress: 34,
        clips: [0, 5],
        created: "19/11/2026",
    },
    {
        id: "v03",
        mascot: 1,
        title: "Live de sexta — perguntas e respostas da comunidade",
        source: "youtube",
        duration: "1:12:44",
        status: "done",
        progress: 100,
        clips: [8, 8],
        created: "18/11/2026",
    },
    {
        id: "v04",
        mascot: 27,
        title: "Entrevista com Maria Fernanda de Albuquerque Santos sobre a reforma tributária, o impacto nas pequenas empresas e o que muda em 2027",
        source: "youtube",
        duration: "1:47:30",
        status: "done",
        progress: 100,
        clips: [7, 10],
        created: "18/11/2026",
        note: "3 cortes falharam ao renderizar",
    },
    {
        id: "v05",
        mascot: 10,
        title: "Treino de pernas comentado",
        source: "upload",
        duration: null,
        status: "queued",
        progress: 0,
        clips: [0, 5],
        created: "18/11/2026",
    },
    {
        id: "v06",
        mascot: 18,
        title: "Podcast Café com Código — ep. 88",
        source: "youtube",
        duration: "1:31:02",
        status: "failed",
        progress: 40,
        clips: [0, 6],
        created: "17/11/2026",
        note: "O YouTube bloqueou o download deste vídeo.",
    },
    {
        id: "v07",
        mascot: 3,
        title: "Palestra TEDx — O tempo que a gente perde",
        source: "youtube",
        duration: "18:45",
        status: "done",
        progress: 100,
        clips: [4, 4],
        created: "17/11/2026",
    },
    {
        id: "v08",
        mascot: 30,
        title: "Review do iPhone 18 depois de um mês",
        source: "upload",
        duration: "24:10",
        status: "cancelled",
        progress: 55,
        clips: [0, 5],
        created: "16/11/2026",
    },
    {
        id: "v09",
        mascot: 13,
        title: "Mesa redonda: futebol brasileiro em 2026",
        source: "youtube",
        duration: "2:05:19",
        status: "done",
        progress: 100,
        clips: [10, 10],
        created: "15/11/2026",
    },
    {
        id: "v10",
        mascot: 24,
        title: "Receita de pão de fermentação natural",
        source: "upload",
        duration: "32:48",
        status: "done",
        progress: 100,
        clips: [5, 5],
        created: "14/11/2026",
    },
    {
        id: "v11",
        mascot: 8,
        title: "Culto de domingo — 10/11",
        source: "youtube",
        duration: "1:58:00",
        status: "selecting",
        progress: 61,
        clips: [0, 8],
        created: "14/11/2026",
    },
    {
        id: "v12",
        mascot: 16,
        title: "Vlog: um dia em Lisboa",
        source: "upload",
        duration: "14:22",
        status: "done",
        progress: 100,
        clips: [3, 3],
        created: "12/11/2026",
    },
    {
        id: "v13",
        mascot: 11,
        title: "Webinar de lançamento — turma de novembro",
        source: "youtube",
        duration: "1:20:16",
        status: "done",
        progress: 100,
        clips: [6, 6],
        created: "11/11/2026",
    },
    {
        id: "v14",
        mascot: 29,
        title: "Stand-up: especial completo",
        source: "upload",
        duration: "52:40",
        status: "done",
        progress: 100,
        clips: [9, 9],
        created: "10/11/2026",
    },
];

const CLIPS = [
    {
        title: "“A cozinha me ensinou a ter paciência com gente”",
        caption: ["A cozinha me", "ensinou", "paciência"],
        time: "12:04 – 12:52",
        seconds: 48,
        score: 94,
    },
    {
        title: "Por que ele recusou o primeiro programa de TV",
        caption: ["Eu disse", "não", "na hora"],
        time: "31:10 – 31:58",
        seconds: 48,
        score: 91,
    },
    {
        title: "O erro de gestão que quase fechou o restaurante em 2014 e como ele virou o jogo em seis meses",
        caption: ["Quase", "fechou", "tudo"],
        time: "44:30 – 45:29",
        seconds: 59,
        score: 88,
    },
    {
        title: "Conselho para quem quer abrir o primeiro negócio",
        caption: ["Comece", "pequeno", "mesmo"],
        time: "58:02 – 58:40",
        seconds: 38,
        score: 86,
    },
    {
        title: "A história do prato que virou meme",
        caption: ["Virou", "meme", "do nada"],
        time: "1:05:11 – 1:05:55",
        seconds: 44,
        score: 85,
    },
    {
        title: "Bastidores do reality",
        caption: ["Ninguém", "sabe", "disso"],
        time: "1:22:40 – 1:23:30",
        seconds: 50,
        score: 82,
    },
    {
        title: "Sobre fracassar em público",
        caption: ["Errar na", "frente", "de todos"],
        time: "1:40:03 – 1:40:47",
        seconds: 44,
        score: 80,
    },
];

/* ---------- Shell ---------- */

function railButton(content, options) {
    const current = options.isCurrent === true ? ' aria-current="page"' : "";

    return `<a href="#" class="rail-button interactive ${options.className || ""}" aria-label="${options.label}" title="${options.label}"${current}>${content}</a>`;
}

function railVideo(video, currentId) {
    let extra = "";

    if (STATUS[video.status].tone === "working") {
        extra = `<span class="rail-ring" style="--progress:${video.progress}"></span>`;
    }

    if (video.status === "failed") {
        extra = '<span class="rail-dot"></span>';
    }

    const label = `${video.title} · ${STATUS[video.status].label}`;

    return railButton(`${extra}${mascot(video.mascot)}`, {
        label,
        className: "rail-mascot",
        isCurrent: video.id === currentId,
    });
}

function rail(options) {
    const recent = options.videos
        .slice(0, 8)
        .map((video) => railVideo(video, options.currentVideoId))
        .join("");
    const divider = options.videos.length > 0 ? '<span class="rail-divider"></span>' : "";

    return `<nav class="rail" aria-label="Navegação principal">
        ${railButton('<span class="brand-mark">' + icon("scissors", "icon-sm") + "</span>", { label: "Nelcota" })}
        ${railButton(icon("film"), { label: "Seus vídeos", isCurrent: options.currentVideoId === undefined })}
        ${divider}
        ${recent}
        ${railButton(icon("plus", "icon-sm"), { label: "Novo vídeo", className: "rail-add" })}
        <span class="rail-spacer"></span>
        <button class="user-avatar interactive" aria-label="Sua conta: Haniel Fialho">HF</button>
    </nav>`;
}

function navItem(label, iconName, options = {}) {
    const current = options.isCurrent === true ? ' aria-current="page"' : "";
    const count =
        options.count !== undefined ? `<span class="nav-count">${options.count}</span>` : "";

    return `<a href="#" class="nav-item interactive"${current}>${icon(iconName)}${label}${count}</a>`;
}

function listSidebar(total) {
    return `<aside class="sidebar">
        <div class="sidebar-title">Nelcota</div>
        ${navItem("Seus vídeos", "film", { isCurrent: true, count: total })}
        ${navItem("Minha conta", "user")}
    </aside>`;
}

function videoSidebar(video, clipCount) {
    const meta = [sourceLabel(video.source), video.duration]
        .filter((part) => part !== null)
        .join(" · ");

    return `<aside class="sidebar">
        <a href="#" class="nav-item interactive" style="color:var(--muted-foreground);margin-bottom:8px">${icon("arrowLeft")}Seus vídeos</a>
        <div class="sidebar-video">
            ${mascot(video.mascot)}
            <div class="sidebar-video-text">
                <div class="sidebar-video-title" title="${video.title}">${video.title}</div>
                <div class="sidebar-video-meta">${meta}</div>
            </div>
        </div>
        ${navItem("Visão geral", "grid", { isCurrent: true })}
        ${navItem("Cortes", "clapper", { count: clipCount })}
    </aside>`;
}

function topbar(title) {
    return `<header class="topbar">
        <span class="brand-mark">${icon("scissors", "icon-sm")}</span>
        <span class="topbar-title">${title}</span>
        <button class="icon-button interactive" aria-label="Abrir menu">${icon("menu")}</button>
    </header>`;
}

function shell(options) {
    const banner = options.banner || "";

    return `<div class="app">
        ${rail(options)}
        <div class="frame">
            ${options.sidebar}
            <div style="min-width:0">
                ${topbar(options.topbarTitle)}
                <main class="main"><div class="main-inner">${banner}${options.content}</div></main>
            </div>
        </div>
    </div>${options.overlay || ""}`;
}

/* ---------- Pieces ---------- */

function sourceLabel(source) {
    return source === "youtube" ? "YouTube" : "Arquivo";
}

function statusPill(status) {
    const definition = STATUS[status];
    const spin = definition.icon === "loader" ? "spin" : "";

    return `<span class="status" data-tone="${definition.tone}">${icon(definition.icon, `icon-sm ${spin}`)}${definition.label}</span>`;
}

function statusCell(video) {
    const tone = STATUS[video.status].tone;

    if (tone === "working") {
        return `<div class="status-stack">${statusPill(video.status)}<div class="bar"><span style="width:${video.progress}%"></span></div></div>`;
    }

    if (video.note !== undefined) {
        const noteTone = video.status === "failed" ? "danger" : "";

        return `<div class="status-stack">${statusPill(video.status)}<span class="status-note" data-tone="${noteTone}" title="${video.note}">${video.note}</span></div>`;
    }

    if (video.status === "cancelled") {
        return `<div class="status-stack">${statusPill(video.status)}<span class="status-note">Por você · etapas guardadas</span></div>`;
    }

    if (video.status === "queued") {
        return `<div class="status-stack">${statusPill(video.status)}<span class="status-note">Começa após o anterior</span></div>`;
    }

    return statusPill(video.status);
}

function clipsCell(video) {
    if (video.status === "done") {
        return `<span class="num"><span class="num-strong">${video.clips[0]}</span> de ${video.clips[1]}</span>`;
    }

    return `<span class="num">${video.clips[1]} pedidos</span>`;
}

function videoRow(video) {
    const duration = video.duration === null ? "duração —" : video.duration;

    return `<tr>
        <td><a href="#" class="video-cell interactive">${mascot(video.mascot)}
            <span class="video-cell-text">
                <span class="video-title" title="${video.title}">${video.title}</span>
                <span class="video-meta">${icon(video.source === "youtube" ? "link" : "upload", "icon-sm")}${sourceLabel(video.source)} · ${duration}</span>
            </span></a></td>
        <td>${statusCell(video)}</td>
        <td>${clipsCell(video)}</td>
        <td class="num">${video.created}</td>
        <td><button class="icon-button interactive" aria-label="Ações para ${video.title}">${icon("more")}</button></td>
    </tr>`;
}

function tableHead() {
    return `<colgroup><col class="col-video"><col class="col-status"><col class="col-clips"><col class="col-date"><col class="col-actions"></colgroup>
        <thead><tr>
            <th><span class="th-inner">${icon("film", "icon-sm")}Vídeo</span></th>
            <th><span class="th-inner">${icon("activity", "icon-sm")}Situação</span></th>
            <th><span class="th-inner">${icon("scissors", "icon-sm")}Cortes</span></th>
            <th><span class="th-inner">${icon("calendar", "icon-sm")}Criado em</span></th>
            <th><span class="sr-only"></span></th>
        </tr></thead>`;
}

function videoTable(videos, footer) {
    return `<div class="table-card"><table class="table">${tableHead()}<tbody>${videos.map(videoRow).join("")}</tbody></table>${footer}</div>`;
}

function pagerFooter(from, to, total) {
    return `<div class="table-footer"><span>${from}–${to} de ${total}</span>
        <div class="pager">
            <button class="icon-button interactive" aria-label="Página anterior" disabled style="cursor:not-allowed;opacity:.4">${icon("left")}</button>
            <button class="icon-button interactive" aria-label="Próxima página">${icon("right")}</button>
        </div></div>`;
}

const FILTERS = [
    { label: "Todos", count: 64 },
    { label: "Processando", count: 4 },
    { label: "Prontos", count: 54 },
    { label: "Com erro", count: 6 },
];

function toolbar(options) {
    const chips = FILTERS.map((filter) => {
        const pressed = filter.label === options.activeFilter ? "true" : "false";

        return `<button class="chip interactive" aria-pressed="${pressed}">${filter.label}<span class="chip-count">${filter.count}</span></button>`;
    }).join("");

    return `<div class="toolbar">
        <label class="search">${icon("search", "icon-sm")}<input placeholder="Buscar por título" value="${options.query || ""}" aria-label="Buscar por título"></label>
        <div class="chips" style="display:flex;gap:6px">${chips}</div>
        <span class="toolbar-total">${options.total}</span>
    </div>`;
}

/** The empty state carries its own primary action, so the header hides it to keep one yellow button. */
function listHeader(options = {}) {
    const action =
        options.hasAction === false
            ? ""
            : `<button class="button button-primary interactive">${icon("plus", "icon-sm")}Novo vídeo</button>`;

    return `<div class="page-header">
        <div><h1 class="page-title">Seus vídeos</h1>
        <p class="page-subtitle">Cada vídeo longo vira cortes verticais 9:16 com legenda.</p></div>
        ${action}
    </div>`;
}

function emptyState(options) {
    return `<div class="empty">${options.art}
        <p class="empty-title">${options.title}</p>
        <p class="empty-text">${options.text}</p>
        ${options.action}
    </div>`;
}

/* ---------- Boards: video list ---------- */

function listShell(options) {
    return shell({
        videos: options.videos,
        sidebar: listSidebar(options.total),
        topbarTitle: "Seus vídeos",
        content: options.content,
        banner: options.banner,
        overlay: options.overlay,
    });
}

function listDefault() {
    return listShell({
        videos: VIDEOS,
        total: 64,
        content: `${listHeader()}${toolbar({ activeFilter: "Todos", total: "64 vídeos" })}${videoTable(VIDEOS, pagerFooter(1, 20, 64))}`,
    });
}

function listEmpty() {
    const art = `<div style="display:flex;gap:6px">${mascot(5, "mascot-lg")}${mascot(19, "mascot-lg")}${mascot(14, "mascot-lg")}</div>`;
    const empty = emptyState({
        art,
        title: "Nenhum vídeo ainda",
        text: "Envie um arquivo ou cole um link do YouTube. Cada vídeo ganha um mascote e aparece aqui com os cortes.",
        action: `<button class="button button-primary interactive">${icon("plus", "icon-sm")}Enviar o primeiro vídeo</button>`,
    });

    return listShell({
        videos: [],
        total: 0,
        content: `${listHeader({ hasAction: false })}${empty}`,
    });
}

function listFilteredEmpty() {
    const empty = emptyState({
        art: `<span style="color:var(--muted-foreground)">${icon("searchX", "icon-lg")}</span>`,
        title: "Nenhum vídeo com “podcast de vendas”",
        text: "A busca olha só o título. Confira a grafia ou limpe a busca para ver todos.",
        action: '<button class="button button-secondary interactive">Limpar busca</button>',
    });

    return listShell({
        videos: VIDEOS,
        total: 64,
        content: `${listHeader()}${toolbar({ activeFilter: "Todos", total: "0 de 64", query: "podcast de vendas" })}${empty}`,
    });
}

function listOne() {
    const only = [VIDEOS[1]];

    return listShell({
        videos: only,
        total: 1,
        content: `${listHeader()}${toolbar({ activeFilter: "Todos", total: "1 vídeo" })}${videoTable(only, "")}`,
    });
}

function skeletonRow() {
    return `<tr>
        <td><div style="display:flex;gap:12px;align-items:center"><span class="skeleton" style="width:32px;height:32px;border-radius:50%"></span>
            <div style="display:grid;gap:6px;flex:1"><span class="skeleton" style="height:12px;width:70%"></span><span class="skeleton" style="height:10px;width:30%"></span></div></div></td>
        <td><span class="skeleton" style="height:22px;width:90px"></span></td>
        <td><span class="skeleton" style="height:12px;width:50px"></span></td>
        <td><span class="skeleton" style="height:12px;width:80px"></span></td>
        <td></td></tr>`;
}

function listLoading() {
    const rows = Array.from({ length: 8 }, skeletonRow).join("");
    const table = `<div class="table-card" aria-busy="true" aria-label="Carregando vídeos"><table class="table">${tableHead()}<tbody>${rows}</tbody></table></div>`;

    return listShell({
        videos: VIDEOS,
        total: "…",
        content: `${listHeader()}${toolbar({ activeFilter: "Todos", total: "" })}${table}`,
    });
}

function listError() {
    const empty = emptyState({
        art: `<span style="color:var(--destructive)">${icon("alert", "icon-lg")}</span>`,
        title: "Não foi possível carregar seus vídeos",
        text: "Seus vídeos e cortes continuam salvos. Tente de novo; se continuar, recarregue a página.",
        action: `<button class="button button-secondary interactive">${icon("rotate", "icon-sm")}Tentar de novo</button>`,
    });

    return listShell({ videos: VIDEOS, total: 64, content: `${listHeader()}${empty}` });
}

function listOffline() {
    const banner = `<div class="banner" role="status">${icon("wifiOff", "icon-sm")}Sem conexão desde 20:41. O progresso dos vídeos volta a atualizar quando a internet voltar.</div>`;

    return listShell({
        videos: VIDEOS,
        total: 64,
        banner,
        content: `${listHeader()}${toolbar({ activeFilter: "Processando", total: "4 vídeos" })}${videoTable(
            VIDEOS.filter(
                (video) => STATUS[video.status].tone === "working" || video.status === "queued",
            ),
            "",
        )}`,
    });
}

function newVideoDialog() {
    return `<div class="scrim"><div class="dialog" role="dialog" aria-labelledby="new-title">
        <div class="dialog-head"><div><h2 id="new-title" class="page-title" style="font-size:20px">Novo vídeo</h2>
            <p class="page-subtitle">A IA transcreve, escolhe os melhores momentos e entrega cortes 9:16 com legenda.</p></div>
            <button class="icon-button interactive" aria-label="Fechar">${icon("x")}</button></div>
        <div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="true">${icon("upload", "icon-sm")}Enviar arquivo</button><button class="tab" role="tab" aria-selected="false">${icon("link", "icon-sm")}Link do YouTube</button></div>
        <div class="dropzone">${icon("upload", "icon-lg")}<strong>Arraste o vídeo aqui</strong>ou clique para escolher · MP4, MOV ou MKV até 3 h</div>
        <div style="display:flex;justify-content:flex-end;gap:8px"><button class="button button-ghost interactive">Cancelar</button><button class="button button-primary interactive" disabled style="cursor:not-allowed;opacity:.5">Gerar cortes</button></div>
    </div></div>`;
}

function listNewDialog() {
    return listShell({
        videos: VIDEOS,
        total: 64,
        content: `${listHeader()}${toolbar({ activeFilter: "Todos", total: "64 vídeos" })}${videoTable(VIDEOS.slice(0, 6), "")}`,
        overlay: newVideoDialog(),
    });
}

function listDeleted() {
    const remaining = VIDEOS.filter((video) => video.id !== "v08");

    return listShell({
        videos: remaining,
        total: 63,
        content: `${listHeader()}${toolbar({ activeFilter: "Todos", total: "63 vídeos" })}${videoTable(remaining.slice(0, 9), "")}`,
        overlay: `<div class="toast" role="status">${icon("check", "icon-sm")}“Review do iPhone 18 depois de um mês” foi excluído</div>`,
    });
}

/* ---------- Boards: video details ---------- */

function videoHeader(video) {
    const meta = [
        statusPill(video.status),
        `<span class="meta-item">${icon(video.source === "youtube" ? "link" : "upload", "icon-sm")}${sourceLabel(video.source)}</span>`,
        `<span class="meta-item">${icon("calendar", "icon-sm")}${video.created}</span>`,
    ];

    if (video.duration !== null) {
        meta.push(`<span class="meta-item">${icon("clock", "icon-sm")}${video.duration}</span>`);
    }

    return `<header class="video-header">${mascot(video.mascot, "mascot-lg")}
        <div class="video-header-text"><h1 class="video-header-title">${video.title}</h1><div class="meta-row">${meta.join("")}</div></div>
        <button class="button button-ghost interactive">${icon("trash", "icon-sm")}Excluir</button>
    </header>`;
}

function clipCard(clip) {
    const caption = `${clip.caption[0]} <mark>${clip.caption[1]}</mark> ${clip.caption[2]}`;

    return `<article class="clip">
        <div class="clip-preview"><span class="clip-score">nota ${clip.score}</span><span class="clip-caption">${caption}</span><a href="#" class="clip-play interactive" aria-label="Assistir: ${clip.title}"><span>${icon("play", "icon-sm")}</span></a></div>
        <h3 class="clip-title">${clip.title}</h3>
        <p class="clip-meta">${clip.time} · ${clip.seconds}s</p>
        <a href="#" class="button button-secondary interactive">${icon("download", "icon-sm")}Baixar corte</a>
    </article>`;
}

function failedClipCard(title) {
    return `<article class="clip">
        <div class="clip-preview" data-state="failed">${icon("alert", "icon-lg")}Não foi possível renderizar este corte</div>
        <h3 class="clip-title">${title}</h3>
        <p class="clip-meta">Os outros cortes estão ok</p>
        <button class="button button-secondary interactive">${icon("rotate", "icon-sm")}Tentar de novo</button>
    </article>`;
}

function renderingClipCard(title, label) {
    return `<article class="clip">
        <div class="clip-preview" data-state="rendering">${icon("loader", "icon-lg spin")}${label}</div>
        <h3 class="clip-title">${title}</h3>
        <p class="clip-meta">Aparece quando ficar pronto</p>
    </article>`;
}

function clipsSection(cards, count) {
    return `<section style="display:grid;gap:14px"><h2 class="section-title">Cortes <span class="num">${count}</span></h2><div class="clips">${cards}</div></section>`;
}

const STEP_LIST = [
    { status: "downloading", label: "Download" },
    { status: "transcribing", label: "Transcrição" },
    { status: "selecting", label: "Melhores momentos" },
    { status: "rendering", label: "Cortes com legenda" },
];

function stepState(stepIndex, currentIndex) {
    if (stepIndex < currentIndex) {
        return "done";
    }

    if (stepIndex === currentIndex) {
        return "current";
    }

    return "upcoming";
}

function processingPanel(video) {
    const currentIndex = STEP_LIST.findIndex((step) => step.status === video.status);
    const steps = STEP_LIST.map((step, index) => {
        const state = stepState(index, currentIndex);
        const badgeByState = {
            done: icon("check", "icon-sm"),
            current: icon("loader", "icon-sm spin"),
            upcoming: String(index + 1),
        };

        return `<li class="step" data-state="${state}"><span class="step-badge">${badgeByState[state]}</span>${step.label}</li>`;
    }).join("");

    return `<section class="panel" aria-live="polite">
        <div class="panel-row"><div class="panel-row-text"><p class="panel-title">${STATUS[video.status].label}…</p>
            <p class="panel-text">cerca de 4 min nesta etapa · ${video.progress}%</p></div>
            <button class="button button-ghost interactive">${icon("x", "icon-sm")}Cancelar</button></div>
        <div class="bar bar-lg"><span style="width:${video.progress}%"></span></div>
        <ol class="steps">${steps}</ol>
    </section>`;
}

function resumePanel(options) {
    return `<section class="panel" role="status" data-tone="${options.tone}"><div class="panel-row">
        <span style="color:${options.color}">${icon(options.icon, "icon-lg")}</span>
        <div class="panel-row-text"><p class="panel-title">${options.title}</p><p class="panel-text">${options.text}</p></div>
        <button class="button button-primary interactive">${icon(options.actionIcon, "icon-sm")}${options.action}</button>
    </div></section>`;
}

function videoShell(video, content, clipCount) {
    return shell({
        videos: VIDEOS,
        currentVideoId: video.id,
        sidebar: videoSidebar(video, clipCount),
        topbarTitle: video.title,
        content,
    });
}

function findVideo(id) {
    return VIDEOS.find((video) => video.id === id);
}

function videoDone() {
    const video = findVideo("v04");
    const cards =
        CLIPS.map(clipCard).join("") +
        failedClipCard("O que muda para o MEI na prática") +
        failedClipCard("Ela explica o split payment em 40 segundos") +
        failedClipCard("Resposta à pergunta da plateia sobre o IBS");

    return videoShell(video, `${videoHeader(video)}${clipsSection(cards, "7 de 10 prontos")}`, 10);
}

function videoProcessing() {
    const video = findVideo("v01");
    const cards =
        renderingClipCard("Corte 1 de 10", "Renderizando…") +
        renderingClipCard("Corte 2 de 10", "Na fila") +
        renderingClipCard("Corte 3 de 10", "Na fila");

    return videoShell(
        video,
        `${videoHeader(video)}${processingPanel(video)}${clipsSection(cards, "0 de 10")}`,
        10,
    );
}

function videoFailed() {
    const video = findVideo("v06");
    const panel = resumePanel({
        tone: "danger",
        color: "var(--destructive)",
        icon: "alert",
        title: "Não deu certo desta vez",
        text: "O YouTube bloqueou o download deste vídeo. Tente de novo em alguns minutos ou envie o arquivo direto.",
        action: "Tentar de novo",
        actionIcon: "rotate",
    });

    return videoShell(video, `${videoHeader(video)}${panel}`, 0);
}

function videoNotFound() {
    const video = {
        id: "x",
        mascot: 0,
        title: "Vídeo não encontrado",
        source: "upload",
        duration: null,
    };
    const empty = emptyState({
        art: `<span style="color:var(--muted-foreground)">${icon("film", "icon-lg")}</span>`,
        title: "Vídeo não encontrado",
        text: "Ele pode ter sido excluído em outra aba ou o link está incompleto.",
        action: `<a href="#" class="button button-secondary interactive">${icon("arrowLeft", "icon-sm")}Voltar para seus vídeos</a>`,
    });

    return shell({
        videos: VIDEOS,
        sidebar: listSidebar(64),
        topbarTitle: video.title,
        content: empty,
    });
}

function videoLoading() {
    const header = `<div style="display:flex;gap:20px;align-items:center" aria-busy="true" aria-label="Carregando vídeo"><span class="skeleton" style="width:56px;height:56px;border-radius:50%"></span>
        <div style="display:grid;gap:10px;flex:1"><span class="skeleton" style="height:26px;width:60%"></span><span class="skeleton" style="height:14px;width:35%"></span></div></div>`;
    const clips = Array.from(
        { length: 4 },
        () =>
            '<span class="skeleton" style="aspect-ratio:9/16;border-radius:var(--radius-xl)"></span>',
    ).join("");

    return videoShell(findVideo("v03"), `${header}<div class="clips">${clips}</div>`, "…");
}

/* ---------- Boards: auth ---------- */

function authArt() {
    const mascots = Array.from({ length: 32 }, (_, index) => mascot(index)).join("");

    return `<div class="auth-art" aria-hidden="true"><div class="mascot-grid">${mascots}</div>
        <div class="auth-quote"><h2>Vídeos longos viram <span>cortes virais</span></h2>
        <p>Cada vídeo ganha um mascote. Você acompanha tudo pelo rail, do upload ao corte com legenda.</p></div></div>`;
}

function field(options) {
    const invalid = options.error !== undefined ? ' aria-invalid="true"' : "";
    const error =
        options.error !== undefined ? `<span class="field-error">${options.error}</span>` : "";

    return `<label class="field"><span class="label">${options.label}</span><input class="input" type="${options.type}" value="${options.value || ""}" placeholder="${options.placeholder || ""}"${invalid}>${error}</label>`;
}

function authScreen(options) {
    return `<div class="auth"><div class="auth-form-side"><form class="auth-form" onsubmit="return false">
        <span class="brand"><span class="brand-mark">${icon("scissors", "icon-sm")}</span>Nelcota</span>
        <div><h1 class="page-title" style="font-size:26px">${options.title}</h1><p class="page-subtitle">${options.subtitle}</p></div>
        ${options.alert || ""}
        ${options.fields}
        ${options.button}
        <p class="auth-footer">${options.footer}</p>
    </form></div>${authArt()}</div>`;
}

function signIn(state) {
    const isSubmitting = state === "submitting";
    const button = isSubmitting
        ? `<button class="button button-primary" aria-busy="true">${icon("loader", "icon-sm spin")}Entrando…</button>`
        : '<button class="button button-primary interactive">Entrar</button>';
    const alert =
        state === "error"
            ? `<div class="alert" role="alert">${icon("alert", "icon-sm")}E-mail ou senha incorretos. Confira e tente de novo.</div>`
            : "";

    return authScreen({
        title: "Entrar",
        subtitle: "Continue de onde parou.",
        alert,
        fields:
            field({
                label: "E-mail",
                type: "email",
                value: state === "default" ? "" : "haniel@exemplo.com.br",
                placeholder: "voce@exemplo.com",
            }) +
            field({
                label: "Senha",
                type: "password",
                value: state === "default" ? "" : "********",
            }),
        button,
        footer: 'Ainda não tem conta? <a href="#" class="interactive">Criar conta</a>',
    });
}

function signUp(state) {
    const isInvalid = state === "errors";

    return authScreen({
        title: "Criar conta",
        subtitle: "Seu primeiro vídeo vira cortes em minutos.",
        fields:
            field({
                label: "Nome",
                type: "text",
                value: isInvalid ? "Maria Fernanda de Albuquerque Santos" : "",
            }) +
            field({
                label: "E-mail",
                type: "email",
                value: isInvalid ? "maria@exemplo" : "",
                error: isInvalid ? "Digite um e-mail válido, como voce@exemplo.com" : undefined,
            }) +
            field({
                label: "Senha",
                type: "password",
                value: isInvalid ? "1234" : "",
                error: isInvalid ? "Use pelo menos 8 caracteres" : undefined,
            }),
        button: '<button class="button button-primary interactive">Criar conta</button>',
        footer: 'Já tem conta? <a href="#" class="interactive">Entrar</a>',
    });
}

/* ---------- State sheets ---------- */

function sheetItem(caption, content) {
    return `<div class="sheet-item"><span class="sheet-caption">${caption}</span>${content}</div>`;
}

function shellSheet() {
    const railStates = [
        sheetItem(
            "Rail · vídeo ativo",
            `<div class="sheet-rail">${railVideo(VIDEOS[2], "v03")}</div>`,
        ),
        sheetItem(
            "Rail · processando (anel = progresso)",
            `<div class="sheet-rail">${railVideo(VIDEOS[0])}${railVideo(VIDEOS[1])}${railVideo(VIDEOS[10])}</div>`,
        ),
        sheetItem("Rail · falhou", `<div class="sheet-rail">${railVideo(VIDEOS[5])}</div>`),
        sheetItem(
            "Rail · cancelado / na fila (sem marca)",
            `<div class="sheet-rail">${railVideo(VIDEOS[7])}${railVideo(VIDEOS[4])}</div>`,
        ),
    ].join("");
    const allMascots = Array.from({ length: 32 }, (_, index) => mascot(index)).join("");

    return `<div class="state-sheet">
        <h1>1.0 · Casca · estados</h1>
        <div class="sheet-row">${railStates}</div>
        ${sheetItem("Os 32 mascotes · índice = hash(id do vídeo) % 32 · 0–15 formas, 16–31 objetos", `<div class="sheet-rail" style="flex-wrap:wrap;max-width:620px">${allMascots}</div>`)}
        ${sheetItem("Banner · sem conexão (app inteiro)", `<div class="banner">${icon("wifiOff", "icon-sm")}Sem conexão desde 20:41. O progresso dos vídeos volta a atualizar quando a internet voltar.</div>`)}
        ${sheetItem("Sidebar · navegação ativa / hover", `<div style="width:264px;display:grid;gap:4px">${navItem("Seus vídeos", "film", { isCurrent: true, count: 64 })}${navItem("Minha conta", "user")}</div>`)}
    </div>`;
}

function listSheet() {
    const rows = [VIDEOS[3], VIDEOS[0], VIDEOS[4], VIDEOS[5], VIDEOS[7]];

    return `<div class="state-sheet">
        <h1>2.1 · Seus vídeos · estados de linha</h1>
        ${sheetItem("Título longo · pronto com cortes faltando · na fila sem duração · falhou · cancelado", videoTable(rows, ""))}
        ${sheetItem("Situação · todas", `<div class="sheet-row">${Object.keys(STATUS).map(statusPill).join("")}</div>`)}
        ${sheetItem("Filtros · ativo / normal", toolbar({ activeFilter: "Com erro", total: "6 vídeos" }))}
        ${sheetItem("Botão principal · normal / carregando (mesmo tamanho)", `<div class="sheet-row"><button class="button button-primary interactive">${icon("plus", "icon-sm")}Novo vídeo</button><button class="button button-primary" aria-busy="true">${icon("loader", "icon-sm spin")}Enviando…</button></div>`)}
    </div>`;
}

function videoSheet() {
    const queued = findVideo("v05");

    return `<div class="state-sheet">
        <h1>2.2 · Vídeo · estados de painel e corte</h1>
        ${sheetItem("Na fila", `<section class="panel"><div class="panel-row">${icon("clock", "icon-lg")}<div class="panel-row-text"><p class="panel-title">Na fila</p><p class="panel-text">Começa assim que o vídeo anterior terminar. Você pode fechar esta página.</p></div><button class="button button-ghost interactive">${icon("x", "icon-sm")}Cancelar</button></div></section>`)}
        ${sheetItem("Cancelado (cinza, por escolha)", resumePanel({ tone: "", color: "var(--muted-foreground)", icon: "slash", title: "Processamento cancelado", text: "As etapas que já terminaram foram guardadas. Retome para continuar de onde parou.", action: "Retomar", actionIcon: "play" }))}
        ${sheetItem("Cabeçalho · título longo (2 linhas) e sem duração", videoHeader(findVideo("v04")) + videoHeader(queued))}
        ${sheetItem("Corte · pronto / renderizando / falhou", `<div class="clips" style="max-width:640px">${clipCard(CLIPS[0])}${renderingClipCard("Corte 2 de 10", "Renderizando…")}${failedClipCard("O que muda para o MEI na prática")}</div>`)}
    </div>`;
}

const BOARDS = {
    "1.0-shell-states": shellSheet,
    "2.1-list-default": listDefault,
    "2.1-list-empty-first-time": listEmpty,
    "2.1-list-filtered-empty": listFilteredEmpty,
    "2.1-list-one-video": listOne,
    "2.1-list-loading": listLoading,
    "2.1-list-couldnt-load": listError,
    "2.1-list-offline": listOffline,
    "2.1-list-new-video-dialog": listNewDialog,
    "2.1-list-deleted": listDeleted,
    "2.1-list-row-states": listSheet,
    "2.2-video-done": videoDone,
    "2.2-video-processing": videoProcessing,
    "2.2-video-failed": videoFailed,
    "2.2-video-loading": videoLoading,
    "2.2-video-not-found": videoNotFound,
    "2.2-video-panel-states": videoSheet,
    "3.1-sign-in-default": () => signIn("default"),
    "3.1-sign-in-submitting": () => signIn("submitting"),
    "3.1-sign-in-error": () => signIn("error"),
    "3.2-sign-up-default": () => signUp("default"),
    "3.2-sign-up-field-errors": () => signUp("errors"),
};

const boardName = document.body.dataset.board;
const renderBoard = BOARDS[boardName];

if (renderBoard === undefined) {
    document.body.textContent = `Board desconhecido: ${boardName}`;
}

if (renderBoard !== undefined) {
    document.body.innerHTML = renderBoard();
}
