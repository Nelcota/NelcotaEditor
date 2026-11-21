import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

// Interface copy never uses em or en dashes (the person asked for their removal twice).
// Only text a user can see is checked: string literals, template text and JSX text.
// Comments and regular expressions are not copy and are skipped.
const SOURCE_DIRECTORY = "src";
const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const GENERATED_FILES = ["routeTree.gen.ts"];
const DASH_PATTERN = /[–—]/;

interface DashFinding {
    file: string;
    line: number;
    text: string;
}

function listSourceFiles(directory: string): Array<string> {
    const entries = readdirSync(directory, { withFileTypes: true });

    return entries.flatMap((entry) => {
        const path = join(directory, entry.name);

        if (entry.isDirectory() === true) {
            return listSourceFiles(path);
        }

        if (GENERATED_FILES.includes(entry.name) === true) {
            return [];
        }

        if (SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension)) === false) {
            return [];
        }

        return [path];
    });
}

function isCopyNode(node: ts.Node): node is ts.LiteralLikeNode {
    const copyKinds = [
        ts.SyntaxKind.StringLiteral,
        ts.SyntaxKind.NoSubstitutionTemplateLiteral,
        ts.SyntaxKind.TemplateHead,
        ts.SyntaxKind.TemplateMiddle,
        ts.SyntaxKind.TemplateTail,
        ts.SyntaxKind.JsxText,
    ];

    return copyKinds.includes(node.kind);
}

function toScriptKind(path: string): ts.ScriptKind {
    if (path.endsWith(".tsx") === true) {
        return ts.ScriptKind.TSX;
    }

    return ts.ScriptKind.TS;
}

function findDashes(path: string): Array<DashFinding> {
    const content = readFileSync(path, "utf8");
    const scriptKind = toScriptKind(path);
    const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, scriptKind);
    const findings: Array<DashFinding> = [];

    function visit(node: ts.Node): void {
        if (isCopyNode(node) === true && DASH_PATTERN.test(node.text) === true) {
            const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            findings.push({ file: path, line: position.line + 1, text: node.text.trim() });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return findings;
}

const findings = listSourceFiles(SOURCE_DIRECTORY).flatMap(findDashes);

if (findings.length > 0) {
    for (const finding of findings) {
        const location = `${relative(".", finding.file)}:${finding.line}`;
        console.error(`${location}  ${finding.text.slice(0, 80)}`);
    }

    console.error(
        `\n${findings.length} em/en dash(es) in interface copy. Use a comma, a colon, a period, "a" or "·" instead.`,
    );
    process.exit(1);
}

console.info("No em/en dashes in interface copy.");
