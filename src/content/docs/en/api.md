---
title: "API Reference"
description: "DikaRoute exposes an OpenAI-compatible API at /v1."
---

# API Reference

DikaRoute exposes an **OpenAI-compatible API** at `http://localhost:20128/v1`. Any app that
speaks the OpenAI format can connect without major changes.

## Endpoints

| Method | Path                          | Description                                        |
| ------ | ----------------------------- | -------------------------------------------------- |
| `POST` | `/v1/chat/completions`        | Chat completions — streaming (SSE) and non-streaming. |
| `GET`  | `/v1/models`                  | List models available through the gateway.         |
| `POST` | `/v1/responses`               | Codex-style Responses API.                         |
| `POST` | `/v1/relay/chat/completions`  | Relay endpoint with per-IP rate limiting.          |
| `WS`   | `/v1/ws`                      | Real-time live monitoring WebSocket.               |
| `*`    | `/api/mcp`                    | MCP server tools (scope-based access control).     |
| `GET`  | `/api/openapi.yaml`           | Interactive OpenAPI specification.                 |

## Chat Completion

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

> `"model": "auto"` lets DikaRoute pick the best provider and model for you automatically.

## Streaming (SSE)

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

Responses are streamed back to the client while usage analytics and spend tracking are recorded.

## Request Flow

1. The client sends an OpenAI-style request to `POST /v1/chat/completions`.
2. The **Router** picks a provider based on the strategy (priority, round-robin, health score, model map…).
3. The pipeline applies context compression, payload rules, and rate-limit and budget checks.
4. If the primary provider fails (429 / 5xx / timeout / outage), the **fallback engine** tries the next provider.
5. The response is streamed (SSE) back to the client while analytics are recorded.
