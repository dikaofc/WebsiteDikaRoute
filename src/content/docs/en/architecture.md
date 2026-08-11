---
title: "Architecture"
description: "Understand how DikaRoute works: AI gateway, model router, auto-fallback, context compression, and security layers."
---

# DikaRoute Architecture

DikaRoute is an **AI gateway** that unifies many LLM providers (OpenAI,
Anthropic, Google Gemini, Ollama, and hundreds more) behind **one
OpenAI-compatible API**. Instead of managing many endpoints, API keys, and SDK
quirks separately, DikaRoute provides a single entry point that handles
routing, fallback, compression, monitoring, and security automatically.

## Overview

```
                 User Apps

        Claude Code        Cursor
        Custom Apps    AI Agents
                 |
                 |
          OpenAI Compatible API
                 |
                 |
             DikaRoute
        ┌──────────┼──────────┐
        |          |          |
     Router     Cache     Monitor
        |          |          |
        └──────────┼──────────┘
                   |
            AI Providers
     ┌─────────┬─────┬─────────┐
  OpenAI   Anthropic   Gemini   Ollama · Custom APIs
```

## Request Flow

1. The client sends an OpenAI-style request to `POST /v1/chat/completions`.
2. The **Router** picks a provider based on the configured strategy
   (priority, round-robin, health score, model map, or custom rules).
3. The pipeline applies **context compression**, **payload rules**, and
   **rate-limit** / **budget** checks.
4. If the primary provider fails (429 / 5xx / timeout / outage), the
   **fallback engine** transparently tries the next healthy provider.
5. The response is **streamed** (SSE) back to the client while **usage
   analytics** and **spend tracking** are recorded.

## Core Components

### Router

The Router decides which provider serves each request. Supported strategies:

| Strategy           | Behavior                                          |
| ------------------ | ------------------------------------------------- |
| **Priority**       | Always try providers in your configured order.    |
| **Round-robin**    | Distribute load evenly across active providers.   |
| **Auto-fallback**  | Try the primary; move to backups on failure.      |
| **Health-based**   | Prefer providers with the best health score.      |
| **Model-based**    | Route by model ID prefix / custom rules.          |
| **Custom rules**   | Fully custom routing via the rules engine.        |

### Fallback Engine

When the primary provider fails due to rate limits, outages, or exhausted
credentials, requests automatically fail over to the next healthy provider —
with no app changes. Supporting mechanisms:

- **Provider health checks** with configurable intervals and recovery cooldowns.
- **Connection recovery** — revalidates cooling-down connections outside the
  hot path.
- **Emergency fallback** for requests that run out of budget.
- **Admission control** prevents OOM under heavy concurrent load
  (HTTP 503 + `Retry-After`).

### Context Compression & Optimization

Long AI conversations burn tokens fast. DikaRoute shrinks payload size while
preserving useful information:

- **RTK & CCR compression engines** with hot-reloadable payload rules.
- **Prefix freezing** — keeps stable, cacheable prefixes from compression.
- **Token & cost tracking** so every conversation's cost is known.

### Monitoring

- Provider status & health score.
- Request stats, latency, and errors.
- Token usage, cost, and budgets.
- Real-time live view over WebSocket.

### Data Storage

All data is stored in local **SQLite**:

- Provider API keys are encrypted at rest (`API_KEY_SECRET`).
- Optional full database encryption (`STORAGE_ENCRYPTION_KEY`).
- Default data location: `~/.dikaroute/` (configurable via `DATA_DIR`).

The SQLite driver is chosen automatically per platform — on Android/Termux
DikaRoute uses **sql.js (WASM)** so it always runs without native compilation.

### Dashboard & CLI

- **Web dashboard** (`http://localhost:20128`) to manage providers, models,
  routing, combos, compression, webhooks, and monitor usage.
- **CLI** (`dikaroute`) for one-command setup of Claude Code, Codex, Cursor,
  Cline, and more, plus operational commands like `doctor`, `logs`, `backup`,
  `tunnel`, and `update`.

## Security Layers

| Layer                       | Purpose                                                      |
| --------------------------- | ----------------------------------------------------------- |
| **Secret isolation**        | API keys encrypted in SQLite; optional full DB encryption.   |
| **SSRF guard**              | Blocks calls to private / cloud-metadata networks.           |
| **Prompt-injection guard**  | Scans incoming messages for injection patterns (`warn`/`block`). |
| **PII sanitizer**           | Redacts or blocks PII on requests and responses.             |
| **Credential masking**      | Hides known API-key patterns in payloads and logs.           |
| **Rate limits & budgets**   | Per-key and per-IP gates, spend tracking, quota monitoring.  |
| **Access control**          | `REQUIRE_API_KEY`, scoped MCP, JWT sessions, secure cookies, CORS. |

## Summary

DikaRoute is built with one goal: **one endpoint, many AI providers, maximum
reliability**. With a thin gateway architecture in front of AI providers,
DikaRoute handles routing and failure complexity so your apps only ever talk
to one API.
