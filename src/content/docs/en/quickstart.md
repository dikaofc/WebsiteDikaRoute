---
title: "Quickstart"
description: "Start using DikaRoute in minutes: installation, dashboard, providers, and API."
---

# Quickstart

This guide takes you from zero to your first AI request in just a few minutes.
DikaRoute is an AI gateway that unifies many LLM providers behind a single
OpenAI-compatible API.

## Prerequisites

- **Node.js** version `>=22.22.2 <23` or `>=24.0.0 <27` (LTS recommended).

```bash
node --version
```

## Installation

### NPM (recommended)

```bash
npm install -g dikaroute
```

### From Source

```bash
git clone https://github.com/dikaofc/DikaRoute.git
cd DikaRoute
npm install
npm run start
```

### Docker

```bash
# Development stack (dashboard + API on :20128)
docker compose up -d

# Production stack (split ports)
docker compose -f docker-compose.prod.yml up -d
```

## Running the Dashboard

```bash
dikaroute
```

The dashboard is available at **http://localhost:20128** and the
OpenAI-compatible API at **http://localhost:20128/v1**.

> Want full background mode? Use `dikaroute serve`.

## First Login

1. Open the dashboard at `http://localhost:20128`.
2. Log in with the initial password (env var `INITIAL_PASSWORD`, default
   `CHANGEME`).
3. Change the password right away at **Dashboard → Settings → Security**.

## Adding a Provider

Open **Dashboard → Providers** and add your AI provider:

- **OpenAI** — enter your API key (`sk-...`).
- **Anthropic** — enter your API key (`sk-ant-...`).
- **Gemini** — enter your Google API key.
- **Ollama / LM Studio / vLLM** — just set a local `baseUrl`
  (e.g. `http://localhost:11434`).

> Local providers (Ollama and the like) are only reachable after enabling
> `DIKAROUTE_ALLOW_PRIVATE_PROVIDER_URLS=true`.

## Using the API

Once a provider is configured, any app that speaks the OpenAI format can
connect straight to `http://localhost:20128/v1`.

### Chat Completion

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [
      { "role": "user", "content": "Hello AI" }
    ]
  }'
```

### Streaming (SSE)

```bash
curl -N http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "stream": true,
    "messages": [{ "role": "user", "content": "Tell me a story" }]
  }'
```

> `"model": "auto"` lets DikaRoute pick the best provider and model for you
> automatically.

## Using with Popular Clients

DikaRoute ships one-command setup for many AI clients:

```bash
dikaroute setup-claude    # Claude Code
dikaroute setup-codex     # Codex
dikaroute setup-cursor    # Cursor
dikaroute setup-cline     # Cline
dikaroute setup-continue  # Continue
dikaroute setup-opencode  # OpenCode
```

Each command configures the matching client to use DikaRoute as its gateway.

## Updating

```bash
dikaroute update
```

or:

```bash
npm install -g dikaroute@latest
```

## Next Steps

- 🌐 Read [Architecture](/docs/architecture/overview) to understand how
  DikaRoute works internally.
- 🤖 See the full API documentation at `/docs/api` (interactive Redoc).
- 📱 Running on Android? Check out the [Termux Guide](/docs/guides/termux-guide).
- 🛠️ Having issues? Run `dikaroute doctor` and `dikaroute logs`.
