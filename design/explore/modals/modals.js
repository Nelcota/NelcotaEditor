// Renders the board's mocks; each direction shares the same content with a different sidebar.

const NEW_VIDEO_STEPS = [
    { title: "Vídeo", hint: "Link ou arquivo", value: "Golf 4x4.mp4", state: "done" },
    { title: "Cortes", hint: "Quantos e de que tamanho", value: "5 cortes · 60s", state: "now" },
    { title: "Idioma", hint: "Para a legenda", value: "Português", state: "later" },
    { title: "Revisar", hint: "Conferir e gerar", value: "", state: "later" },
];

const DELETE_STEPS = [
    { title: "O que some", hint: "Confira antes", value: "1 vídeo, 5 cortes", state: "now" },
    { title: "Confirmar", hint: "Sem volta", value: "", state: "later" },
];

const NEL_LINES = {
    newVideo:
        "Cinco cortes de um minuto funcionam bem para a maioria dos vídeos. Se não souber, deixe assim.",
    delete: "Depois de excluir, não tem lixeira. Os cortes que você já baixou continuam no seu aparelho.",
};

function stepItem(step, index, direction) {
    const isDone = step.state === "done";
    const number = isDone ? "✓" : String(index + 1);
    const hasValue = direction === "b" && step.value !== "" && step.state !== "later";
    const second = hasValue
        ? `<small class="value">${step.value}</small>`
        : `<small>${step.hint}</small>`;
    const edit = direction === "b" && isDone ? `<span class="edit">Mudar</span>` : "";

    return `<li class="step is-${step.state}"><span class="num">${number}</span><div><b>${step.title}</b>${second}</div>${edit}</li>`;
}

function sidebar(options) {
    const { direction, title, glyph, steps, isDanger, foot } = options;
    const listClass = { a: "trail", b: "summary", c: "trail" }[direction];
    const items = steps
        .filter((step) => direction !== "b" || step.title !== "Revisar")
        .map((step, index) => stepItem(step, index, direction))
        .join("");

    return `<aside class="side">
        <div class="side-title ${isDanger ? "is-danger" : ""}"><span class="glyph">${glyph}</span>${title}</div>
        <ol class="steps ${listClass}">${items}</ol>
        <div class="side-foot">${foot}</div>
    </aside>`;
}

function progressFoot(current, total) {
    const percent = Math.round((current / total) * 100);

    return `<div class="progress-text">Passo ${current} de ${total}</div><div class="bar"><i style="width:${percent}%"></i></div>`;
}

function newVideoFoot(direction) {
    if (direction === "b") {
        return `<div class="thumb"><span class="img">▶</span><div><b>Golf 4x4.mp4</b><span>12:40 · 920 MB</span></div></div>`;
    }

    if (direction === "c") {
        return `<div class="nel"><span class="ghost">👻</span><p>${NEL_LINES.newVideo}</p></div>`;
    }

    return progressFoot(2, 4);
}

function newVideoContent() {
    return `<div>
            <div class="field-label">Quantos cortes? <span>Você pode gerar mais depois</span></div>
            <div class="choices">
                <div class="choice"><b>3</b><span>Rápido</span></div>
                <div class="choice is-on"><b>5</b><span class="rec">Recomendado</span></div>
                <div class="choice"><b>8</b><span>Mais opções</span></div>
                <div class="choice"><b>10</b><span>Vídeos longos</span></div>
            </div>
        </div>
        <div>
            <div class="field-label">Tamanho de cada corte</div>
            <div class="chips"><span class="chip">30s</span><span class="chip">45s</span><span class="chip is-on">60s</span><span class="chip">90s</span></div>
            <p class="hint">Reels e TikTok aceitam até 90s. Shorts, até 60s.</p>
        </div>`;
}

function newVideoFooter(direction) {
    if (direction === "b") {
        return `<footer class="foot"><button class="btn ghost">Voltar</button><span class="grow">Idioma já vem do seu perfil</span><button class="btn">Continuar</button><button class="btn primary">Gerar cortes</button></footer>`;
    }

    return `<footer class="foot"><button class="btn ghost">← Voltar</button><span class="grow"></span><button class="btn primary">Continuar →</button></footer>`;
}

function newVideoModal(direction) {
    const side = sidebar({
        direction,
        title: "Novo vídeo",
        glyph: "+",
        steps: NEW_VIDEO_STEPS,
        isDanger: false,
        foot: newVideoFoot(direction),
    });
    const kicker = direction === "b" ? "Cortes" : "Passo 2 de 4";

    return `<div class="scrim"><div class="modal">${side}
        <section class="body">
            <header class="body-head"><div><div class="kicker">${kicker}</div><h3>Como você quer os cortes?</h3><p>Já deixamos o que funciona melhor. Mude só se quiser.</p></div><span class="close">✕</span></header>
            <div class="content">${newVideoContent()}</div>
            ${newVideoFooter(direction)}
        </section></div></div>`;
}

function deleteFoot(direction) {
    if (direction === "c") {
        return `<div class="nel"><span class="ghost">👻</span><p>${NEL_LINES.delete}</p></div>`;
    }

    if (direction === "b") {
        return "";
    }

    return progressFoot(1, 2);
}

function deleteModal(direction) {
    const side = sidebar({
        direction,
        title: "Excluir vídeo",
        glyph: "🗑",
        steps: DELETE_STEPS,
        isDanger: true,
        foot: deleteFoot(direction),
    });

    return `<div class="scrim"><div class="modal is-short">${side}
        <section class="body">
            <header class="body-head"><div><div class="kicker">Passo 1 de 2</div><h3>Isto vai sumir</h3><p>Do Nelcota e dos links públicos.</p></div><span class="close">✕</span></header>
            <div class="content"><ul class="loss"><li>Vídeo original <span>920 MB</span></li><li>Cortes prontos <span>5</span></li><li>Links públicos <span>param de abrir</span></li></ul></div>
            <footer class="foot"><button class="btn ghost">Cancelar</button><span class="grow"></span><button class="btn danger">Entendi, continuar</button></footer>
        </section></div></div>`;
}

function phoneTop(direction) {
    if (direction === "b") {
        return `<div class="top-row"><span><b>Cortes</b> · 5 cortes · 60s</span><span>✕</span></div><div class="chips"><span class="chip">✓ Vídeo</span><span class="chip is-on">Cortes</span><span class="chip">Idioma</span></div>`;
    }

    const nel =
        direction === "c"
            ? `<div class="nel"><span class="ghost">👻</span><p>${NEL_LINES.newVideo}</p></div>`
            : "";

    return `<div class="top-row"><span><b>Novo vídeo</b> · Passo 2 de 4</span><span>✕</span></div><div class="segments"><i class="done"></i><i class="on"></i><i></i><i></i></div>${nel}`;
}

function phone(direction) {
    return `<div class="phone"><div class="sheet"><span class="grab"></span>
        <div class="top">${phoneTop(direction)}</div>
        <div class="content"><div><h3 style="font-size:19px">Como você quer os cortes?</h3><p class="hint">Já deixamos o que funciona melhor.</p></div>${newVideoContent()}</div>
        <footer class="foot"><button class="btn ghost">Voltar</button><button class="btn primary">Continuar</button></footer>
    </div></div>`;
}

function currentModal() {
    return `<div class="scrim"><div class="modal old no-side" style="grid-template-columns:minmax(0,1fr) 260px">
        <div class="old-form"><div><h3 style="font-size:20px">Novo vídeo</h3><p class="hint">Cole o link ou envie o arquivo. O resto já vem preenchido.</p></div>
            <div class="field-label">Link ou arquivo</div><div class="field"></div><div class="field-label">Título (opcional)</div><div class="field"></div>
            <div class="field-label">Quantos cortes</div><div class="grid4"><div></div><div></div><div></div><div></div></div>
            <div class="field-label">Duração</div><div class="grid4"><div></div><div></div><div></div><div></div></div>
            <div class="field-label">Em que idioma as pessoas falam?</div><div class="grid4"><div></div><div></div><div></div><div></div></div>
            <div style="display:flex;justify-content:end"><button class="btn primary">Gerar cortes</button></div></div>
        <div class="old-preview"><b style="color:var(--fg)">Prévia</b><div class="thumb"><span class="img">▶</span><div><b>Sem vídeo</b></div></div>5 cortes · 60s · Português</div>
    </div></div>`;
}

function renderCurrent(row) {
    row.innerHTML = `<div><div class="caption">Novo vídeo hoje</div>${currentModal()}</div>
        <div class="critique"><b>O que atrapalha</b><ul>
            <li>Cinco perguntas de uma vez: quem chega não sabe por onde começar.</li>
            <li>Cada modal tem um jeito: Excluir é um alerta, Perfil é um formulário, Foto é outro modal.</li>
            <li>No celular, a prévia vai para baixo e o botão some da tela.</li>
            <li>Nada diz quanto falta para terminar.</li>
        </ul></div>`;
}

function renderDirection(row, direction) {
    row.innerHTML = `<div class="stack"><div><div class="caption">Novo vídeo · passo 2</div>${newVideoModal(direction)}</div>
            <div><div class="caption">Modal curto · Excluir vídeo</div>${deleteModal(direction)}</div></div>
        <div><div class="caption">Celular</div>${phone(direction)}</div>`;
}

document.querySelectorAll("[data-render]").forEach((row) => {
    const direction = row.dataset.render;

    if (direction === "current") {
        renderCurrent(row);
        return;
    }

    renderDirection(row, direction);
});
