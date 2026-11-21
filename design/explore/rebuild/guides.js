// Draws the direction's named lines when the page is opened with ?guides.
// body[data-guides] = "kind@x:label; ..." with kind in text|box|trail|centre|h, x in px (negative = from the right).
(function () {
    if (location.search.indexOf("guides") === -1) {
        return;
    }

    var spec = document.body.dataset.guides || "";
    var width = window.innerWidth;

    spec.split(";").forEach(function (part) {
        var trimmed = part.trim();

        if (trimmed.length === 0) {
            return;
        }

        var kind = trimmed.split("@")[0];
        var rest = trimmed.split("@")[1].split(":");
        var value = Number(rest[0]);
        var label = rest[1] || "";
        var el = document.createElement("div");

        if (kind === "h") {
            el.className = "guide-h";
            el.style.top = value + "px";
            document.body.appendChild(el);
            return;
        }

        var x = value;

        if (value < 0) {
            x = width + value;
        }

        el.className = "guide " + kind;
        el.style.left = x + "px";
        el.innerHTML = "<b>" + label + " " + x + "</b>";
        document.body.appendChild(el);
    });
})();
