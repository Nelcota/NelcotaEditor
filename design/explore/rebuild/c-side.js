// Shared sidebar for direction C. body[data-nav] picks the current item.
(function () {
    var current = document.body.dataset.nav;
    var items = [
        ["clips", "scissors", "Cortes", "15"],
        ["videos", "videos", "Vídeos", "7"],
        ["overview", "chart", "Painel", ""],
    ];
    var nav = items
        .map(function (item) {
            var on = "";
            if (item[0] === current) {
                on = " on";
            }
            return (
                '<span class="item' +
                on +
                '"><span data-i="' +
                item[1] +
                '"></span>' +
                item[2] +
                '<span class="count">' +
                item[3] +
                "</span></span>"
            );
        })
        .join("");
    var videos = [
        ["0 0", "PRIMEIRO ROLE DE VW ID4"],
        ["66.67% 33.33%", "ESSA HISTÓRIA DA URSO ESTÁ..."],
        ["33.33% 66.67%", "CARIANI E BALESTRIN FORAM..."],
    ]
        .map(function (video) {
            return (
                '<span class="item video"><span class="mascot" style="background-position:' +
                video[0] +
                '"></span><span class="grow clamp-1">' +
                video[1] +
                "</span></span>"
            );
        })
        .join("");
    document.getElementById("side").outerHTML =
        '<nav class="side"><div class="brand-row"><span class="mascot"></span>Nelcota</div>' +
        '<span class="btn primary"><span data-i="add"></span>Novo vídeo</span>' +
        nav +
        '<p class="section">Recentes</p>' +
        videos +
        '<span class="grow"></span><span class="item"><span data-i="shield"></span>Admin</span>' +
        '<span class="item"><span class="avatar" style="width:24px;height:24px"></span><span class="grow" style="color:var(--ink)">Haniel</span><span data-i="dots"></span></span></nav>';
})();
