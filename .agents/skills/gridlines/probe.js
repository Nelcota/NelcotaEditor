// Injected into a page. Measures the ink edges of every text run, icon and
// boxed control inside each container, groups them into rows, and draws the
// dominant edges as dashed guides. Red: lead line and label line (solid), box
// line (faint), icon-column centre (fainter). Blue: trailing line. Amber: the
// trailing column's centre line.
//
//   window.__gridlines({ draw: true, containers: 'css, selectors' })
//
// Returns one entry per container: its dominant lines, every row's edges and
// vertical-centre spread, and the outliers that miss a line by 2px or more.
(() => {
    const DEFAULT_CONTAINERS = [
        "aside",
        "nav",
        "header",
        "section",
        "article",
        '[role="dialog"]',
        '[role="menu"]',
        '[role="listbox"]',
        '[data-slot="dialog-content"]',
        '[data-slot="sheet-content"]',
        '[data-slot="popover-content"]',
        '[data-slot="dropdown-menu-content"]',
        '[data-slot="card"]',
    ].join(", ");
    const BORDER_SIDES = ["Left", "Right", "Top", "Bottom"];
    const LINE_TOLERANCE = 1;

    function isClear(color) {
        return color.length === 0 || /rgba\(0, 0, 0, 0\)|transparent/.test(color);
    }

    function isShown(element) {
        const style = getComputedStyle(element);
        return style.visibility !== "hidden" && parseFloat(style.opacity) > 0;
    }

    function shouldSkip(element) {
        return element.closest('[aria-hidden="true"], .sr-only, [data-gridline], canvas') !== null;
    }

    // Tabs and table cells carry fills without reading as individual boxes.
    function isBox(element) {
        if (element.matches('[role="tab"], [role="tablist"], [data-slot="tabs-indicator"]')) {
            return false;
        }

        if (/^(TR|TD|TH|TBODY|THEAD|TABLE)$/.test(element.tagName)) {
            return false;
        }

        const style = getComputedStyle(element);
        const hasBorder = BORDER_SIDES.every(
            (side) =>
                parseFloat(style["border" + side + "Width"]) > 0 &&
                isClear(style["border" + side + "Color"]) === false,
        );

        return (
            isClear(style.backgroundColor) === false ||
            hasBorder ||
            (style.boxShadow.length > 0 && style.boxShadow !== "none")
        );
    }

    function findBox(element, container, bounds) {
        let box = null;

        for (
            let ancestor = element;
            ancestor !== null && ancestor !== container;
            ancestor = ancestor.parentElement
        ) {
            const rect = ancestor.getBoundingClientRect();

            if (rect.width < bounds.width - 4 && rect.height <= 64 && isBox(ancestor)) {
                box = ancestor;
            }
        }

        return box;
    }

    function collectItems(container, bounds) {
        const items = [];
        const seenBoxes = new Set();

        function recordBox(box, text) {
            if (seenBoxes.has(box) === true) {
                return;
            }

            seenBoxes.add(box);
            items.push({ r: box.getBoundingClientRect(), kind: "box", t: text });
        }

        function recordText(node) {
            const text = node.textContent.trim();
            const element = node.parentElement;

            if (
                text.length === 0 ||
                element === null ||
                shouldSkip(element) ||
                isShown(element) === false
            ) {
                return;
            }

            const box = findBox(element, container, bounds);

            if (box !== null) {
                recordBox(box, "[" + text.slice(0, 18) + "]");
                return;
            }

            const range = document.createRange();
            range.selectNodeContents(node);
            for (const rect of range.getClientRects()) {
                if (rect.width > 1) {
                    items.push({ r: rect, kind: "text", t: text.slice(0, 18) });
                }
            }
        }

        function recordIcon(element) {
            if (
                shouldSkip(element) ||
                isShown(element) === false ||
                (element.parentElement?.closest("svg") ?? null) !== null
            ) {
                return;
            }

            const rect = element.getBoundingClientRect();
            if (rect.width < 6 || rect.width > 64 || rect.height > 64) {
                return;
            }

            const box = findBox(element.parentElement, container, bounds);
            if (box !== null) {
                recordBox(box, "[icon]");
                return;
            }

            items.push({ r: rect, kind: "icon", t: "<" + element.tagName.toLowerCase() + ">" });
        }

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();

        while (node !== null) {
            recordText(node);
            node = walker.nextNode();
        }

        container
            .querySelectorAll("svg, img, input, [role='checkbox'], [role='switch']")
            .forEach(recordIcon);
        return items;
    }

    function groupRows(items) {
        const rows = [];
        const ordered = items.toSorted(
            (first, second) => first.r.top + first.r.bottom - (second.r.top + second.r.bottom),
        );

        for (const item of ordered) {
            const centre = (item.r.top + item.r.bottom) / 2;
            let row = rows.find((candidate) => Math.abs(candidate.cy - centre) < 6);
            if (row === undefined) {
                row = { cy: centre, items: [] };
                rows.push(row);
            }

            row.items.push(item);
        }

        return rows;
    }

    function leftmost(first, second) {
        if (first.r.left <= second.r.left) {
            return first;
        }

        return second;
    }

    function rightmost(first, second) {
        if (first.r.right >= second.r.right) {
            return first;
        }

        return second;
    }

    function measureRow(row, bounds) {
        const left = row.items.reduce(leftmost);
        const right = row.items.reduce(rightmost);
        const centres = row.items.map((item) => (item.r.top + item.r.bottom) / 2);
        let iconCentre;
        let label;
        let labelPosition;

        if (left.kind === "icon") {
            iconCentre = Math.round((left.r.left + left.r.right) / 2 - bounds.left);
            label = row.items
                .filter((item) => item.kind === "text" && item.r.left > left.r.right)
                .toSorted((first, second) => first.r.left - second.r.left)[0];
        }

        if (label !== undefined) {
            labelPosition = Math.round(label.r.left - bounds.left);
        }

        return {
            y: Math.round(row.cy - bounds.top),
            left: Math.round(left.r.left - bounds.left),
            leftKind: left.kind,
            lt: left.t,
            iconCentre,
            label: labelPosition,
            labelText: label?.t,
            right: Math.round(bounds.right - right.r.right),
            rightKind: right.kind,
            rt: right.t,
            trailCentre: Math.round(bounds.right - (right.r.left + right.r.right) / 2),
            centreSpread: Number((Math.max(...centres) - Math.min(...centres)).toFixed(1)),
        };
    }

    function dominantLine(edges, key, includes = () => true) {
        const counts = {};
        for (const edge of edges) {
            const position = edge[key];

            if (position !== undefined && includes(edge)) {
                counts[position] = (counts[position] ?? 0) + 1;
            }
        }

        const entry = Object.entries(counts).toSorted((first, second) => second[1] - first[1])[0];
        if (entry === undefined) {
            return undefined;
        }

        return Number(entry[0]);
    }

    function isNear(position, line) {
        return line !== undefined && Math.abs(position - line) <= LINE_TOLERANCE;
    }

    function measureOutliers(edge, lines, reachesTrailing) {
        const misses = [];
        let leadingLine = lines.lead;

        if (edge.leftKind === "box") {
            leadingLine = lines.box;
        }

        const isOnLeadingLine = [lines.lead, lines.box, lines.label].some((line) =>
            isNear(edge.left, line),
        );
        if (leadingLine !== undefined && isOnLeadingLine === false) {
            misses.push({
                y: edge.y,
                edge: "leading",
                px: edge.left,
                line: leadingLine,
                item: edge.lt,
            });
        }

        if (edge.label !== undefined && isNear(edge.label, lines.label) === false) {
            misses.push({
                y: edge.y,
                edge: "label",
                px: edge.label,
                line: lines.label,
                item: edge.labelText,
            });
        }

        if (edge.iconCentre !== undefined && isNear(edge.iconCentre, lines.iconCentre) === false) {
            misses.push({
                y: edge.y,
                edge: "icon-column",
                px: edge.iconCentre,
                line: lines.iconCentre,
                item: edge.lt,
            });
        }

        if (
            reachesTrailing(edge) &&
            isNear(edge.right, lines.trailing) === false &&
            isNear(edge.trailCentre, lines.trailCentre) === false
        ) {
            misses.push({
                y: edge.y,
                edge: "trailing",
                px: edge.right,
                line: lines.trailing,
                item: edge.rt,
            });
        }

        if (edge.centreSpread > 1) {
            misses.push({
                y: edge.y,
                edge: "vertical-centre",
                px: edge.centreSpread,
                line: 0,
                item: edge.lt + " … " + edge.rt,
            });
        }

        return misses;
    }

    function drawGuides(bounds, lines) {
        const { lead, box, iconCentre, label, trailing, trailCentre } = lines;
        const guides = [
            [lead, "rgba(255,90,90,0.95)"],
            [iconCentre, "rgba(255,90,90,0.35)"],
            [label, "rgba(255,90,90,0.95)"],
        ];

        if (box !== undefined && box !== lead) {
            guides.splice(1, 0, [box, "rgba(255,90,90,0.5)"]);
        }

        if (trailing !== undefined) {
            guides.push([bounds.width - trailing, "rgba(90,200,255,0.95)"]);
        }

        if (trailCentre !== undefined) {
            guides.push([bounds.width - trailCentre, "rgba(255,190,60,0.6)"]);
        }

        for (const [position, color] of guides) {
            if (position === undefined) {
                continue;
            }

            const guide = document.createElement("div");
            guide.dataset.gridline = "";
            Object.assign(guide.style, {
                position: "fixed",
                left: bounds.left + position + "px",
                top: bounds.top + "px",
                height: bounds.height + "px",
                width: "0",
                borderLeft: "1px dashed " + color,
                zIndex: 2147483646,
                pointerEvents: "none",
            });
            document.body.appendChild(guide);
        }
    }

    function measureContainer(container, bounds, draw) {
        const items = collectItems(container, bounds).filter(
            ({ r }) =>
                r.height > 0 &&
                r.left >= bounds.left - 1 &&
                r.right <= bounds.right + 1 &&
                r.top >= bounds.top - 1 &&
                r.bottom <= bounds.bottom + 1,
        );
        const rows = groupRows(items).map((row) => measureRow(row, bounds));
        // Ragged-right text only contributes if it reaches the trailing quarter.
        const reachesTrailing = (edge) => edge.right < bounds.width / 4;
        const lines = {
            lead: dominantLine(rows, "left", (edge) => edge.leftKind !== "box"),
            iconCentre: dominantLine(rows, "iconCentre"),
            label: dominantLine(rows, "label"),
            box: dominantLine(rows, "left", (edge) => edge.leftKind === "box"),
            trailing: dominantLine(rows, "right", reachesTrailing),
            trailCentre: dominantLine(rows, "trailCentre", reachesTrailing),
        };
        const outliers = rows.flatMap((edge) => measureOutliers(edge, lines, reachesTrailing));

        if (draw === true) {
            drawGuides(bounds, lines);
        }

        const name =
            container.getAttribute("aria-label") ||
            container
                .querySelector("h1, h2, h3, [role='heading']")
                ?.textContent.trim()
                .slice(0, 30) ||
            container.dataset.slot ||
            container.tagName.toLowerCase();

        return {
            container: name,
            x: Math.round(bounds.left),
            w: Math.round(bounds.width),
            lines,
            outliers,
            rows,
        };
    }

    function measureGridlines(options = {}) {
        document.querySelectorAll("[data-gridline]").forEach((element) => element.remove());

        const selector = options.containers || DEFAULT_CONTAINERS;
        const measurements = [];

        for (const container of document.querySelectorAll(selector)) {
            const bounds = container.getBoundingClientRect();
            if (bounds.width <= 120 || bounds.height <= 24 || isShown(container) === false) {
                continue;
            }

            measurements.push(measureContainer(container, bounds, options.draw !== false));
        }

        return measurements;
    }

    Reflect.set(window, "__gridlines", measureGridlines);
})();
