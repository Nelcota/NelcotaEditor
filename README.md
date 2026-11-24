# Nelcota

Turns long videos into short vertical clips (9:16) with word-by-word captions.

1. Upload a video or paste a YouTube link.
2. Whisper (running locally) transcribes it with word timestamps.
3. DeepSeek reads the transcript and picks the best moments.
4. FFmpeg cuts each moment, crops it to 9:16 and burns in the captions.
5. Watch and download the clips in the browser.

## Requirements

- Bun 1.4+
- Docker Desktop (runs PostgreSQL, Whisper and the worker with FFmpeg and yt-dlp)
- A DeepSeek API key: https://platform.deepseek.com

## Getting started

```bash
bun install
bun run setup     # creates .env, starts Docker services, creates the database
```

Open `.env` and paste your key into `DEEPSEEK_API_KEY`, then:

```bash
bun run worker:restart
bun run dev
```

Open http://localhost:3210, create an account and send your first video.

The first transcription downloads the Whisper model (about 500 MB), so it takes a bit longer.

## Everyday commands

| Command                               | What it does                                                     |
| ------------------------------------- | ---------------------------------------------------------------- |
| `bun run dev`                         | Starts the web app on port 3210                                  |
| `bun run services:up`                 | Starts PostgreSQL, Whisper and the worker                        |
| `bun run services:down`               | Stops them                                                       |
| `bun run worker:logs`                 | Follows what the worker is doing                                 |
| `bun run worker:restart`              | Recreates the worker so it reads `.env` and code changes again   |
| `bun run services:rebuild`            | Rebuilds the worker image (yt-dlp is pinned in it)               |
| `bun run db:generate` / `db:migrate`  | Creates / applies database migrations                            |
| `bun run typecheck`, `lint`, `format` | Code checks                                                      |
| `bun run test`                        | Unit tests (Vitest)                                              |
| `bun run test:integration`            | Tests against the `nelcota_test` database (`.env.test`)          |
| `bun run test:e2e`                    | Playwright flows with an axe check, on their own app (port 3299) |

## Settings (`.env`)

| Variable           | Default                        | Notes                                                                                                                                                |
| ------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WHISPER_MODEL`    | `Systran/faster-whisper-small` | `Systran/faster-whisper-base` is ~35% faster but makes many more mistakes in Portuguese; `Systran/faster-whisper-medium` is more accurate and slower |
| `WHISPER_LANGUAGE` | `pt`                           | Spoken language; empty means auto-detect                                                                                                             |
| `DEEPSEEK_MODEL`   | `deepseek-chat`                |                                                                                                                                                      |
| `STORAGE_DIR`      | `./storage`                    | Uploaded videos and rendered clips                                                                                                                   |

The worker container does not read the whole `.env`: `docker-compose.yml` passes it only the variables it uses
(Whisper, DeepSeek, storage quota and concurrency). A new setting the worker needs goes there too.
It runs as the unprivileged `bun` user (uid 1000); on Linux, `./storage` must be writable by that uid
(`sudo chown -R 1000:1000 storage` once, if an older root worker created files there).
To update yt-dlp, change its version and checksum in `Dockerfile.worker`.

## How it is built

- TanStack Start (React + Nitro), TanStack Query and Form, Tailwind v4 + shadcn/ui
- PostgreSQL + Drizzle ORM, Better Auth (email and password)
- pg-boss job queue in PostgreSQL; a separate worker process does the heavy work
- [speaches](https://github.com/speaches-ai/speaches) serves faster-whisper with an OpenAI-compatible API

```
src/
  routes/                  routing only; composes screens from modules
  modules/
    shell/                 app layout, sidebar, home and account pages
    overview/              the Painel numbers and charts
    studio/                the clip editor (captions, trim, render)
    admin/                 accounts, videos and audit for admins
    videos/                the library, new videos, the video page
    processing/            the video pipeline the worker runs
    highlights/            DeepSeek prompt and clip selection
    clips/                 captions (ASS) and rendering with FFmpeg
    transcription/         audio extraction, Whisper, WebVTT captions
    preferences/           default clip count, length and language
    video-records/         the video row, its statuses and transitions
    auth/                  accounts and sessions (Better Auth)
  shared/                  UI kit, server infrastructure, errors, theme
  db/                      database client and schema index
scripts/worker.ts          the worker entry point (runs in its container)
e2e/                       Playwright flows with an axe check
```

Long steps report progress and an estimated time left, and any video can be cancelled while it's processing. Each step of the pipeline saves its result, so **Retry** on a failed video continues where it
stopped instead of starting over (the same goes for **Resume** after cancelling, including a half-finished YouTube download). If the worker restarts in the middle of a job, the video is
queued again automatically.

## Performance

Everything runs on the CPU (faster-whisper has no AMD GPU support, and Docker on Windows
cannot pass an AMD GPU through). Measured on 8 cores:

| Video                   | Transcription | AI selection | Render        | Total               |
| ----------------------- | ------------- | ------------ | ------------- | ------------------- |
| 10 min upload, 720p     | 47s           | 3s           | 9s (4 clips)  | ~1 min              |
| 17 min YouTube, 1080p60 | 45s           | 3s           | 70s (5 clips) | ~2.5 min + download |

What makes it fast:

- Audio is split into 2-minute chunks and 3 are transcribed at once (speaches runs 4 workers of
  2 threads, see `docker-compose.yml`). 10 minutes of audio went from 165s to 51s.
- YouTube downloads prefer H.264, which decodes much faster than AV1/VP9 when rendering, and
  fetch 4 fragments at once.
- Two clips render at the same time.

If your machine has a different number of cores, tune `WHISPER__NUM_WORKERS` and
`WHISPER__CPU_THREADS` (workers x threads ≈ cores) and `TRANSCRIPTION_CONCURRENCY` in
`src/modules/transcription/server/transcribe-video.server.ts`.

## Limits

- Uploads up to 5 GB; videos up to 3 hours.
- Clips between 15 and 90 seconds (the AI aims for 20–60).
- Vertical framing is a center crop; it does not follow faces yet.
