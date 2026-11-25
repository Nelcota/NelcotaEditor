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
| `bun run storage:check-r2`            | Checks the R2 bucket from `.env` behaves as the app expects      |
| `bun run storage:copy-to-r2`          | Copies `STORAGE_DIR` to the bucket (`-- --dry-run` to preview)   |

## Settings (`.env`)

| Variable           | Default                        | Notes                                                                                                                                                |
| ------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WHISPER_MODEL`    | `Systran/faster-whisper-small` | `Systran/faster-whisper-base` is ~35% faster but makes many more mistakes in Portuguese; `Systran/faster-whisper-medium` is more accurate and slower |
| `WHISPER_LANGUAGE` | `pt`                           | Spoken language; empty means auto-detect                                                                                                             |
| `DEEPSEEK_MODEL`   | `deepseek-chat`                |                                                                                                                                                      |
| `STORAGE_DIR`      | `./storage`                    | Uploaded videos and rendered clips                                                                                                                   |
| `WORK_DIR`         | system temp folder             | The worker's scratch folder (downloads, audio, renders before they are stored); wiped when the worker starts                                         |
| `STORAGE_DRIVER`   | `disk`                         | `disk` keeps files in `STORAGE_DIR`; `r2` keeps them in the Cloudflare R2 bucket below (see "Stored files")                                          |
| `R2_*`             |                                | Account id, bucket, and the key pair of an R2 API token limited to that bucket with object read and write                                            |

The worker container does not read the whole `.env`: `docker-compose.yml` passes it only the variables it uses
(Whisper, DeepSeek, storage driver and R2 keys, quota and concurrency). A new setting the worker
needs goes there too.
It runs as the unprivileged `bun` user (uid 1000); on Linux, `./storage` must be writable by that uid
(`sudo chown -R 1000:1000 storage` once, if an older root worker created files there).
To update yt-dlp, change its version and checksum in `Dockerfile.worker`.

## Stored files

Keys are the relative paths the database holds (`videos/<id>/source.mp4`, `avatars/<user>.png`), so
both drivers read the same rows. With `r2`:

- File routes check the owner as always, then redirect to a signed link (an hour for the owner, ten
  minutes for a shared clip), so the bytes go from R2 to the browser, never through the app.
- Uploads go straight from the browser to a signed PUT link that only takes the declared size. The
  bucket's CORS rule allows `PUT` with `content-type` and `if-none-match` from the app's origin.
  Add each origin that serves the app (`cf r2 buckets cors update`).
- The CSP allows the account's `r2.cloudflarestorage.com` endpoint; signed links do not work on a
  custom domain.

Switching a running install from `disk` to `r2`:

1. Fill the `R2_*` settings and run `bun run storage:check-r2`; every line must say `ok`.
2. Run `bun run storage:copy-to-r2` (safe to repeat; files already in the bucket are skipped).
3. Stop the worker, run the copy once more for anything written meanwhile, set `STORAGE_DRIVER=r2`,
   and restart the app and the worker.
4. Keep `STORAGE_DIR` until the app has run on R2 for a while, then remove it.

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
- Clip encoding uses a shared pool sized by the worker's available CPUs. With eight CPUs, up to
  three clips encode at once. Saving finished clips can overlap the next encode.

Use the Compose environment to tune the worker for the server's CPU budget.

| Setting                                           | Default                            | What it controls                                                                                       |
| ------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `WORKER_CONCURRENCY`                              | 1 in production, 2 locally         | Videos per worker. Each account can process one video at a time across replicas.                       |
| `FFMPEG_CPU_BUDGET`                               | Visible CPUs                       | CPU count used to size the encoding pool. Set it when the container has a lower CPU time quota.        |
| `CLIP_RENDER_CONCURRENCY`                         | Automatic                          | Parallel clip encodes shared by all videos in one worker process.                                      |
| `CLIP_RENDER_THREADS`                             | Automatic                          | Video decoder and encoder threads per FFmpeg process. The filter chain uses one thread.                |
| `CLIP_RENDER_MAX_FPS`                             | Empty                              | Set to `30` to cap exports at 30 fps. Leave empty to use the source frame rate.                        |
| `TRANSCRIPTION_CONCURRENCY`                       | 3                                  | Parallel audio requests shared by all videos in one worker process.                                    |
| `WHISPER__NUM_WORKERS` and `WHISPER__CPU_THREADS` | 3 × 2 in production, 4 × 2 locally | How the Whisper service divides CPU threads across requests.                                           |
| `WHISPER__USE_BATCHED_MODE`                       | `false`                            | Switches Whisper to batched inference. Validate word error rate and caption timing before enabling it. |

On six logical CPUs, the `small` model in `int8` took 19 seconds with three workers and two
threads each, versus 46 seconds with two workers and three threads each. Both had a 6.85% word
error rate on 24 Brazilian Portuguese recordings from the [Google FLEURS test
split](https://huggingface.co/datasets/google/fleurs/blob/main/data/pt_br/test.tsv).
Batched inference raised the word error rate to 11.78%, with differences in word timestamps.

On the same CPU budget, two simultaneous renders produced four 10-second vertical clips with
subtitles in 7.4 seconds at 60 fps and 5.5 seconds with the optional 30 fps cap. A single render
lane took 12.3 seconds at 60 fps. The test used a synthetic 1080p60 source and local files.

With two videos waiting, concurrent processing finished the pair in 57 to 61 seconds versus
66 to 78 seconds one at a time. It took 49 to 53 seconds to produce the first clip of the first
video, versus 32 to 34 seconds one at a time. The test used the same Whisper samples, a simulated
highlight selection delay, and local rendering. Compare these trade-offs with production traffic
before tuning the number of worker slots.

Use the worker's JSON logs to compare settings under comparable load. `Job started` records
the wait after the job became eligible in `queueWaitMs`. `First clip ready` records the time
from requesting processing to storing the first clip in `timeToFirstClipMs`.
`Clip rendered and stored` separates FFmpeg's `encodeDurationMs` from the storage driver's
`storageDurationMs`. Compare the 95th percentile of first-clip latency and count
`Video processing completed` events per hour before increasing video concurrency.

## Production

Dokploy deploys `docker-compose.production.yml` as a Compose service. Each deploy builds the
images, runs `migrate` (Drizzle migrations and the pg-boss schema, as the database owner) and
then starts `web` and `worker`, which connect as `nelcota_app`: a role that reads and writes rows
but cannot create, alter or drop anything. Media lives in R2; no port but Traefik's is published.

Set these in the service's environment: `POSTGRES_PASSWORD`, `APP_DATABASE_PASSWORD`,
`BETTER_AUTH_URL` (the https origin), `BETTER_AUTH_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `DEEPSEEK_API_KEY`, `TURNSTILE_SITE_KEY` and
`TURNSTILE_SECRET_KEY` (the web server refuses to start in production without them). Optional:
`WHISPER_MODEL`, `WHISPER_LANGUAGE`, `WORKER_CONCURRENCY` (default 1)
and `STORAGE_QUOTA_GIGABYTES`. Generate passwords and the secret with `openssl rand -hex 32`.

The app reads the client address from `CF-Connecting-IP`, so web traffic reaches the server only
through a Cloudflare Tunnel: a `cloudflared` container on `dokploy-network` forwards the app's
hostname to Traefik over HTTP (the Dokploy domain has HTTPS off; Cloudflare serves the
certificate). Docker publishes Traefik on 80/443 past ufw, so the `block-direct-web` systemd unit
drops new connections to those ports in the `DOCKER-USER` chain. Only SSH is open.

## Limits

- Uploads up to 5 GB; videos up to 3 hours.
- Clips between 15 and 90 seconds (the AI aims for 20–60).
- Vertical framing is a center crop; it does not follow faces yet.
