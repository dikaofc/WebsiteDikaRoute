---
title: "Configuration"
description: "DikaRoute providers, routing strategies, and environment variables."
---

# Configuration

## Providers

Providers are configured from the dashboard (or `dikaroute providers`), with per-provider API
keys, base URLs, models, concurrency, and rate-limit windows.

```json
{
  "providers": {
    "openai": { "enabled": true, "apiKey": "sk-..." },
    "anthropic": { "enabled": true, "apiKey": "sk-ant-..." },
    "ollama": { "enabled": true, "baseUrl": "http://localhost:11434" }
  },
  "routing": { "strategy": "auto-fallback" }
}
```

## Routing Strategies

| Strategy          | Behavior                                          |
| ----------------- | ------------------------------------------------- |
| **Priority**      | Always try providers in your configured order.    |
| **Round-robin**   | Distribute load evenly across active providers.   |
| **Auto-fallback** | Try the primary; cascade to backups on failure.   |
| **Health-based**  | Prefer providers with the best health score.      |
| **Model-based**   | Route by model ID prefix / custom rules.          |
| **Custom rules**  | Fully custom routing via the rules engine.        |

## Environment Variables

Copy `.env.example` → `.env` and adjust. Essentials:

| Variable                                | Purpose                                                | Default                  |
| --------------------------------------- | ------------------------------------------------------ | ------------------------ |
| `JWT_SECRET`                            | Signs dashboard session tokens. **Required.**          | —                        |
| `API_KEY_SECRET`                        | Encrypts provider API keys in SQLite. **Required.**    | —                        |
| `INITIAL_PASSWORD`                      | Admin password on first boot.                          | `CHANGEME`               |
| `STORAGE_ENCRYPTION_KEY`                | Full SQLite encryption at rest.                        | empty (off)              |
| `DATA_DIR`                              | Persistent data directory (DB, logs, backups).         | `~/.dikaroute/`          |
| `PORT`                                  | Dashboard + API port (single-port mode).               | `20128`                  |
| `API_PORT` / `DASHBOARD_PORT`           | Split-port mode for network isolation.                 | `20129` / `20128`        |
| `REQUIRE_API_KEY`                       | Require an API key for all `/v1/*` endpoints.          | `false`                  |
| `REDIS_URL`                             | Optional Redis for rate limiting.                      | —                        |
| `DIKAROUTE_ALLOW_PRIVATE_PROVIDER_URLS` | Allow local/private provider URLs (Ollama, vLLM).      | `false`                  |
| `INPUT_SANITIZER_MODE`                  | Prompt-injection guard mode (`warn` / `block`).        | `warn`                   |
| `PII_RESPONSE_SANITIZATION`             | Redact PII from LLM responses.                         | `false`                  |
| `ENABLE_TLS_FINGERPRINT`                | Spoof Chrome TLS fingerprint to avoid blocking.        | `false`                  |
