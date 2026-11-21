// Shared top bar for direction B. body[data-nav] picks the current item.
(function () {
    var current = document.body.dataset.nav;
    var items = [
        ["videos", "videos", "Vídeos"],
        ["clips", "scissors", "Cortes"],
        ["overview", "chart", "Painel"],
    ];
    var nav = items
        .map(function (item) {
            var on = "";
            if (item[0] === current) {
                on = ' class="on"';
            }
            return "<span" + on + '><span data-i="' + item[1] + '"></span>' + item[2] + "</span>";
        })
        .join("");
    document.getElementById("top").outerHTML =
        '<header class="topbar"><span class="brand"><span class="mascot"></span>Nelcota</span><nav class="nav">' +
        nav +
        '</nav><span class="grow"></span><div class="field" style="width:260px;height:36px"><span data-i="search"></span>Buscar<span class="kbd">Ctrl K</span></div>' +
        '<span class="btn primary" style="height:36px"><span data-i="add"></span>Novo vídeo</span><span class="avatar" style="margin-left:8px"></span></header>';
})();
