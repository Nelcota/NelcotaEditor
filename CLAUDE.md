# Project Guidelines

## Communication

- Always talk to me in Portuguese (Brazil).
- Code, comments, identifiers, and everything in git are in English.

## Stack

TypeScript, TanStack Start (React, Node via Nitro), TanStack Query/Form/Table, Tailwind v4 + shadcn/ui,
PostgreSQL (latest version, in Docker), Drizzle ORM, Better Auth, Zod. No managed external infra (e.g. Neon).

- shadcn components go to `src/shared/ui/` (`npx shadcn@latest add <name>`); adapt them to the rules below.

## UI design

- Every clickable element shows the pointer (hand) cursor on hover. Tailwind v4 removed it from
  buttons, so keep a global rule in `src/styles.css` that restores it; never remove it. Disabled elements
  use `cursor-not-allowed`, loading ones `cursor-progress`.
- Every interactive element needs visible hover, press (`motion-safe:active:scale-[0.99]`) and
  focus (`focus-visible:ring-4`) states.
- Interface copy never uses em or en dashes (— –). Use a comma, a colon, a period, "a" for ranges
  (`0:59 a 1:21`) or "·" as a separator. `npm run check` fails on them; the AI prompt asks for none.

## Running locally

- "Run it locally" means `npm run local` (the `nelcota` entry in `.claude/launch.json`): it starts
  Docker Desktop if needed, the services, the migrations, a rebuilt worker and the dev server.
  Do not run those steps by hand one at a time.

## Tests

- Test framework: TBD (e.g. Vitest)
- When to write tests: TBD

## Control flow

- Never use `else` or `else if`. Anywhere.
- Never use the ternary operator (`a ? b : c`).
- Never use the `!` negation operator. Use explicit comparisons:
  `value === null`, `isActive === false`, `items.length === 0`.
- `!==` is allowed (it is a comparison, not a negation): `campaign !== null`.
- Always use braces in `if` blocks, even for a single statement. The body goes on its own line.
- Leave a blank line after each `if` block, before the next statement. No blank line right after `{`.
- Use guard clauses with early returns at the start of functions.
- When there are many branches, prefer a lookup map, polymorphism, or a strategy object.

## Local variables

- At the start of a function, extract the objects you will use into local `const` variables.
- Never repeat the same property/getter chain; read it once and reuse the variable.
- Avoid long chains (`a.b.c.d`); break them into named locals.
- Do not create variables for boolean conditions; keep conditions inline in the `if`.

```ts
// Bad
function getDeliveryCampaignTitle(delivery: Delivery): string {
    if (delivery.application.campaign === null) {
        throw new CampaignNotFoundError(delivery.id);
    }

    return delivery.application.campaign.title;
}

// Good
function getDeliveryCampaignTitle(delivery: Delivery): string {
    const application = delivery.application;
    const campaign = application.campaign;

    if (campaign === null) {
        throw new CampaignNotFoundError(delivery.id);
    }

    return campaign.title;
}
```

## Strict TypeScript

- `strict: true` in `tsconfig.json`. Never turn it off.
- Never use `any`. Use `unknown` and narrow it (with Zod for external data).
- Never use `as` to force a type. Validate or narrow instead.
- Never use the non-null assertion (`value!`). Write an explicit null check with a guard clause.
- Always type function parameters and return values.

## Defensive checks (always)

Validate inputs at the start of every public function/method:

- null / undefined: `value === null`, `value === undefined`
- Empty values: `text.trim().length === 0`, `items.length === 0`, `Object.keys(obj).length === 0`
- Numbers: `Number.isNaN(n) === true`, `Number.isFinite(n) === false`, bounds (`n < MIN_VALUE`, `n > MAX_VALUE`), zero when used as a divisor
- Array index and length bounds (off-by-one)
- Fail fast: return early or throw a clear, specific error. Never fail silently.

## Errors and async

- Never leave an empty `catch`. Never swallow errors silently.
- Catch an error only if you can handle it meaningfully; otherwise let it propagate.
- Throw specific errors with clear messages, not generic strings.
- Every promise must be awaited or explicitly handled. No floating promises.
- Use `async`/`await`; avoid `.then()` chains.

## Validation with Zod

Use Zod to validate data that comes from outside the code:

- API requests and responses, user input, files, environment variables, external services.
- Define the schema once and derive the type from it with `z.infer`; never write the type twice.
- Use `safeParse` and handle the failure with a guard clause:

```ts
const result = userSchema.safeParse(input);

if (result.success === false) {
    return;
}

const user = result.data;
```

Before writing validation, ask yourself:

- "Does Zod fit here? Should we use Zod here?"
- Yes: data crosses a boundary (external, untrusted, or unknown shape).
- No: data is internal and already typed; a simple explicit check is enough. Do not wrap trusted internal data in schemas.

## Backend never trusts the frontend

Treat everything the client sends as untrusted, even if the frontend already validated it.

- Validate every request on the backend with Zod (body, params, query, headers), regardless of frontend validation.
- Always check authentication and authorization on the backend, on every request. Hidden buttons or routes in the UI are not security.
- Never trust IDs, roles, permissions, prices, totals, or user IDs sent by the client. Get the user from the session/token and recalculate values on the server.
- Never trust client-side state or flags (`isAdmin`, `isPaid`, `discount`).
- Frontend validation exists only for user experience; backend validation is the source of truth.

## Simplicity first

- Always pick the simplest solution that solves the current problem.
- No over-engineering: no abstractions, interfaces, factories, or layers "for the future" (YAGNI).
- Do not add dependencies when a few lines of code solve it.

## Libraries before hand-rolling

Before building something non-trivial, ask yourself:

- "Am I going to build this by hand? Or is there a well-known library that already does it?"

Prefer established, well-maintained libraries for problems that are already solved, for example:

- Data fetching, caching, mutations: TanStack Query
- Full-stack framework / routing: TanStack Start, TanStack Router
- Tables: TanStack Table
- Forms: TanStack Form
- Validation: Zod
- Dates: date-fns

Rules:

- Trivial logic (a few lines): write it by hand.
- Solved, non-trivial problems (caching, routing, forms, dates, auth, retries): use a known library.
- Always ask me before installing any new dependency, explaining why it is worth it.

## Folder structure

Modular monolith: one folder per business context under `src/modules/`.

- `src/routes/`: routing only (`beforeLoad`, `loader`, `head`, search validation). No logic; it renders screens from modules.
- `src/modules/<module>/`: everything one context owns. Inside it, `ui/` (screens, hooks), `client/` (browser-only calls), `server/` (server functions and server-only code), `<module>.schema.ts` (its Drizzle tables), and shared rules at the module root.
- `src/shared/ui/`: generic components with no business rules. `src/shared/server/`: cross-cutting server infrastructure (env, email).
- `src/db/`: the database client and `schema.ts`, which only re-exports each module's tables.
- Dependencies point one way: `routes → modules → shared`. `shared` never imports from `modules`.
- Modules import only from lower layers, never sideways or up: `shell` · `overview` · `studio`, then
  `videos` (the library), `processing`, `highlights`, `clips`, `transcription` · `preferences`,
  `video-records` (the video row, its statuses and transitions), `auth`. The exact map and each file-level
  exception (with its reason) live in `scripts/check-module-boundaries.ts`; `npm run check` enforces them.
- Server-only files end in `.server.ts`; TanStack Start fails the build if client code imports them. Server functions (`createServerFn`) stay in plain `.ts` files, since the client imports them to make the RPC call. Types the client needs never live in a `.server.ts` file.
- Hexagonal layers (`domain/`, `application/`, `ports/`, `adapters/`) only inside modules that talk to external systems (payments, AI model providers, email) or hold real business rules. Add a port only when there are two adapters, or a second one is close.
- Import alias: `#/` only.

## Small classes and SRP

- Every class and function has exactly one responsibility (Single Responsibility Principle).
- If you need "and" to describe what a class does, split it.
- Classes: aim for under ~150 lines. Functions: aim for under ~20 lines.
- Max 3 parameters per function; group more into an object.
- Max 2 levels of nesting inside a function.

## Naming

- Names must reveal intent; no abbreviations (`customerAddress`, not `custAddr`).
- Classes and types: PascalCase nouns (`InvoiceCalculator`). Functions and variables: camelCase; functions are verbs (`calculateTotal`).
- Booleans: `is`/`has`/`can`/`should` prefix (`isActive`, `hasPermission`).
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`). No magic numbers or strings.
- No generic names: `data`, `info`, `temp`, `manager`, `helper`, `utils`.
- All identifiers and comments in English.

## File organization

- One class per file.
- File names in kebab-case: `player-service.ts`, `invoice-calculator.ts`.

## Comments

- Comment the _why_, never the _what_. Good code explains what it does by itself.
- Never leave commented-out code; git keeps the history.

## Logging

- Never leave `console.log` used for debugging in the code.
- Never log passwords, tokens, secrets, or personal data.

## Tooling: Oxc

Use the Oxc toolchain for formatting and linting. Do not use Prettier or ESLint.

- Formatter: `oxfmt`
- Linter: `oxlint`

After every change, before considering the task done:

1. Format: `npx oxfmt`
2. Check: `npm run check` (format check, lint, types and the copy rules below, in one command)
3. Fix every error and warning. Never disable a rule or add ignore comments to silence it.

Never leave unformatted or lint-failing code behind. The pre-commit hook in `.githooks/` runs
`npm run check` and blocks the commit; never bypass it with `--no-verify`.
Style: 4-space indentation, semicolons, double quotes.

## Self-review before finishing

Before finishing any task, review your own code and answer:

**Is it secure?**

- Is every external input validated with Zod (user input, API responses, files, env vars)?
- Does the backend trust anything from the frontend without validating or recalculating it?
- Can anything be injected (SQL, commands, HTML/XSS, paths)?
- Are secrets kept out of the code and the logs?
- Are errors handled without leaking internal details?

**Is it well done?**

- Does it follow every rule in this file (no `else`, no ternary, no `!`, guard clauses, locals at the top)?
- Are all edge cases covered (null, undefined, empty, NaN, bounds)?
- Does Zod fit here? Is it used where data crosses a boundary, and not where it is just overhead?
- Is this the simplest solution? Is anything over-engineered?
- Did I build by hand something a well-known library already solves (TanStack, Zod, date-fns...)?
- Is there any `any`, `as`, `value!`, empty `catch`, floating promise, or leftover `console.log`?
- Does every class and function have a single responsibility?
- Are the names clear?

If any answer is "no", fix it before finishing.

## Git: English only

- Everything in git is in English: commit messages, branch names, PR titles, PR descriptions, and review comments. Never Portuguese.
- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Imperative mood, subject ≤ 72 chars: `fix: handle NaN in price parser`.
- Branch names: `feat/short-description`, `fix/short-description`.
- Never commit or push unless I explicitly ask.
- Never commit secrets. `.env` files must be in `.gitignore`; commit only a `.env.example` without real values.
