# Project Guidelines

## Communication

- Always talk to me in Portuguese (Brazil).
- Code, comments, identifiers, and everything in git are in English. UI text is in Portuguese
  (Brazil).
- Be direct. No recap of what you did unless I ask; no filler.

## Stack and commands

Language: TypeScript.

- Runtime / framework: Bun + TanStack Start (React 19 with React Compiler), Tailwind CSS v4
- Database: PostgreSQL (latest stable major) via Docker Compose, Drizzle ORM
- Auth: Better Auth
- Data and UI: TanStack Query, Router, Form, Table and Virtual; Zod; date-fns
- Background jobs: pg-boss, consumed by a worker in `scripts/worker.ts`
- Logging: pino. Error tracking: GlitchTip (self-hosted, through the Sentry SDK)
- Tests: Vitest + Testing Library; Playwright + `@axe-core/playwright`
- Formatting and linting: oxfmt; oxlint with `oxlint-tsgolint` for type-aware rules
- Package manager: bun
- Run everything locally: `bun run local` (the `nelcota` entry in `.claude/launch.json`). It
  starts Docker Desktop if needed, the services, the migrations, a rebuilt worker and the dev
  server. Do not run those steps by hand one at a time.
- Database up: `docker compose up -d`
- Migrations: `bun run db:generate`, then `bun run db:migrate`
- Dev: `bun run dev` (web server; the worker runs in its own Docker Compose service, see Async)
- Build: `bun run build`
- Typecheck: `bun run typecheck`
- Format: `bun run format`. Lint: `bun run lint` (`oxlint --type-aware`)
- All checks at once: `bun run check` (format check, lint, types, copy rules, module boundaries,
  tests). The pre-commit hook in `.githooks/` runs it.
- Test: `bun run test` (Vitest), `bun run test:e2e` (Playwright + axe)

## Control flow

- Never use `else` or `else if`. Anywhere.
- Never use the ternary operator (`a ? b : c`).
- Never use the `!` negation operator. Use explicit comparisons:
  `value === null`, `isActive === false`, `items.length === 0`.
- `!==` is allowed (it is a comparison, not a negation): `world !== null`.
- Always use braces in `if` blocks, even for a single statement. The body goes on its own line.
- Leave a blank line after each `if` block, before the next statement. No blank line right after
  `{`.
- Use guard clauses with early returns at the start of functions.
- When there are many branches, prefer a lookup map of values or functions.
- In JSX, render conditionally with `&&` and an explicit comparison
  (`{items.length > 0 && <List />}`, never `{items.length && ...}`). For two alternatives, use an
  early return or extract a subcomponent.

## Local variables

- At the start of a function, extract the objects you will use into local `const` variables.
- Never repeat the same property/getter chain; read it once and reuse the variable.
- Avoid long chains (`a.b.c.d`); break them into named locals.
- Do not create variables for boolean conditions; keep conditions inline in the `if`.

```ts
// Bad
function sendShippingNotice(order: Order): void {
    if (order.customer.address === null) {
        return;
    }

    notifyCustomer(order.customer.email, order.customer.address.city);
}

// Good
function sendShippingNotice(order: Order): void {
    const customer = order.customer;
    const address = customer.address;

    if (address === null) {
        return;
    }

    notifyCustomer(customer.email, address.city);
}
```

## Strict TypeScript

- `strict: true` in `tsconfig.json`. Never turn it off.
- Never use `any`. Use `unknown` and narrow it (with Zod for external data).
- Never use `as` to force a type. Validate or narrow instead. `as const` is allowed. To check
  that a value matches a type without changing it, use `satisfies`.
- Never use the non-null assertion (`value!`). Write an explicit null check with a guard clause.
- Always type function parameters and return values.

## Null and empty values

- Enable `noUncheckedIndexedAccess` in `tsconfig.json`; index access returns `T | undefined`.
- Use `null` for intentional absence in your own code. `undefined` only comes from optional
  props/params and library returns (`.find()`, index access).
- Defaults with `??`, never `||` (`||` replaces `0` and `""`).
- Required strings in Zod: `z.string().trim().min(1)`.

## Defensive checks

Validate at the start of every exported function what its types allow but the logic forbids.
Do not re-check what TypeScript already guarantees.

- null / undefined: `value === null`, `value === undefined`
- Empty values: `text.trim().length === 0`, `items.length === 0`, `Object.keys(obj).length === 0`
- Numbers: `Number.isNaN(n) === true`, `Number.isFinite(n) === false`, bounds
  (`n < MIN_VALUE`, `n > MAX_VALUE`), zero when used as a divisor
- Array index and length bounds (off-by-one)
- Fail fast: return early when the case is expected; throw a clear, specific error when it means
  a bug or invalid input. Never fail silently.

## Naming

- Names must reveal intent; no abbreviations (`customerAddress`, not `custAddr`).
- Types and classes: PascalCase nouns (`InvoiceTotal`). Components: PascalCase (`InvoiceList`).
  Functions and variables: camelCase; functions are verbs (`calculateTotal`). Hooks start with
  `use`.
- Booleans: `is`/`has`/`can`/`should` prefix (`isActive`, `hasPermission`).
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`). No magic numbers or strings.
- No generic names: `data`, `info`, `temp`, `manager`, `helper`, `utils`. When a library returns
  one, rename it: `const { data: invoices } = useQuery(...)`.

## File organization

- One exported component, hook or class per file. Small private helpers used only there may stay.
- File names in kebab-case: `invoice-list.tsx`, `use-invoices.ts`, `calculate-total.ts`.
- Named exports only, except where the framework requires otherwise.
- No barrel files (`index.ts` that only re-exports); import from the file that defines it.

## Comments

- Comment the _why_, never the _what_. Good code explains what it does by itself.
- No JSDoc that repeats the signature, no banner comments (`// ===== Helpers =====`), no comments
  narrating the change (`// added`, `// fixed`).
- Never leave commented-out code; git keeps the history.

## Formatting and linting (Oxc)

Use the Oxc toolchain. Do not use Prettier or ESLint.

- `oxfmt`, `oxlint` and `oxlint-tsgolint` are devDependencies with pinned versions. Scripts:
  `bun run format`, `bun run format:check`, `bun run lint`.
- The style lives in the oxfmt config (`.oxfmtrc.json`), not only here: 4-space indentation,
  semicolons, double quotes, LF line endings, print width 100. Generated files
  (`routeTree.gen.ts`, migrations) are ignored.
- The lint rules live in `.oxlintrc.json`. It enforces, among others:
  no ternary, no `else` after `return`, no negated conditions, `curly`, `eqeqeq`, no `console`
  outside `scripts/`, max 3 parameters, max depth 2, no `any`, no `as`, no `value!`, no floating
  promises (`void` included), no array index keys, hook rules, no import cycles, no default
  exports outside `*.config.ts`, and accessibility rules for JSX. The rules above that lint cannot
  check (no `!`, no `else` at all, locals at the top) still apply.
- `.editorconfig` matches the style (4 spaces, LF, final newline, UTF-8). Editors format on save.
- A Claude Code hook (`.claude/settings.json`, running `scripts/format-edited-file.ts`) formats
  every file right after it is edited; never disable it.
- Never hand-format against the formatter, never disable a lint rule, and never add comments that
  skip formatting or linting.

## Folder structure

Modular monolith: one folder per business context under `src/modules/`, named in kebab-case
(`billing`, `user-profile`). Create a new module only for a new business context; otherwise
extend the existing one.

- `src/routes/`: routing only (`beforeLoad`, `loader`, `head`, search validation). No logic; it
  renders screens from modules.
- `src/modules/<module>/`:
    - `<module>.schema.ts`: its Drizzle tables. The only file allowed at the module root.
    - `model/`: code shared by client and server (Zod schemas, types, constants, error classes).
    - `ui/screens/`, `ui/components/`, `ui/hooks/`.
    - `client/`: browser-only code.
    - `server/`: server functions (`createServerFn`) in plain `.ts` files, since the client imports
      them for the RPC call, and server-only code in `*.server.ts` files. TanStack Start fails the
      build if client code imports a `.server.ts` file, so types the client needs never live there.
- `src/shared/`: `ui/` (generic components with no business rules), `server/` (cross-cutting
  server infrastructure: env, email, logger, health check), and topic folders for generic code
  that runs on both sides (`money/`, `dates/`, `errors/`).
- `src/db/`: the database client and `schema.ts`, which only re-exports each module's tables.
  Modules import only the client from `src/db/`, never `schema.ts`; tables are imported straight
  from their `<module>.schema.ts`.
- Dependencies point one way: `routes → modules → shared`. `shared` never imports from
  `modules`.
- A module may import another module's server functions, `model/`, `client/` and tables, never
  its `ui/` internals. When a screen shows another module's UI, the route composes them: it
  renders the piece and passes it in as a prop (`<AccountScreen profileRows={<ProfileRows />} />`).
  A piece several modules need either becomes generic in `src/shared/ui/` (the business values
  come from the owning module's `model/`) or belongs to the one module that uses it. Only the
  owning module writes (insert, update, delete) to its tables; other
  modules may reference them (foreign keys) and read them (joins). No circular imports between
  modules.
- Hexagonal layers (`domain/`, `application/`, `ports/`, `adapters/`) only inside modules that
  talk to external systems (payments, third-party APIs) or hold real business rules. They sit
  beside `ui/` and `server/`; server functions in `server/` call `application/`. Add a port only
  when there are two adapters, or a second one is close.
- Import alias: `#/` only.

Every file lives in the folder for its kind; no loose files.

- `src/` root holds only framework entry files (`router.tsx`, `styles.css`, generated files).
- Project root holds only config files. Scripts (including the worker) go in `scripts/`,
  end-to-end tests in `e2e/`.
- Folders are named by topic or kind, never `utils/`, `helpers/`, `lib/`, `common/` or `misc/`.
- Errors specific to a module go in its `model/`; generic ones in `src/shared/errors/`.
- Tests are the exception: they sit next to the file they test.

## Small units and SRP

- Every function, component, hook and class has exactly one responsibility.
- If you need "and" to describe it, split it.
- Functions and hooks: aim for under ~20 lines. Components: aim for under ~100 lines; extract a
  subcomponent or a hook when one mixes concerns (data fetching, state, layout).
- Classes (rare; only where state and behavior truly belong together): aim for under ~150 lines.
- Max 3 parameters per function; group more into an object. Components take one props object.
- Max 2 levels of nesting inside a function.
- Prefer composition over inheritance. No inheritance chains.
- Prefer pure functions. Keep side effects (database, fetch, storage) at the edges: server
  functions, hooks, adapters.
- Never mutate parameters; return new values. Local values you created may be mutated.
- Duplicate once; extract on the third repetition (rule of three).

## Dependencies and object creation

Dependency injection:

- No DI containers, decorators or service locators. ES modules already wire the code: import
  what you need.
- Inject a dependency (pass it as a parameter) only through a port, in hexagonal modules: the
  application function receives its ports in one object (`chargeOrder({ paymentGateway }, order)`)
  and the server function passes the real adapter.
- Without a port, import the adapter directly; tests replace it with `vi.mock`.

Objects:

- Plain exported functions by default. No stateless "service" classes, no classes with only
  static methods, no `new` just to call one method.
- Create expensive objects once, at module scope, and reuse them: database client, SDK clients,
  `Intl.NumberFormat` / `Intl.DateTimeFormat`, regexes. Never one per request or per call.
- Server module scope holds only shared, stateless things. Never store request or user data
  there; every user shares it.
- No DTOs, mappers or wrapper types that copy fields one to one. Derive types with `z.infer` and
  Drizzle's `$inferSelect` / `$inferInsert`, and pass the values on.
- Values that do not depend on props or state live at module scope, not inside the component.
- Do not copy data you only read. A function may mutate a local value it created (`push`,
  `Map.set`); `reduce` with a spread (`{ ...acc }`) on every step is quadratic.
- Never wrap an async API in `new Promise`.

## Simplicity first

- Always pick the simplest solution that solves the current problem.
- No over-engineering: no abstractions, interfaces, factories, or layers "for the future" (YAGNI).

## Libraries before hand-rolling

Before building something non-trivial, ask yourself: "Am I going to build this by hand? Or is
there a well-known library that already does it?" The chosen libraries are listed in Stack.

- Trivial logic (a few lines): write it by hand.
- Solved, non-trivial problems (caching, routing, forms, dates, auth, retries): use a known library.
- Always ask me before installing any new dependency, explaining why it is worth it.

## Always up to date

- When adding a dependency, use its latest stable version; never beta or canary in production.
  Upgrade existing dependencies only when I ask.
- Before using a library API, check the installed version in `package.json` and that version's
  current docs. Never write library APIs from memory; they change.
- Never use deprecated APIs. When you find one, replace it.
- Prefer modern platform features over libraries and polyfills: `structuredClone`,
  `Object.groupBy`, `Array.prototype.at`, `Intl`, `<dialog>`, the Popover API.

## Validation with Zod

Use Zod to validate data that comes from outside the code:

- API requests and responses, user input, files, environment variables, external services.
- Define the schema once and derive the type from it with `z.infer`; never write the type twice.
- Server function input: pass the schema to the server function's input validator; do not
  validate again inside it.
- Everywhere else (external APIs, files, env), use `safeParse` and handle the failure with a guard
  clause:

```ts
const result = userSchema.safeParse(input);

if (result.success === false) {
    throw new InvalidUserInputError(result.error.issues);
}

const user = result.data;
```

Before writing validation, ask yourself:

- "Does Zod fit here? Should we use Zod here?"
- Yes: data crosses a boundary (external, untrusted, or unknown shape).
- No: data is internal and already typed; a simple explicit check is enough. Do not wrap trusted
  internal data in schemas.

## Errors

- Never leave an empty `catch`. Never swallow errors silently.
- Catch an error only if you can handle it meaningfully; otherwise let it propagate.
- Throw specific errors with clear messages, not generic strings.
- When wrapping an error, keep the original:
  `throw new PaymentFailedError("...", { cause: error })`.
- Inside `try`, write `return await`; returning a bare promise skips the `catch`.

## Async

- Use `async`/`await`; no `.then()` chains. No `async` on a function that never awaits.
- Every promise is awaited or returned. No floating promises, no `void promise`.
- Never `forEach(async ...)`. Independent items: `await Promise.all(items.map(...))`. Items that
  depend on the previous one: `for...of` with `await`.
- `Promise.all` when every result is required; `Promise.allSettled` when partial results are fine.
- Never `Promise.all` over an unbounded list. Database: one query (`inArray`) instead of a query
  per item. External APIs: limit concurrency.
- Every external call has a timeout (`AbortSignal.timeout(ms)`). Pass on the `signal` that
  TanStack Query and route loaders provide.
- Inside `db.transaction`, every query uses `tx`, never `db`. No network calls (APIs, email)
  inside a transaction.
- Work that must not block the response goes to a pg-boss job, never an un-awaited promise. The
  worker (`scripts/worker.ts`) consumes the jobs. It runs as its own Docker Compose service in
  development and production, separate from the web server: it handles files from the internet,
  so it gets only the environment variables it needs and no root rights (`bun run local`
  rebuilds it).
- Retry only idempotent operations, with backoff. Mutations do not retry; payments use an
  idempotency key.
- In React, async actions go through `useMutation` (pending state, no double submit), not
  handlers with a hand-made loading `useState`.

## PostgreSQL

Schema:

- Always the latest stable PostgreSQL major version. Pin the major in Docker Compose
  (`postgres:<major>`), never `latest`; a major upgrade needs a data migration, so do it only when I
  ask.
- Primary keys are UUID v7: ``uuid().primaryKey().default(sql`uuidv7()`)``.
- Every table has `created_at` and `updated_at` as `timestamptz` (`withTimezone: true`), stored
  in UTC; `updated_at` uses `$onUpdate(() => new Date())`.
- Tables and columns in snake_case (Drizzle `casing: "snake_case"`), table names plural.
- Money as integer cents: `bigint({ mode: "number" })`, never `float` or `real`.
- `text` instead of `varchar(n)`; enforce length with `CHECK` and Zod.
- Closed sets of values as `text` with a `CHECK` constraint, not Postgres enums (values cannot be
  removed).
- `jsonb` only for truly unstructured data, never to skip modeling.
- Tables owned by Better Auth keep its own conventions (IDs, column names); these schema rules
  apply to our tables.

Integrity (the database is the last line of defense, not Zod):

- Columns are `NOT NULL` unless absence has a meaning.
- Enforce rules with `UNIQUE`, `CHECK` and foreign keys. Every foreign key states `onDelete`.

Queries:

- Only through Drizzle or its `sql` template tag; never `sql.raw` with external input.
- Operations that write more than once run in `db.transaction`.
- No read-then-write races: use atomic updates (`set stock = stock - 1 where stock > 0`),
  `onConflictDoUpdate` for upserts, `.for("update")` when a read must lock.
- No N+1 queries (use joins or Drizzle relational queries); select only the needed columns.
- Index foreign keys (Postgres does not) and columns used in `WHERE` and `ORDER BY`. Check slow
  queries with `EXPLAIN ANALYZE` before adding indexes.
- Paginate every list; keyset (cursor) pagination for large or infinite lists, not `OFFSET`.

Migrations:

- Migrations live in `drizzle/` (Drizzle's default `out` folder).
- Always `bun run db:generate`, then review the generated SQL before `bun run db:migrate`.
  A rename can come out as drop + add, which loses data.
- Never edit a migration that has been applied; create a new one. Never `db:push` in production.
- Breaking changes in steps: add the column as nullable, backfill, then set `NOT NULL`.
- Large tables: create indexes with `CONCURRENTLY` (edit the generated SQL).
- In production the app connects with a user that has no superuser or DDL rights.

## Security

Treat everything the client sends as untrusted, even if the frontend already validated it.

Assume an attacker:

- Anyone can call any endpoint directly (curl, Bruno, Postman, scripts) with any headers,
  cookies and body. User-Agent checks, CORS, hidden buttons, disabled inputs and minified code
  are not security; every rule is enforced on the server.
- Lists cap the page size in the Zod schema (`limit` with a `.max()`), so no one scrapes
  everything in one call.
- Sign-in, sign-up and password reset answer the same way whether the email exists or not.
  Better Auth does this for sign-up only with `requireEmailVerification: true`; keep it on, and
  use `onExistingUserSignUp` to email the account owner instead of returning an error.
- Source maps are uploaded to GlitchTip and removed from the build output; they are never served.
- `/health` returns only the status, never versions, hostnames or database details.
- Public forms use Cloudflare Turnstile, verified on the server, besides the honeypot. Auth
  routes (sign-up, sign-in, password reset) use Better Auth's `captcha` plugin with
  `provider: "cloudflare-turnstile"`. Other public forms (contact) verify through an adapter
  that tests replace. `.env.test` has no Turnstile secret, and the captcha plugin is off in
  tests. The CSP allows `https://challenges.cloudflare.com`.
- In production the app sits behind Cloudflare, with WAF and rate limiting rules on every route
  and stricter ones on auth routes. The origin server accepts traffic only from Cloudflare
  (Cloudflare Tunnel, or a firewall that allows only Cloudflare's IP ranges), so no one bypasses
  those rules.
- The client IP comes only from `CF-Connecting-IP`, never `X-Forwarded-For` or any other header a
  client can set. Better Auth reads it through `advanced.ipAddress.ipAddressHeaders`.
- Every non-GET request (server functions and server routes) passes a global request middleware
  in `src/start.ts` that rejects it unless its `Origin` header matches the app's full origin
  (scheme, host and port). `SameSite=Lax` does not block requests from sibling subdomains.
  Webhook routes are the exception: providers send no `Origin`, so they skip this check and rely
  on the signature check alone.

Authentication and authorization:

- Every server function is a public HTTP endpoint. Each one checks the session and permissions
  itself; route guards (`beforeLoad`) are only UX.
- Get the user from the session, never from the request. Never trust IDs, roles, prices, totals
  or flags (`isAdmin`, `isPaid`) sent by the client; recalculate on the server.
- Every query on user-owned data filters by the owner (`where(eq(invoices.userId, user.id))`).
  Another user's resource returns 404, not 403.
- Never pass client input straight to `.set()` or `.values()`; pick the allowed fields and set
  ownership fields from the session.
- Never roll your own auth, password hashing or crypto; use Better Auth and its defaults
  (httpOnly, Secure, SameSite cookies).
- Rate-limit every endpoint per IP with Cloudflare rules, not only sign-in, sign-up and password
  reset. Auth routes also use Better Auth's rate limiter with `storage: "database"`, so limits
  survive restarts. Expensive endpoints also need a per-user limit in the app; that needs a
  library, so ask me before adding one.

Input and output:

- Validate every request with Zod (body, params, query, headers).
- Responses return only the fields the client needs; never whole rows (password hashes, tokens).
- URLs from users are validated as `http`/`https` before use in `href` (blocks `javascript:`).
  Redirect targets (`?redirect=`) must be relative paths.
- Server-side fetches of user-provided URLs only to an allowlist of hosts (SSRF).
- Uploads: check size and real file type, store under a generated name, never a user-given path.
- Webhooks: verify the signature before trusting the payload; process them idempotently.
- Error responses never expose internal details (stack traces, SQL, file paths); those go to the
  server log. Per-field validation messages are fine.
- Never `dangerouslySetInnerHTML` with unsanitized content.

Secrets and infrastructure:

- Environment variables are validated with Zod at startup, in `src/shared/server/`. Secrets never
  use the `VITE_` prefix; Vite ships those to the browser.
- Tokens come from `crypto.randomUUID()` or `crypto.getRandomValues()`, never `Math.random()`.
  Compare secrets with `crypto.timingSafeEqual`.
- Security headers on every response: CSP (with `frame-ancestors`), HSTS,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- In production, the database port is never published (`ports:`); Docker bypasses the firewall.
- Run `bun audit` before adding a dependency and fix high or critical findings.

## React

- Function components only.
- Do not use `useEffect` for derived values (compute during render) or for fetching (loaders,
  TanStack Query). Effects only sync with external systems (DOM APIs, subscriptions).
- Where state lives: server state in TanStack Query, URL state in search params (validated with
  Zod in the route), form state in TanStack Form, local UI state in `useState`. No global store
  unless all of these fail.
- Keys are stable IDs, never the array index.
- React 19 APIs: `ref` is a regular prop (no `forwardRef`), `<Context>` instead of
  `<Context.Provider>`.
- Every screen that loads data handles loading, error and empty states.
- Set `defaultErrorComponent`, `defaultPendingComponent` and `defaultNotFoundComponent` on the
  router; override per route only when a screen needs its own.

## Error and not-found pages

Not found (404):

- The root route has a `notFoundComponent`; the router's built-in "Not Found" text never shows.
  Never use the deprecated `NotFoundRoute` / `notFoundRoute` option.
- A missing resource is a 404, not an empty screen: the loader (or `beforeLoad`) throws
  `notFound()` when the server function finds nothing, including another user's resource.
- Throw `notFound()` from the route, not from inside components. Data passed with
  `notFound({ data })` is `unknown`; narrow it with Zod before use.
- The page keeps the app layout (header, nav), has its own `<h1>` and `head` title
  ("Página não encontrada"), one line saying what happened, and a `<Link>` to a useful place
  (home or the parent list). No illustrations, jokes or search box.
- Unknown URLs, missing resources and invalid params (a malformed UUID in the path) all answer
  with HTTP status 404 during SSR, never 200. Not-found pages are not reported to GlitchTip.

Errors (500 and unexpected):

- The error component shows a generic message ("Não foi possível carregar esta página"), a
  "Tentar novamente" button and a link home. Never `error.message`, stack traces or codes from
  the server; those go to the log and GlitchTip.
- `error` is `unknown`; narrow it before reading anything. Errors from a loader retry with
  `router.invalidate()`, not `reset`.
- Known domain errors (no permission, expired session) get their own message and action
  (sign in again), never the generic error page.
- Unauthenticated access to a protected route redirects to sign-in with a relative
  `?redirect=`; it is not a 404 or an error page.
- The error page answers with HTTP status 500 during SSR. When it replaces a screen after
  client navigation, focus moves to its `<h1>` so screen readers announce it.

Tests:

- Each route that loads a resource by ID has a test for the 404 case. E2E covers one unknown URL
  (status 404, title, link home) with an axe check.

## Performance

- Measure before optimizing; never optimize on a hunch.
- React Compiler is on: do not write `useMemo`, `useCallback` or `memo` by hand unless the
  profiler shows a need.
- Lazy-load heavy routes and components. Import only what you use
  (`import { format } from "date-fns"`).
- Images: explicit `width`/`height`, `loading="lazy"` below the fold, modern formats (AVIF/WebP).
- Lists with hundreds of items or more: virtualize with TanStack Virtual.

## UI design

- `DESIGN.md` holds the design system (tokens, spacing, edge lines, dialog patterns); read it
  before changing the UI and update it when a decision changes.
- Cursor feedback comes from one global rule in `src/styles.css` (Tailwind v4 removed the pointer
  from buttons); never remove it, never repeat it per component:

```css
@layer base {
    :where(
        button,
        summary,
        select,
        label[for],
        input:is(
            [type="checkbox"],
            [type="radio"],
            [type="file"],
            [type="range"],
            [type="color"],
            [type="submit"],
            [type="reset"],
            [type="button"]
        ),
        [role="button"],
        [role="tab"],
        [role="menuitem"],
        [role="option"],
        [role="switch"],
        [role="checkbox"],
        [role="radio"]
    ),
    ::file-selector-button {
        cursor: pointer;
    }

    :disabled,
    :disabled::file-selector-button,
    [aria-disabled="true"] {
        cursor: not-allowed;
    }

    [aria-busy="true"] {
        cursor: progress;
    }
}
```

- Disabled elements use `disabled` (or `aria-disabled="true"` where `disabled` does not exist),
  never `pointer-events-none`, which hides the `not-allowed` cursor.
- Loading elements set `aria-busy="true"`.
- Clickable cards and rows are a real `<Link>` or `<button>` stretched over the area
  (`after:absolute after:inset-0`), never `onClick` on a `div`.
- Hover styles and the pointer only on elements that do something.
- Drag handles: `cursor-grab active:cursor-grabbing`. Resizers: `cursor-col-resize` /
  `cursor-row-resize`.
- Every interactive element needs visible hover, press (`motion-safe:active:scale-99`) and
  focus (`focus-visible:ring-4`) states.
- Reuse components from `src/shared/ui/` before creating new ones. shadcn components go there
  too (`bunx shadcn@latest add <name>`), adapted to these rules.
- Colors, radius and shadows come from theme tokens (`@theme` in `src/styles.css`); no hex values
  or arbitrary values (`p-[13px]`, `z-[9999]`) in components. Use the spacing scale.
- Layout with flex and grid; spacing between siblings with `gap`, not margins. No absolute
  positioning for layout (overlays such as a stretched link are fine). `min-h-dvh`, never
  `h-screen`. Mobile first.
- Text lines at most ~70 characters wide. Numbers in tables use `tabular-nums`.
- Avoid the AI look: no gradients (backgrounds or text), glassmorphism, glows or heavy shadows;
  no emoji in the UI; no cards inside cards, no card for everything; no decorative icon on every
  heading or item; no hero sections inside the app; one border radius across the UI.
- Motion only when it explains a change (a panel opening, an item moving). No scroll fade-ins,
  hover lifts or bounces.

## Accessibility

WCAG 2.2 AA is the minimum.

- Native HTML first: `<button>` for actions, `<Link>` for navigation, `<dialog>` for modals.
  ARIA only when no native element does the job.
- Everything works with the keyboard alone, in a logical order. No `tabIndex` above 0. Modals
  trap focus while open and return it to the trigger on close.
- Contrast: 4.5:1 for text, 3:1 for large text, icons and input borders. Never convey meaning by
  color alone.
- Targets at least 24×24 px; 44×44 px for primary touch actions.
- Every input has a visible `<label>` (a placeholder is not a label) and the right `autocomplete`.
  Errors are linked with `aria-describedby` and `aria-invalid`.
- Icon-only buttons have an `aria-label`; decorative icons and images are hidden
  (`aria-hidden`, `alt=""`). Meaningful images have a real `alt`.
- Async results and toasts are announced (`role="status"` or `aria-live="polite"`).
- One `<h1>` per page, headings in order, landmarks (`header`, `nav`, `main`), a title per route
  (`head`), and `<html lang>` matching the UI language.
- Works at 200% zoom and 320 px wide with no horizontal scroll. Never block zoom
  (`user-scalable=no`, `maximum-scale`).
- Animations respect `prefers-reduced-motion` (`motion-safe:`).

## UI copy

- Short and direct. No subtitle that repeats the title, no helper text the label already says,
  no welcome paragraphs.
- No marketing tone ("unlock", "supercharge", "seamless"), no exclamation marks, no emoji.
- Never em or en dashes (— –). Use a comma, a colon, a period, "a" for ranges (`0:59 a 1:21`)
  or "·" as a separator. `bun run check` fails on them; the AI prompt asks for none.
- Buttons say the action: "Salvar fatura", not "OK" or "Enviar".
- Errors say what happened and what to do, without blaming the user or exposing technical details.
- Empty states: one line saying what is missing and the action to add it.

## Forms

- TanStack Form with the Zod schema from the module's `model/`. The same schema validates the
  form and the server function input; never write a second one.
- A native `<form onSubmit>` so Enter submits. The submit button is `type="submit"`; every other
  button inside a form is `type="button"`.
- Validate a field on blur and on submit; after it shows an error, revalidate on change. Never
  show errors while the user types for the first time.
- Never disable the submit button because the form is invalid. On submit with errors, show them
  and focus the first invalid field. Disable it only while submitting (`aria-busy="true"`).
- Server validation errors come back per field and show on that field ("CPF inválido"). Never
  reveal whether an email is registered (see Security).
  Unexpected errors show as one form-level message (`role="alert"`).
- Never clear what the user typed when submission fails. Reset only on success.
- Labels above the inputs. Mark optional fields ("opcional"), not required ones.
- `noValidate` on the form; our messages replace the browser's bubbles.
- Right input types: `type="email"`, `type="tel"`, `inputMode="numeric"` for digits that are not
  quantities (CPF, CEP, card). Never `type="number"` for codes.
- Brazilian formats (CPF, CNPJ, phone, CEP): the mask is display only; store digits only.
  Validate CPF/CNPJ check digits on the server. Money inputs are parsed to integer cents.
- Normalize emails to lowercase on parse.
- Password fields: show/hide toggle, `autocomplete="current-password"` or `"new-password"`,
  paste allowed.
- Forms with unsaved changes warn before leaving (TanStack Router `useBlocker`).
- Public forms (sign-up, contact) have a honeypot field besides rate limiting and Turnstile: an
  input moved off screen (not `display: none`), with `tabIndex={-1}`, `autoComplete="off"` and
  `aria-hidden`. When it is filled, the server answers as if it succeeded, does nothing, and logs
  at `warn`; this is the one deliberate exception to failing loudly. On Better Auth routes
  (sign-up), the honeypot check runs in a Better Auth `hooks.before`.

## Tests

- Unit and integration: Vitest (reuses `vite.config.ts`), with Testing Library for components.
- End-to-end: Playwright, in `e2e/` at the project root (flows cross modules).
- Tests run against a separate database in the same Postgres container (`DATABASE_URL` from
  `.env.test`), never the development one. `.env.test` has no GlitchTip DSN.
- Colocate unit and integration tests next to the file: `calculate-total.ts` →
  `calculate-total.test.ts`.

What to test:

- Always: business rules, server function authentication and authorization (an unauthorized
  user is rejected; another user's resource returns 404), values the server recalculates
  (prices, totals).
- End-to-end: the critical user flows only (sign up, sign in, the main flow of each module).
  Business rules and edge cases belong in unit tests, not E2E.
- Every bug fix starts with a test that reproduces the bug and fails.
- Skip: styling, layout, components with no logic, and library code.

How to test:

- Test behavior through the public API, not implementation details.
- Mock only external systems (third-party APIs, email, payment) by replacing the adapter that
  talks to them; that is the only exception to never mocking your own modules. Never mock the
  database.
- Each test is independent and deterministic: no shared state, no calls to external services,
  fake timers for dates.
- Name tests by behavior: `it("rejects an order with an empty cart")`.
- One behavior per test, in Arrange, Act, Assert order.
- Every rule in this file applies to tests too, except that literal values in tests are not magic
  numbers or strings.

End-to-end:

- Select elements the way a user finds them: `getByRole`, `getByLabel`, `getByText`. Never CSS
  classes or DOM structure.
- Never use fixed waits (`waitForTimeout`); rely on Playwright's auto-waiting assertions.
- Each test creates its own data (its own user, its own records).
- Playwright starts the app itself (`webServer` in `playwright.config.ts`).
- Every page covered by E2E runs an axe check (`@axe-core/playwright`) with zero WCAG 2.2 AA
  violations.

## Logging and observability

Logging:

- Use the shared logger (pino, in `src/shared/server/`), never `console.*`. Scripts in `scripts/`
  may print to the console. Logs are JSON on stdout.
- Structured: a fixed message plus fields, `logger.info({ orderId }, "order paid")`. No string
  interpolation in the message.
- Levels: `error` needs action, `warn` is unexpected but handled, `info` is a business event
  (signed up, order paid), `debug` is off in production.
- Log an error once, where it is handled. Never log and rethrow.
- Every request gets a request ID, included in all its logs.
- Log user IDs, never emails, names, documents, passwords, tokens or full request bodies. The
  logger redacts `authorization`, `cookie`, `set-cookie`, `password`, `token`, `secret` and
  `apiKey` fields.
- Security events (failed sign-ins, denied access, rate limits hit in the app) are logged at
  `warn`. Limits hit at Cloudflare show in its dashboard, not in our logs.

Observability:

- Unhandled errors on the server and in the browser go to GlitchTip (self-hosted, through the
  Sentry SDK), with source maps.
- A `/health` route calls a check in `src/shared/server/` that tests the app and the database;
  Docker Compose uses it as the healthcheck.
- In production, Docker logs have a size limit (`logging.options.max-size` and `max-file`).
- PostgreSQL logs slow queries (`log_min_duration_statement`).
- No metrics or tracing stack (OpenTelemetry) until a real need shows up.

## Definition of done

Before finishing a task, in this order:

1. Self-review: answer every question below and fix each "no".
2. Format: `bun run format`
3. Lint: `bun run lint`, and fix every error and warning.
4. Typecheck: `bun run typecheck`
5. Test: `bun run test`
6. When the change touches a flow covered by E2E: `bun run test:e2e`
7. Commit on the feature branch (see Git). Do not push.

**Is it secure?**

- Is every external input validated with Zod (user input, API responses, files, env vars)?
- Does the backend trust anything from the frontend without validating or recalculating it?
- Does every query on user data filter by the owner? Could any secret reach the browser?
- Could someone calling the endpoint directly (curl, Bruno, a script) read or change something
  they should not? Is it rate-limited, and is its list capped?
- Can anything be injected (SQL, commands, HTML/XSS, paths)?
- Are secrets kept out of the code and the logs?
- Are errors handled without leaking internal details, and logged once without personal data?

**Is it well done?**

- Does it follow every rule in this file (no `else`, no ternary, no `!`, guard clauses, locals at
  the top)?
- Are all edge cases covered (null, undefined, empty, NaN, bounds)?
- Are the important paths covered by tests, and do they pass?
- Are loading, error and empty states handled?
- Does it work with the keyboard and a screen reader? Did I add any AI-look decoration or wordy
  copy?
- Does the form keep input on failure, show server errors on the field, and focus the first invalid
  field?
- Do multi-write operations run in a transaction, and is the generated migration SQL reviewed?
- Does every external call have a timeout, and does every loop with async avoid floating promises?
- Did I check the current docs for every library API I used?
- Does Zod fit here? Is it used where data crosses a boundary, and not where it is just overhead?
- Is this the simplest solution? Is anything over-engineered?
- Did I build by hand something a well-known library already solves?
- Is there any `any`, `as`, `value!`, empty `catch`, floating promise, or leftover `console.*`?
- Does every function, component, hook and class have a single responsibility?
- Did I create a class, object or layer that a plain function or a direct import would replace?
- Are the names clear?

## Git

- Everything in git is in English: commit messages, branch names, PR titles, PR descriptions,
  and review comments. Never Portuguese.
- After a task passes the Definition of done, commit it on a feature branch. Never commit on
  `main`; if you are on it, create a branch first: `feat/`, `fix/`, `refactor/`, `chore/`,
  `docs/` plus a short kebab-case description.
- Push only when I ask; asking once does not cover later pushes.

Commits:

- Conventional Commits with the module as scope: `feat(billing): add invoice export`.
  Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `revert`.
  Breaking changes use `!` (`feat(auth)!: ...`).
- Subject in imperative mood, lowercase, no period, at most 72 characters. Add a body only to
  explain why, when the subject is not enough.
- One logical change per commit. Never mix a refactor with a feature or fix. Every commit builds
  and passes the checks.
- Stage specific files, never `git add .` or `-A` blindly. Review `git diff --staged` before
  committing.

No AI tells in commits, branches and PRs; they read as written by me:

- No mention of AI, Claude or any assistant: no "Generated with", no `Co-Authored-By` trailer,
  no `claude/` branch prefix.
- No emoji, no exclamation marks, no filler words ("comprehensive", "robust", "enhance",
  "streamline", "leverage", "various", "improvements").
- Subjects say exactly what changed: `fix(billing): round invoice totals to cents`, never
  "update files", "refactor code" or "address feedback".
- The body explains why in plain sentences. No bullet list restating the diff, no list of
  touched files, no "This commit...".
- PR descriptions are short prose: what, why, how it was tested. No "Summary / Changes / Test plan"
  headings filled with filler, no unchecked checkboxes, and never claim a check that was not run.

Never:

- `--no-verify`, force push to `main`, or amend/rebase commits that were already pushed. On your
  own branch, `--force-with-lease` only, and only when I ask.
- Commit secrets. `.env` files are in `.gitignore`; commit only `.env.example`. If a secret is
  committed, rotate it first; removing it from history is not enough.

What is versioned:

- Always: `bun.lock`, migrations, `.env.example`.
- Ignored: `.env*` (except `.env.example`), `.certs/`, build output, `playwright-report/`,
  `test-results/`.
- `.gitattributes` has `* text=auto eol=lf`.

Pull requests:

- Title in the same format as a commit. The description says what changed, why, and how it was
  tested.
- Small PRs, one topic each. Merge with squash.

## Nelcota specifics

- Module layers: modules import only from lower layers, never sideways or up: `shell` ·
  `overview` · `studio`, then `admin`, `videos` (the library), `processing`, `highlights`,
  `clips`, `transcription` · `support` · `preferences`, `video-records` (the video row, its statuses and transitions),
  `auth` · `app-switches` (the admin's on/off switches, read by every layer above). `viral-formats`
  (Formatos Virais, Etapa 1, Minhas edições) reads `auth`, `video-records`, `transcription` and
  `billing` (the Editor Oculto subscription sold through Asaas, which reads only `auth`); `mcp` (the /api/mcp server a person's
  Claude connects to) sits above `videos`, `transcription` and `viral-formats`. The exact map and each file-level exception (with its reason) live in
  `scripts/check-module-boundaries.ts`; `bun run check` enforces them.
- Integration tests (`*.integration.test.ts`, database included) run with
  `bun run test:integration` against `nelcota_test`; `bun run setup` and `bun run local` create
  `.env.test` and keep that database migrated. `bun run test` and `bun run check` run the unit
  project only. `bun run test:e2e` starts its own app on port 3299 with `.env.test` (Turnstile
  off, its own client address per test so the auth rate limits stay on).
- Migration in progress (from npm/tsx/node:test): the rules above are the target. Until a stage
  lands, code that predates it may not follow it yet (GlitchTip); new code follows the rules.
