// Loads a page in headless Chromium, runs probe.js, saves a 2x capture with
// the guides drawn and the measurements as JSON, and prints a summary.
//
//   PW_DIR=<dir with playwright> node audit.mjs <url> <outDir> [width=1440] [prep.mjs]
//
// prep.mjs (optional) default-exports async (page) => {} to open a menu,
// switch a tab or sign in before measuring.
//
// Optional environment:
//   CHROMIUM_PATH  use an existing Chromium build instead of Playwright's
//   SCHEME         light | dark (default: no preference)
//   SETTLE_MS      wait after load before measuring (default 3000)
//   CONTAINERS     CSS selectors to measure instead of the defaults
//   TAG            suffix for the output file names
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const [, , url, outDir, width = "1440", prepPath] = process.argv;
if (url === undefined || url.length === 0 || outDir === undefined || outDir.length === 0) {
    process.stderr.write("usage: node audit.mjs <url> <outDir> [width] [prep.mjs]\n");
    process.exit(1);
}

const require = createRequire(join(resolve(process.env.PW_DIR || process.cwd()), "noop.js"));
const { chromium } = require("playwright");
const here = dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({
    viewport: { width: +width, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: process.env.SCHEME || "no-preference",
});
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 240_000 });
await page.waitForTimeout(+(process.env.SETTLE_MS || 3000));
if (prepPath !== undefined && prepPath.length > 0) {
    const prep = (await import(pathToFileURL(resolve(prepPath)).href)).default;
    await prep(page);
}
await page.addScriptTag({ content: readFileSync(join(here, "probe.js"), "utf8") });
const result = await page.evaluate(
    (containers) => Reflect.get(window, "__gridlines")({ containers }),
    process.env.CONTAINERS || "",
);

mkdirSync(outDir, { recursive: true });
const { protocol, pathname } = new URL(url);
let target = pathname;
if (protocol === "file:") {
    target = pathname.split("/").at(-1) ?? "";
}

const targetSlug = target.replace(/\W+/g, "-").replace(/^-|-$/g, "");
let slug = `root-${width}`;
if (targetSlug.length > 0) {
    slug = `${targetSlug}-${width}`;
}

const tag = process.env.TAG;
if (tag !== undefined && tag.length > 0) {
    slug = `${slug}-${tag}`;
}

writeFileSync(join(outDir, `${slug}.json`), JSON.stringify(result, null, 1));
await page.screenshot({ path: join(outDir, `${slug}.png`) });
await browser.close();

function formatPixels(value) {
    if (value === undefined) {
        return "-";
    }

    return `${value}px`;
}

for (const measurement of result) {
    const { lead, box, iconCentre, label, trailing, trailCentre } = measurement.lines;
    process.stdout.write(`\n## ${measurement.container}  x${measurement.x} w${measurement.w}\n`);
    process.stdout.write(
        `   lead ${formatPixels(lead)}  box ${formatPixels(box)}  icon centre ${formatPixels(iconCentre)}  label ${formatPixels(label)}  trailing ${formatPixels(trailing)}  trailing centre ${formatPixels(trailCentre)}\n`,
    );

    for (const outlier of measurement.outliers) {
        process.stdout.write(
            `   MISS y${outlier.y} ${outlier.edge}: ${outlier.px}px vs ${outlier.line}px  ${outlier.item}\n`,
        );
    }
}

process.stdout.write(`\ncapture: ${join(outDir, `${slug}.png`)}\n`);
