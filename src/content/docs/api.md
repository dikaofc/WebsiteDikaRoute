---
title: "API Reference"
description: "DikaRoute mengekspos API kompatibel OpenAI di /v1."
---

# API Reference

DikaRoute mengekspos **API kompatibel OpenAI** di `http://localhost:20128/v1`. Aplikasi apa pun yang mendukung format OpenAI dapat terhubung tanpa perubahan besar.

## Endpoints

| Method | Path                          | Deskripsi                                          |
| ------ | ----------------------------- | -------------------------------------------------- |
| `POST` | `/v1/chat/completions`        | Chat completions — streaming (SSE) dan non-streaming. |
| `GET`  | `/v1/models`                  | Daftar model yang tersedia melalui gateway.        |
| `POST` | `/v1/responses`               | Codex-style Responses API.                         |
| `POST` | `/v1/relay/chat/completions`  | Relay endpoint dengan rate limiting per-IP.        |
| `WS`   | `/v1/ws`                      | Real-time live monitoring WebSocket.               |
| `*`    | `/api/mcp`                    | MCP server tools (access control berbasis scope).  |
| `GET`  | `/api/openapi.yaml`           | Spesifikasi OpenAPI interaktif.                    |

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

> `"model": "auto"` membuat DikaRoute memilih provider dan model terbaik untuk Anda secara otomatis.

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

Respons di-streaming kembali ke klien sementara usage analytics dan spend tracking dicatat.

## Alur Request

1. Klien mengirim request bergaya OpenAI ke `POST /v1/chat/completions`.
2. **Router** memilih provider berdasarkan strategi (priority, round-robin, health score, model map…).
3. Pipeline menerapkan kompresi konteks, payload rules, serta pemeriksaan rate-limit dan budget.
4. Jika provider utama gagal (429 / 5xx / timeout / outage), **fallback engine** mencoba provider berikutnya.
5. Respons di-streaming (SSE) kembali ke klien sambil analytics dicatat.
