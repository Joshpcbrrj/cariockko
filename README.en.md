# Cariockko

**🌍 Learn English by talking.** Cariockko is an open-source app for practising English conversation, listening comprehension, and pronunciation, with support in Brazilian Portuguese.

[Versão em português](README.md)

![Cariockko home page](docs/screenshots/01-home-level-selection.png)

## Contents

- [What is Cariockko?](#what-is-cariockko)
- [Key features](#key-features)
- [Screenshots](#screenshots)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [AI providers: cloud and local](#ai-providers-cloud-and-local)
- [Windows installer](#windows-installer)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [API](#api)
- [Configuration](#configuration)
- [Tests and continuous integration](#tests-and-continuous-integration)
- [Development](#development)
- [Repository structure](#repository-structure)
- [Troubleshooting](#troubleshooting)
- [Credits and origin](#credits-and-origin)
- [Differences from the original](#differences-from-the-original)

## What is Cariockko?

Cariockko helps Brazilian students practise English in a welcoming environment, without requiring an account. Learners create lessons by topic and level, take part in interactive dialogues, listen to each line, view translations, and receive feedback on spoken English in Portuguese.

Lessons are generated on demand by an AI assistant; they are not automatically generated on first launch. The app offers three levels:

- **Beginner:** essential vocabulary and simple dialogues.
- **Intermediate:** everyday situations and longer sentences.
- **Advanced:** complex discussions and more natural expression.

Use **Theme** in the navigation to switch between light and dark modes. The choice is saved in this browser; on the first visit, the app follows the system appearance preference.

## Key features

- 🧠 Guided or quick lesson-plan creation with an AI assistant.
- 📝 Review the plan before generation starts.
- 💬 Generate dialogues with English lines and Portuguese translations.
- 📈 Follow progress in real time and resume a generation.
- 🔄 Retry only failed lessons; completed lessons are preserved.
- 🎧 Dialogue player with translations, reference audio, and student recording.
- 🎙️ Speaking evaluation with transcription and feedback in Portuguese.
- ☁️ Installation-wide selection between OpenAI cloud and local Ollama/audio services.
- 📄 Export a complete lesson as a PDF compatible with **Projeto Palavras**.
- 📱 Responsive interface; no account required.
- 🌙 Light and dark modes, with the preference saved in the browser.

## Screenshots

### Home and level selection

Overview of the library and shortcuts to create lessons.

![Home page with level selection](docs/screenshots/01-home-level-selection.png)

### Lesson library

Generated lessons are organized by level.

![Beginner lesson library](docs/screenshots/02-lessons-list.png)

### Lesson player and PDF export

The player shows the current line and practice controls. The fixed button exports the dialogue and translation to Projeto Palavras.

![Lesson player with PDF export button](docs/screenshots/03-lesson-player.png)

### Lesson creation

Start with a suggested plan or customize lesson creation with the assistant.

![Lesson creation page](docs/screenshots/04-create-lessons.png)

### AI provider selection

Check local services and choose the provider for this installation.

![AI provider settings](docs/screenshots/05-ai-settings.png)

### Dark mode

Switch themes with **Theme** in the navigation. The preference is saved in the browser.

![Lesson player in dark mode](docs/screenshots/06-dark-mode.png)

> These screenshots show the interface with demonstration content and mocked data; they do not indicate that AI services are available.

## Requirements

- Windows, macOS, or Linux.
- Docker Desktop or Docker Engine with Docker Compose v2.
- For cloud mode: a valid OpenAI API key with credits, and internet access ([how to get a key](#how-to-get-an-openai-api-key)).
- For local mode: Ollama with the configured model, plus compatible local speech-to-text (STT) and text-to-speech (TTS) services.
- For development/testing: Node.js 22.9 or newer.

## Quick start

With Docker installed and running, a single command downloads the latest published release, creates the configuration, and opens the app in your browser.

**Windows** (in PowerShell):

```powershell
irm https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.ps1 | iex
```

**macOS and Linux** (in Terminal):

```bash
curl -fsSL https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.sh | bash
```

The installer:

1. checks that Docker is installed and running;
2. downloads the [latest published release](https://github.com/Joshpcbrrj/cariockko/releases/latest) of Cariockko;
3. creates `.env` with random database and storage passwords;
4. asks for your OpenAI key without showing it ([see how to get a key](#how-to-get-an-openai-api-key)). If you press Enter without typing one, it checks whether [local AI](#local-ai-with-ollama) is ready and uses that mode;
5. starts the services and opens [http://localhost:3000](http://localhost:3000).

| System | Installation folder |
|---|---|
| Windows | `%LOCALAPPDATA%\Programs\Cariockko` |
| macOS and Linux | `~/cariockko` |

**Update:** run the same command again. The code is replaced with the latest release; `.env` and your data (lessons, audio, and progress) are kept.

**Uninstall:** the installer asks whether to delete your data as well.

```powershell
# Windows
& ([scriptblock]::Create((irm https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.ps1))) -Uninstall
```

```bash
# macOS and Linux
curl -fsSL https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.sh | bash -s -- --uninstall
```

<details>
<summary>Advanced installer options</summary>

Set these environment variables before running the command:

| Variable | Effect |
|---|---|
| `CARIOCKKO_DIR` | Installs to a different folder |
| `CARIOCKKO_VERSION` | Installs a specific release, for example `v0.2.0` |
| `OPENAI_API_KEY` | Uses this key without asking |
| `CARIOCKKO_AI_PROVIDER=ollama` | Chooses local AI without asking |
| `CARIOCKKO_DELETE_DATA=1` | Deletes data on uninstall without asking (`0` keeps it) |
| `CARIOCKKO_NO_BROWSER=1` | Does not open the browser at the end |

Example on macOS and Linux: `curl -fsSL .../install.sh | CARIOCKKO_DIR=~/apps/cariockko bash`. On Windows: `$env:CARIOCKKO_DIR = "D:\Apps\Cariockko"` before the command.

</details>

Prefer to read the script before running it? See [scripts/install.sh](scripts/install.sh) and [scripts/install.ps1](scripts/install.ps1). You can also download it first and run it afterwards:

```bash
curl -fsSLO https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.sh
less install.sh
bash install.sh
```

The installer does not include Docker, Ollama, or AI models.

### Manual installation

For development, or to install without the script:

1. Clone the repository:

   ```bash
   git clone https://github.com/Joshpcbrrj/cariockko.git
   cd cariockko
   ```

2. Create the configuration file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   If other people can reach the app, change `POSTGRES_PASSWORD` (and the password inside `DATABASE_URL`) and `MINIO_ROOT_PASSWORD` before the first start.

3. Configure your preferred provider as described in [AI providers](#ai-providers-cloud-and-local).
4. Start the services:

   ```bash
   docker compose up -d --build
   ```

   If `make` is installed, you can also run `make start`.

5. Open [http://localhost:3000](http://localhost:3000).

The database starts without lessons. Open **Create** to generate your first lessons. The first generation requires the selected OpenAI or Ollama provider to be configured and available.

### Stop and check services

Run these commands in the project folder (or in the installation folder, if you used the installer):

```bash
docker compose ps
docker compose logs -f
docker compose down
```

API health endpoints:

```text
http://localhost:3001/health       basic health
http://localhost:3001/health/live  process is running
http://localhost:3001/health/ready database is reachable
```

`docker compose down` preserves data volumes. **`docker compose down -v` removes volumes and deletes local data.**

## AI providers: cloud and local

Select the provider on the **Settings** page. The selection applies to the whole Cariockko installation.

### OpenAI cloud

If you used the installer and have not entered a key yet, run the install command again: it asks for the key while none is configured.

To set or change the key manually, edit `.env` (in the installation folder, if you used the installer):

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=your-key
OPENAI_MODEL_CHAT=gpt-4o-mini
```

Then, in the same folder, recreate the API so it reads the new value:

```bash
docker compose up -d api
```

OpenAI requires internet access and a valid key. The key is used by the backend; do not put it in browser code or share it.

#### How to get an OpenAI API key

API usage is pay-as-you-go and billed separately from ChatGPT: a ChatGPT Plus or Pro subscription does **not** include API access.

**1. Open the API platform.** On [openai.com](https://openai.com), click **Log in** and choose **API Platform**. You can also go straight to [platform.openai.com](https://platform.openai.com).

<img src="docs/images/openai-key/01-entrar.png" alt="OpenAI Log in menu with the API Platform option" width="600">

**2. Sign in or create your account** with email, Google, Apple, Microsoft, or phone. If you already use ChatGPT, you can sign in with the same account.

<img src="docs/images/openai-key/02-login.png" alt="OpenAI Platform sign-in page" width="600">

**3. Add credits and open API Keys.** On the home dashboard, use **Add credits** (or **Go to Billing**, bottom left) to buy credits with a credit card; the minimum is US$5. Without credits, the key exists but does not work. Then click **API Keys** in the sidebar.

<img src="docs/images/openai-key/03-painel.png" alt="OpenAI Platform dashboard with API Keys in the sidebar" width="600">

**4. Create the key.** Click **Create new secret key**, give it a name (for example, `Cariockko`), and confirm. If the dialog offers an expiration date, choose a long one: when the key expires, Cariockko can no longer use OpenAI.

<img src="docs/images/openai-key/04-api-keys.png" alt="API keys page with the Create new secret key button" width="600">

**5. Copy the key** with the **Copy** button in the **Save your key** dialog. It starts with `sk-proj-` and is **shown only once**: if you close the dialog without copying it, delete that key and create another. Note: the copy button in the table copies the *tracking ID*, which is not the key.

<img src="docs/images/openai-key/05-copiar-chave.png" alt="Save your key dialog with the Copy button" width="600">

**6. Paste the key into the installer.** Run the [install command](#quick-start) and paste the key when asked. Nothing appears while you paste, because the key is hidden on purpose; just press Enter. If Cariockko is already installed, running the command again works too: it asks for the key while none is configured. To replace a key that is already configured, edit `.env` as described above.

Done: open **Settings** in Cariockko and check that OpenAI shows as configured.

Security and cost tips:

- Treat the key like a password: do not send it in messages, publish it, or include it in screenshots.
- In [Limits](https://platform.openai.com/settings/organization/limits), you can set a monthly spending limit.
- If the key leaks, delete it in [API keys](https://platform.openai.com/api-keys) and create a new one.

### Local AI with Ollama

Local text and audio require **all three** services:

1. **Ollama** for chat, planning, and lesson generation.
2. A local endpoint compatible with the OpenAI transcription API for STT.
3. A local endpoint compatible with the OpenAI speech synthesis API for TTS.

Example `.env` configuration:

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.1
LOCAL_STT_BASE_URL=http://host.docker.internal:8000/v1
LOCAL_STT_MODEL=Systran/faster-whisper-small
LOCAL_TTS_BASE_URL=http://host.docker.internal:8880/v1
LOCAL_TTS_MODEL=kokoro
LOCAL_TTS_VOICE=af_heart
```

Download the configured Ollama model before use, for example:

```bash
ollama pull llama3.1
```

On Linux, Ollama only accepts connections from the same machine by default, so the API container cannot reach it. Set `OLLAMA_HOST=0.0.0.0` on the Ollama service (for example with `sudo systemctl edit ollama`) and restart it.

The example addresses assume audio services that support the compatible routes `/v1/models`, `/v1/audio/transcriptions`, and `/v1/audio/speech`. These servers and local models are **not included** in Cariockko or its installer.

Under **Settings**, the app checks the Ollama model, STT, and TTS, and enables local selection only when all are responding. AI features can run without sending content to OpenAI in this mode, but the models and services must be installed first. Initial model downloads require internet; after that, processing can run locally as long as those services are running. Docker, the database, and MinIO must also be running.

## Windows installer

Besides the [quick start](#quick-start), there is a traditional `.exe` installer.

The [scripts/install-windows.ps1](scripts/install-windows.ps1) script checks for Docker Desktop, creates `.env` with random passwords, securely prompts for an OpenAI key when applicable, runs `docker compose up -d --build`, and opens the app in a browser. It is used both by the `.exe` installer and by [scripts/install.ps1](scripts/install.ps1), which downloads the latest published release and runs it.

[installer/Cariockko.iss](installer/Cariockko.iss) is the Inno Setup recipe for a `.exe` installer with Start Menu and optional desktop shortcuts. Compile it with Inno Setup from the repository root. The compiled executable is not versioned; the installer does not bundle Docker Desktop, Ollama, or AI models.

## How it works

### Create lessons

1. On the **Create** page, choose **Generate suggested lessons** or **Create with my preferences**.
2. Tell the assistant your topic, level, and preferred number of lessons.
3. Review or edit the proposed plan.
4. Confirm generation and follow progress in real time.
5. Retry failed lessons without repeating successful ones.
6. Find the new material in the library for its level.

The assistant redirects requests outside the lesson-creation scope. Conversation sessions and generation progress are persisted so work can be resumed.

### Practise a lesson

The student follows a dialogue between two characters, listens to the reference line, views the translation, and records a response. The speaking tutor transcribes and evaluates the response, providing feedback in Portuguese.

Browsers require a secure context to access the microphone: `localhost` works locally; mobile access over plain HTTP on a LAN usually does not. Use `make tunnel` to create a localhost.run HTTPS tunnel for development; it is not a production deployment configuration.

### Export to Projeto Palavras

On the lesson page, click **Exportar lição em PDF para projeto palavras**. The PDF contains the English dialogue, lines identified as Aimee and Todd, and the Portuguese translation. It also embeds the `aprendendo-palavras:v3` package in PDF metadata so that Projeto Palavras can import it as a `texto` item.

## Architecture

```text
Browser
   │
   ▼
Next.js (web :3000) ── same-origin proxy ──► Express (api :3001)
                                                 ├── PostgreSQL (:5432)
                                                 ├── MinIO/S3 (:9000)
                                                 └── AI provider
                                                      ├── OpenAI
                                                      └── Ollama + local STT/TTS
```

| Service | Technology | Purpose |
|---|---|---|
| `web` | Next.js 15, React 19, Tailwind CSS 4 | UI and same-origin API/audio proxy |
| `api` | Express, TypeScript, LangChain, OpenAI SDK | Routes, agents, generation, and speech evaluation |
| `db` | PostgreSQL 15 | Lessons, dialogues, progress, settings, and jobs |
| `minio` | S3-compatible storage | Audio files |

The Content Producer streams progress using Server-Sent Events (SSE). The API manages generation jobs and persists their state for recovery. Browser sessions are identified locally; there are no user accounts.

## API

The web app uses the Express API. Key routes:

| Method | Route | Description |
|---|---|---|
| `GET` | `/health`, `/health/live`, `/health/ready` | Health, liveness, and database readiness |
| `GET` | `/api/lessons` | List lessons; accepts `?level=beginner`, `intermediate`, or `advanced` |
| `GET` | `/api/lessons/:id` | Get a lesson and its dialogue lines |
| `POST` | `/api/content-producer/chat` | Send a message to the assistant |
| `GET` / `DELETE` | `/api/content-producer/session/:sessionId` | Read or clear a session |
| `POST` | `/api/content-producer/generate` | Start a generation job |
| `GET` | `/api/content-producer/jobs/recent` | Restore the latest job for a session |
| `GET` | `/api/content-producer/jobs/:jobId` | Get job status |
| `GET` | `/api/content-producer/jobs/:jobId/events` | Receive progress events over SSE |
| `POST` | `/api/content-producer/jobs/:jobId/retry` | Retry a failed lesson |
| `POST` | `/api/content-producer/jobs/:jobId/cancel` | Cancel a job |
| `POST` | `/api/speaking-tutor` | Submit audio for transcription and evaluation |
| `GET` / `POST` | `/api/progress/:sessionId`, `/api/progress` | Read or save progress |
| `GET` / `PUT` | `/api/settings/ai` | Read or change the AI provider |

See [docs/API.md](docs/API.md) for request and response details.

## Configuration

Settings are documented in [.env.example](.env.example). Main variables:

| Variable | Default / example | Description |
|---|---|---|
| `AI_PROVIDER` | `openai` | Initial provider: `openai` or `ollama` |
| `OPENAI_API_KEY` | — | OpenAI key; required for cloud mode |
| `OPENAI_MODEL_CHAT` | `gpt-4o-mini` | OpenAI chat model |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Ollama address |
| `OLLAMA_MODEL` | `llama3.1` | Installed local model |
| `LOCAL_STT_BASE_URL` | `http://host.docker.internal:8000/v1` | Local transcription endpoint |
| `LOCAL_STT_MODEL` | `Systran/faster-whisper-small` | Local STT model |
| `LOCAL_TTS_BASE_URL` | `http://host.docker.internal:8880/v1` | Local speech endpoint |
| `LOCAL_TTS_MODEL` | `kokoro` | Local TTS model |
| `LOCAL_TTS_VOICE` | `af_heart` | Local voice |
| `POSTGRES_DB` / `POSTGRES_PASSWORD` | `postgres` / `local-dev-password` | Application database (the installer generates a random password) |
| `POSTGRES_HOST_PORT` | `5432` | Database port on this machine, reachable only from `localhost` (the installer picks another one if 5432 is taken) |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | `minioadmin` | MinIO credentials (the installer generates a random password) |
| `MINIO_BUCKET` | `audio` | Bucket used for audio |
| `GEN_CONCURRENCY` | `3` | How many lessons are generated in parallel |

After changing `.env`, run `docker compose up -d` in the same folder to apply the changes.

Do not publish `.env` or real credentials. The `.env.example` values are for local development only.

## Tests and continuous integration

Tests live alongside the code. The suites include unit tests, API integration tests with Supertest, and UI tests with Vitest/Testing Library. Playwright E2E tests use a mock API and do not require Docker, a database, or AI credentials.

Install dependencies in each package:

```bash
cd api
npm ci
cd ../web
npm ci
```

From the repository root:

```bash
npm test              # unit, component, and integration tests
npm run typecheck     # type-check API and web
npm run build:api     # compile the API
npm run test:e2e      # E2E tests in Chromium
npm run test:ci       # run the complete verification sequence
```

For the first local E2E run, install the browser:

```bash
cd web
npx playwright install chromium
```

The [.github/workflows/ci.yml](.github/workflows/ci.yml) workflow runs checks on pull requests and pushes to `main`/`master`. Playwright reports are uploaded when available. The same workflow also tests the macOS and Linux installer end to end: it installs with Docker, checks the app, updates, and uninstalls.

### Publishing a new release

The install command always downloads the **latest published release**, not the newest code on `main`. To publish a release:

1. Update `AppVersion` in [installer/Cariockko.iss](installer/Cariockko.iss) and `version` in the root [package.json](package.json).
2. Commit and push to `main`.
3. Create and push the version tag:

   ```bash
   git tag v0.3.0
   git push origin v0.3.0
   ```

The [.github/workflows/release.yml](.github/workflows/release.yml) workflow runs every check and, if they pass, publishes the release with generated notes and the installers attached. If any check fails, nothing is published and new installs keep getting the previous release.

Refresh the screenshots used in this README with the documentation screenshot test:

```powershell
cd web
$env:UPDATE_DOC_SCREENSHOTS = "1"
npm run test:e2e -- --grep "capture documentation screenshots"
Remove-Item Env:UPDATE_DOC_SCREENSHOTS
```

## Development

For development with automatic reloading, run the database and MinIO in Docker and the API and web app directly on Node.js (22.9 or newer), in separate terminals.

1. Create the root `.env` from `.env.example` (see [manual installation](#manual-installation)) and start the database and storage:

   ```bash
   docker compose up -d db minio minio-init
   ```

2. Create `api/.env`, which the API's `npm run dev` loads. Use the passwords and port from the root `.env`, replacing Docker service names with `localhost`:

   ```dotenv
   DATABASE_URL=postgresql://postgres:local-dev-password@localhost:5432/postgres
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=minioadmin
   OPENAI_API_KEY=your-key
   ```

   If `POSTGRES_HOST_PORT` is not `5432`, use the same port in `DATABASE_URL`. For local AI, add the `OLLAMA_*` and `LOCAL_*` variables with `localhost` addresses.

3. Start the API and the web app:

   ```bash
   # Terminal 2: API (port 3001)
   cd api
   npm ci
   npm run dev

   # Terminal 3: web app (port 3000)
   cd web
   npm ci
   npm run dev
   ```

In development, the web app forwards `/api` and `/audio` to `localhost:3001` and `localhost:9000` with no extra configuration.

| Command | Action |
|---|---|
| `make start` | Start Docker services in the background and build images |
| `make stop` | Stop services and preserve volumes |
| `make restart` | Restart services |
| `make status` | Show container status |
| `make logs` | Follow service logs |
| `make tunnel` | Create an HTTPS development tunnel for mobile access |
| `make destroy` | Remove services, volumes, and images; **deletes data** |

Manual lesson seeding is still available for demos:

```bash
docker compose run --rm api npm run seed-lessons
```

## Repository structure

```text
.
├── .github/workflows/           # GitHub Actions CI and release publishing
├── api/
│   ├── src/agents/              # Content Producer, lesson generator, speaking tutor
│   ├── src/lib/                 # Database, AI, storage, SSE, and job queue
│   ├── src/routes/              # Express endpoints
│   ├── src/app.ts               # Testable Express app composition
│   └── src/*.spec.ts            # Unit and integration tests
├── db/                          # PostgreSQL initialization
├── docs/images/                 # Tutorial images
├── docs/screenshots/            # Images used by this documentation
├── installer/                   # Inno Setup recipe
├── scripts/                     # Installers (Windows, macOS, and Linux)
├── web/
│   ├── src/app/                 # Next.js pages
│   ├── src/components/          # UI components
│   ├── src/lib/                 # API client and PDF export
│   └── e2e/                     # Playwright tests and mock API
├── docker-compose.yml
├── README.md                    # Portuguese documentation
└── README.en.md                 # English documentation
```

## Troubleshooting

- **The app does not open:** in the project or installation folder, run `docker compose ps` and `docker compose logs -f`; check whether ports `3000`, `3001`, `9000`, and `9001` are available. The database port can be changed with `POSTGRES_HOST_PORT`.
- **Settings shows "OpenAI not configured":** run the install command again to enter the key, or edit `.env` as described in [OpenAI cloud](#openai-cloud).
- **Database or service unavailable:** check `http://localhost:3001/health/ready` and wait for container health checks.
- **OpenAI is not working:** verify that `OPENAI_API_KEY` is valid and recreate the API service after changing `.env`.
- **Ollama is unavailable:** check the downloaded model, Docker-reachable Ollama address, and STT/TTS endpoints.
- **Mobile microphone access is blocked:** use HTTPS; HTTP with a LAN IP is usually not a secure context for audio capture.
- **E2E reports a missing browser:** run `cd web && npx playwright install chromium`.
- **You need to reset the database:** `docker compose down -v` removes local volumes and all persisted data.

## Additional documentation

- [API reference](docs/API.md)
- [Content Producer guide](docs/GUIDES/content-producer.md)
- [Portuguese README](README.md)

## Credits and origin

This project is a fork of the [original Cariockko repository](https://github.com/araujgom/cariockko), created by [araujgom](https://github.com/araujgom). We thank the author for making the original project open source and providing the foundation for this work.

## Differences from the original

This fork adds local AI with Ollama, a settings page, dark mode, a redesigned interface, lesson PDF export, one-command installation on Windows, macOS, and Linux, versioned releases, E2E tests with CI, and English documentation to the original project.

See the full breakdown (in Portuguese) in [DIFERENCAS.md](DIFERENCAS.md).
