FROM oven/bun:1.4.5-slim AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .
RUN bun run build

# Applies the Drizzle migrations and the pg-boss schema with the database owner, then grants the
# app's role read and write rights only. Runs once per deploy, before the web server and worker.
FROM oven/bun:1.4.5-slim AS migrate

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts --production

COPY tsconfig.json ./
COPY drizzle ./drizzle
COPY scripts/migrate-database.ts ./scripts/migrate-database.ts

USER bun

CMD ["bun", "scripts/migrate-database.ts"]

# Nitro bundles the server with the modules it needs, so the runtime image holds only the output.
FROM oven/bun:1.4.5-slim AS web

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/.output ./.output

USER bun

EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]
