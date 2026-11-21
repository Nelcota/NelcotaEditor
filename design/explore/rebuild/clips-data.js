// Real clips from the local library, shared by the mocks.
window.CLIPS = [
    {
        t: "Por que ele recusou sociedade com a Urso",
        v: "URSO",
        img: "v2.jpg",
        s: 90,
        d: "0:37",
        cap: "Recusou <b>sociedade</b> com a Urso",
    },
    {
        t: "Ele fez 5 mil doses e não vendeu nenhuma",
        v: "URSO",
        img: "v2.jpg",
        s: 88,
        d: "0:34",
        cap: "<b>5 mil doses</b> e nenhuma vendida",
    },
    {
        t: "Perdidos em São Paulo com o ID4",
        v: "VW ID4",
        img: "v1.jpg",
        s: 85,
        d: "0:22",
        cap: "Perdidos em <b>São Paulo</b>",
    },
    {
        t: "O massa que o Cariani não conhecia",
        v: "CARIANI",
        img: "v3.jpg",
        s: 84,
        d: "0:41",
        cap: "O <b>massa</b> que ele não conhecia",
    },
    {
        t: "ID4 é a Tiguan elétrica?",
        v: "VW ID4",
        img: "v1.jpg",
        s: 82,
        d: "0:23",
        cap: "A <b>Tiguan</b> elétrica?",
    },
    {
        t: "O ID4 não tem som assinado?",
        v: "VW ID4",
        img: "v1.jpg",
        s: 80,
        d: "0:18",
        cap: "Cadê o <b>som</b>?",
    },
    {
        t: "A garrafa que virou meme",
        v: "URSO",
        img: "v2.jpg",
        s: 79,
        d: "0:29",
        cap: "A garrafa virou <b>meme</b>",
    },
    {
        t: "Balestrin julga a carbonara",
        v: "CARIANI",
        img: "v3.jpg",
        s: 77,
        d: "0:33",
        cap: "Julgando a <b>carbonara</b>",
    },
];
window.renderClips = function (target, count, withVideo) {
    var host = document.querySelector(target);
    window.CLIPS.slice(0, count).forEach(function (c) {
        var el = document.createElement("article");
        el.className = "clip-card";
        var video = "";
        if (withVideo === true) {
            video = '<p class="xs muted clamp-1">' + c.v + "</p>";
        }
        el.innerHTML =
            '<div class="vertical" style="background-image:url(img/' +
            c.img +
            ')">' +
            '<p class="cap">' +
            c.cap +
            "</p>" +
            '<span class="badge-on-media" style="left:8px;top:8px">' +
            c.s +
            "</span>" +
            '<span class="badge-on-media" style="right:8px;bottom:8px">' +
            c.d +
            "</span></div>" +
            '<div><p class="title clamp-2">' +
            c.t +
            "</p>" +
            video +
            "</div>";
        host.appendChild(el);
    });
};
