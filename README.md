# EchoCRM

A local-first CRM for real-estate sales teams: capture meetings, transcribe and
summarize them with an offline AI pipeline, and manage customers, tasks and
deals in a desktop app backed by Supabase.

EchoCRM is made of **three runtime components** that work together:

| Component | Path | What it does |
|---|---|---|
| Desktop app | `src/`, `main.js`, `preload.js` | Electron + React + TypeScript + Tailwind client (auth, dashboard, customers, workspace, deal pipeline, search, export, notifications, settings). |
| AI service | `ai/` | Local Python FastAPI service: `faster-whisper` transcription + LLaMA 3.2 3B summarization via Ollama. Started automatically by Electron. |
| Chrome extension | `echocrm-extension/` | Captures Google Meet / Zoom / Teams tab audio, segments speakers, and uploads recordings to Supabase. |

> Everything runs offline except Supabase (data sync) and the optional in-process
> LLM download. No audio leaves the machine for AI processing.

---

## Prerequisites

- **Node.js 18+** and npm
- **Python 3.10+**
- **Ollama** — https://ollama.com
- **Google Chrome** (for the extension)
- A Supabase project (this repo ships with a linked project; see [Supabase](#5-supabase-backend) below)

---

## 1. Install dependencies

```powershell
git clone <your-repo-url>
cd EchoCRM

# Desktop app
npm install

# AI service
pip install -r requirements.txt
```

## 2. Environment variables

Copy the example file and fill in your Supabase credentials:

```powershell
Copy-Item .env.example .env
```

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
```

`.env` is git-ignored. The Chrome extension uses its own copy of these values in
`echocrm-extension/supabase/client.js` (`SUPABASE_CONFIG`).

## 3. Local AI service + Ollama

1. Install Ollama and pull the model:
   ```powershell
   ollama pull llama3.2:3b
   ```
   Ollama usually runs as a background service; if not, start it with `ollama serve`.
2. The desktop app launches the Python service automatically on startup
   (`main.js` → `python ai/server.py`). To run it manually:
   ```powershell
   python ai/server.py        # serves http://127.0.0.1:8000
   ```
3. Sanity check:
   ```powershell
   python test_pipeline.py             # full transcription + analysis on the sample audio
   python test/benchmark_pipeline.py   # optional: timing benchmarks
   ```

`faster-whisper` downloads the Whisper model (`base` by default) on first use and
caches it locally. Model size / device are configurable via environment variables
(`WHISPER_MODEL_SIZE`, `WHISPER_DEVICE`, `WHISPER_COMPUTE_TYPE`) read in
`ai/config/settings.py`.

## 4. Run the desktop app

```powershell
npm run dev
```

This starts Vite (`http://localhost:5173`) and launches Electron once it is ready.
Electron also starts the Python AI service as a child process.

Production build:

```powershell
npm run build
npm run electron:build
```

## 5. Supabase backend

The schema lives in `supabase/migrations/`. Apply migrations to the linked project
with the Supabase CLI:

```powershell
npx supabase login
npx supabase db push
```

Tables: `users`, `customers`, `calls`, `call_summaries`, `tasks`, `deals`,
`meeting_recordings` — all protected by row-level security scoped to the owning
user. Realtime is enabled for live sync across the app.

## 6. Load the Chrome extension

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select the `echocrm-extension/` folder.
4. Open the extension popup and **sign in with the same EchoCRM account** used in
   the desktop app (required for uploads — the storage/table policies are
   owner-scoped).
5. Join a Google Meet / Zoom / Teams meeting in Chrome and click **Start Recording**.
   When you stop, the recording uploads to Supabase automatically.

## 7. Process a meeting recording

In the desktop app:

1. Open **Recordings** (or a customer's **Calls** tab).
2. Assign the recording to a customer.
3. Click **Process** — the audio is downloaded locally, transcribed by Whisper,
   and summarized by the local LLM. The customer's overview, calls, tasks and
   deals populate automatically.

---

## How it works

```
Chrome extension ──upload──▶ Supabase Storage + meeting_recordings
                                        │
Desktop app (Electron/React) ──download─┘
        │ window.ai.processCall
        ▼
Python FastAPI (ai/)  ──▶ faster-whisper ──▶ transcript cleaning ──▶ LLaMA 3.2 (Ollama)
        │                                                              │
        └──────────────── structured JSON ◀────────────────────────────┘
                                        │
                     calls / call_summaries / tasks / deals
```

- The **verbatim** transcript is stored in `calls.raw_transcript` (user-facing).
- A **cleaned** transcript (fillers/disfluencies removed) is stored in
  `calls.clean_transcript` and is the only version sent to the LLM.

See [`ai/README.md`](ai/README.md) for AI-service details and
[`BENCHMARKS.md`](BENCHMARKS.md) for measured processing times.

---

## Features

- Auth, dashboard, customer CRUD, per-customer workspace (Overview / Calls / Tasks / Deals)
- Real-time sync via Supabase Realtime
- Local AI: transcription, summary, sentiment, deal stage, action items → tasks/deals
- Meeting-recording capture (Chrome extension) with one-click processing
- Deal pipeline (kanban) grouped by stage with per-stage totals
- Transcript keyword search and phone-number lookup
- Export a customer's history as CSV or PDF
- Desktop notifications for due/overdue tasks
- Dashboard charts (deals by stage, calls over time)
- Manual correction of AI-generated summaries / deal stages
- Settings page (profile, password, notification preference)

---

## Project layout

```
EchoCRM/
├── ai/                     # Python FastAPI AI service
│   ├── analysis/           # prompts, validator, transcript cleaner, LLM providers
│   ├── pipeline/           # orchestrator: audio → transcript → clean → LLM
│   ├── transcription/      # faster-whisper wrapper
│   ├── config/             # settings
│   └── server.py           # FastAPI app (started by Electron)
├── echocrm-extension/      # Chrome MV3 extension (capture + upload)
├── src/                    # React + TypeScript desktop UI
├── supabase/migrations/    # SQL schema + RLS policies
├── main.js / preload.js    # Electron main process + IPC bridge
├── test/                   # sample audio, pipeline/cleaner/benchmark scripts
└── requirements.txt        # Python dependencies
```

---

## Troubleshooting

- **"window.ai bridge is unavailable"** — you are running the UI in a browser
  instead of Electron. Use `npm run dev` (Electron) for AI features.
- **AI service offline** — ensure `ollama serve` is running and
  `ollama pull llama3.2:3b` completed; check the Electron console for
  `[AI-Service Error]`.
- **Extension uploads fail with 401/403** — sign in via the extension popup; the
  storage and `meeting_recordings` policies require an authenticated owner.
- **Recordings missing after RLS change** — rows created before owner-based RLS
  have `owner_id = NULL`; re-upload or backfill the column.

---

*Built with Llama 3.2 (Meta Llama 3.2 Community License).*
