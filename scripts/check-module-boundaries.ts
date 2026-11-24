import { readdirSync, readFileSync } from "node:fs";
import { join, posix, sep } from "node:path";
import ts from "typescript";

// Module dependencies point one way. Each module lists the only modules it may import from; the
// map must stay acyclic, so a pair of modules can never depend on each other. `shared/` never
// imports from `modules/`, `db/` only reads the modules' table files, and routes only route.
const SOURCE_DIRECTORY = "src";
const MODULES_PREFIX = "src/modules/";
const SHARED_PREFIX = "src/shared/";
const ROUTES_PREFIX = "src/routes/";
const DB_PREFIX = "src/db/";
const SCHEMA_SUFFIX = ".schema";
const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const GENERATED_FILES = ["routeTree.gen.ts"];
const DB_SCHEMA_INDEX = "src/db/schema";
const MODULE_FOLDERS = ["model", "client", "server", "domain", "application", "ports", "adapters"];
const UI_FOLDERS = ["screens", "components", "hooks"];
const MODULE_LAYOUT_HINT =
    "<module>.schema.ts, model/, client/, server/, ui/screens|components|hooks/ or hexagonal layers";

const ALLOWED_MODULE_DEPENDENCIES: Readonly<Record<string, ReadonlyArray<string>>> = {
    auth: [],
    "video-records": ["auth"],
    preferences: ["auth", "video-records"],
    transcription: ["auth", "video-records"],
    clips: ["auth", "video-records", "transcription"],
    highlights: ["video-records", "transcription", "clips"],
    processing: ["video-records", "transcription", "clips", "highlights"],
    videos: ["auth", "video-records", "preferences", "transcription", "clips", "processing"],
    studio: ["auth", "video-records", "transcription", "clips", "processing", "videos"],
    overview: ["auth", "video-records", "transcription", "clips", "videos"],
    shell: ["auth", "preferences", "videos"],
    admin: ["auth", "video-records", "clips", "videos"],
};

interface AllowedException {
    from: string;
    to: string;
    reason: string;
}

// File-level imports against the map, each with the reason it cannot be inverted cheaply.
const ALLOWED_EXCEPTIONS: ReadonlyArray<AllowedException> = [
    {
        from: "src/modules/auth/server/auth.server.ts",
        to: "src/modules/video-records/server/delete-user-videos.server",
        reason: "Better Auth's delete-user hooks are fixed when the auth instance is built at import",
    },
    {
        from: "src/modules/auth/server/auth.server.ts",
        to: "src/modules/admin/server/record-admin-action.server",
        reason: "The browser starts and ends impersonation straight through Better Auth, so only its session hooks, fixed at import, see it",
    },
    {
        from: "src/modules/processing/server/save-downloaded-source.server.ts",
        to: "src/modules/videos/server/storage-quota.server",
        reason: "A download's size is only known in the worker, which checks it against the same quota",
    },
    {
        from: "src/modules/processing/server/save-downloaded-source.server.ts",
        to: "src/modules/videos/server/video-start-transaction.server",
        reason: "The download is saved under the same per-user lock as uploads, so both see each other",
    },
];

// Routes only route: the router, React, module screens and handlers, and the API wrapper.
const ROUTE_IMPORT_PREFIXES = [
    "@tanstack/react-router",
    "@tanstack/react-query",
    "react",
    "#/modules/",
    "#/shared/server/handle-api-route.server",
    "#/styles.css?url",
];

interface ImportEdge {
    file: string;
    line: number;
    specifier: string;
    /** Repository path of the imported file, without extension; null for packages. */
    target: string | null;
}

interface Violation {
    edge: ImportEdge;
    reason: string;
}

function toPosixPath(path: string): string {
    return path.split(sep).join("/");
}

function isSourceFile(name: string): boolean {
    if (GENERATED_FILES.includes(name) === true) {
        return false;
    }

    return SOURCE_EXTENSIONS.some((extension) => name.endsWith(extension));
}

function listSourceFiles(directory: string): Array<string> {
    const entries = readdirSync(directory, { withFileTypes: true });

    return entries.flatMap((entry) => {
        const path = join(directory, entry.name);

        if (entry.isDirectory() === true) {
            return listSourceFiles(path);
        }

        if (isSourceFile(entry.name) === false) {
            return [];
        }

        return [toPosixPath(path)];
    });
}

function toScriptKind(path: string): ts.ScriptKind {
    if (path.endsWith(".tsx") === true) {
        return ts.ScriptKind.TSX;
    }

    return ts.ScriptKind.TS;
}

function stripExtension(path: string): string {
    return path.replace(/\.tsx?$/, "");
}

function resolveTarget(file: string, specifier: string): string | null {
    const path = specifier.split("?")[0] ?? specifier;

    if (path.startsWith("#/") === true) {
        return stripExtension(`${SOURCE_DIRECTORY}/${path.slice(2)}`);
    }

    if (path.startsWith(".") === true) {
        return stripExtension(posix.join(posix.dirname(file), path));
    }

    return null;
}

/** The module specifier of an import, export, dynamic import() or import("...") type. */
function readSpecifier(node: ts.Node): ts.Expression | undefined {
    if (ts.isImportDeclaration(node) === true || ts.isExportDeclaration(node) === true) {
        return node.moduleSpecifier;
    }

    if (
        ts.isCallExpression(node) === true &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
        return node.arguments[0];
    }

    if (ts.isImportTypeNode(node) === true && ts.isLiteralTypeNode(node.argument) === true) {
        return node.argument.literal;
    }

    return undefined;
}

function readImports(file: string): Array<ImportEdge> {
    const content = readFileSync(file, "utf8");
    const scriptKind = toScriptKind(file);
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, scriptKind);
    const edges: Array<ImportEdge> = [];

    function visit(node: ts.Node): void {
        const specifierNode = readSpecifier(node);

        if (specifierNode !== undefined && ts.isStringLiteral(specifierNode) === true) {
            const specifier = specifierNode.text;
            const position = sourceFile.getLineAndCharacterOfPosition(specifierNode.getStart());
            const target = resolveTarget(file, specifier);
            edges.push({ file, line: position.line + 1, specifier, target });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return edges;
}

function moduleOf(path: string): string | null {
    if (path.startsWith(MODULES_PREFIX) === false) {
        return null;
    }

    const moduleName = path.slice(MODULES_PREFIX.length).split("/")[0];

    if (moduleName === undefined || moduleName.length === 0) {
        return null;
    }

    return moduleName;
}

function findException(edge: ImportEdge): AllowedException | undefined {
    return ALLOWED_EXCEPTIONS.find(
        (exception) => exception.from === edge.file && exception.to === edge.target,
    );
}

function checkModuleImport(edge: ImportEdge, usedExceptions: Set<AllowedException>): string | null {
    const sourceModule = moduleOf(edge.file);
    const targetModule = moduleOf(edge.target ?? "");

    if (sourceModule === null || targetModule === null || sourceModule === targetModule) {
        return null;
    }

    const allowedModules = ALLOWED_MODULE_DEPENDENCIES[sourceModule];

    if (allowedModules === undefined) {
        return `module "${sourceModule}" is missing from the direction map`;
    }

    if (allowedModules.includes(targetModule) === true) {
        return null;
    }

    const exception = findException(edge);

    if (exception !== undefined) {
        usedExceptions.add(exception);
        return null;
    }

    return `"${sourceModule}" may not import from "${targetModule}"`;
}

function checkSharedImport(edge: ImportEdge): string | null {
    const target = edge.target ?? "";

    if (edge.file.startsWith(SHARED_PREFIX) === false) {
        return null;
    }

    if (target.startsWith(MODULES_PREFIX) === true || target.startsWith(ROUTES_PREFIX) === true) {
        return "shared code may not import from modules or routes";
    }

    return null;
}

function checkDatabaseImport(edge: ImportEdge): string | null {
    const target = edge.target ?? "";

    if (edge.file.startsWith(DB_PREFIX) === false || target.startsWith(MODULES_PREFIX) === false) {
        return null;
    }

    if (target.endsWith(SCHEMA_SUFFIX) === true) {
        return null;
    }

    return "db/ may only import the modules' *.schema.ts table files";
}

function checkSchemaIndexImport(edge: ImportEdge): string | null {
    if (edge.target !== DB_SCHEMA_INDEX || edge.file.startsWith(DB_PREFIX) === true) {
        return null;
    }

    return "import tables from their <module>.schema.ts, not from db/schema.ts";
}

function checkRouteImport(edge: ImportEdge): string | null {
    const specifier = edge.specifier;

    if (edge.file.startsWith(ROUTES_PREFIX) === false) {
        return null;
    }

    if (ROUTE_IMPORT_PREFIXES.some((prefix) => specifier.startsWith(prefix)) === true) {
        return null;
    }

    return "routes only route; move this into a module";
}

function checkEdge(edge: ImportEdge, usedExceptions: Set<AllowedException>): Array<Violation> {
    const reasons = [
        checkModuleImport(edge, usedExceptions),
        checkSharedImport(edge),
        checkDatabaseImport(edge),
        checkSchemaIndexImport(edge),
        checkRouteImport(edge),
    ];

    return reasons.flatMap((reason) => {
        if (reason === null) {
            return [];
        }

        return [{ edge, reason }];
    });
}

function findUnmappedModules(): Array<string> {
    const entries = readdirSync(MODULES_PREFIX, { withFileTypes: true });

    return entries
        .filter((entry) => entry.isDirectory() === true)
        .filter((entry) => ALLOWED_MODULE_DEPENDENCIES[entry.name] === undefined)
        .map((entry) => `module "${entry.name}" is missing from the direction map`);
}

function findUnknownDependencies(): Array<string> {
    const moduleNames = Object.keys(ALLOWED_MODULE_DEPENDENCIES);

    return Object.entries(ALLOWED_MODULE_DEPENDENCIES).flatMap(([moduleName, dependencies]) =>
        dependencies
            .filter((dependency) => moduleNames.includes(dependency) === false)
            .map((dependency) => `"${moduleName}" lists unknown module "${dependency}"`),
    );
}

/** Depth-first search; returns the first cycle found as a path of module names. */
function findCycle(moduleName: string, path: Array<string>): Array<string> | null {
    if (path.includes(moduleName) === true) {
        return [...path.slice(path.indexOf(moduleName)), moduleName];
    }

    const dependencies = ALLOWED_MODULE_DEPENDENCIES[moduleName] ?? [];

    for (const dependency of dependencies) {
        const cycle = findCycle(dependency, [...path, moduleName]);

        if (cycle !== null) {
            return cycle;
        }
    }

    return null;
}

function findMapProblems(): Array<string> {
    const problems = [...findUnmappedModules(), ...findUnknownDependencies()];

    for (const moduleName of Object.keys(ALLOWED_MODULE_DEPENDENCIES)) {
        const cycle = findCycle(moduleName, []);

        if (cycle !== null) {
            return [...problems, `the direction map has a cycle: ${cycle.join(" -> ")}`];
        }
    }

    return problems;
}

function isAllowedModulePath(moduleName: string, relativePath: string): boolean {
    const segments = relativePath.split("/");
    const folder = segments[0] ?? "";
    const uiFolder = segments[1] ?? "";

    if (segments.length === 1) {
        return relativePath === `${moduleName}${SCHEMA_SUFFIX}.ts`;
    }

    if (folder === "ui") {
        return segments.length > 2 && UI_FOLDERS.includes(uiFolder) === true;
    }

    return MODULE_FOLDERS.includes(folder) === true;
}

/** Every module file lives in the folder for its kind; only the table file sits at the root. */
function findLayoutProblems(): Array<string> {
    const files = listSourceFiles(MODULES_PREFIX.slice(0, -1));

    return files.flatMap((file) => {
        const moduleName = moduleOf(file) ?? "";
        const relativePath = file.slice(`${MODULES_PREFIX}${moduleName}/`.length);

        if (isAllowedModulePath(moduleName, relativePath) === true) {
            return [];
        }

        return [`${file} is outside the module layout (${MODULE_LAYOUT_HINT})`];
    });
}

function findUnusedExceptions(usedExceptions: Set<AllowedException>): Array<string> {
    return ALLOWED_EXCEPTIONS.filter((exception) => usedExceptions.has(exception) === false).map(
        (exception) => `unused exception ${exception.from} -> ${exception.to}; remove it`,
    );
}

function reportViolation(violation: Violation): void {
    const edge = violation.edge;
    console.error(`${edge.file}:${edge.line}  "${edge.specifier}": ${violation.reason}`);
}

const usedExceptions = new Set<AllowedException>();
const edges = listSourceFiles(SOURCE_DIRECTORY).flatMap(readImports);
const violations = edges.flatMap((edge) => checkEdge(edge, usedExceptions));
const problems = [
    ...findMapProblems(),
    ...findUnusedExceptions(usedExceptions),
    ...findLayoutProblems(),
];

if (violations.length > 0 || problems.length > 0) {
    violations.forEach(reportViolation);
    problems.forEach((problem) => console.error(problem));
    console.error(
        `\n${violations.length + problems.length} module boundary problem(s). See "Folder structure" in CLAUDE.md.`,
    );
    process.exit(1);
}

console.info(`Module boundaries hold (${edges.length} imports checked).`);
