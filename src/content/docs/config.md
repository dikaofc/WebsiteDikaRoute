---
title: "Konfigurasi"
description: "Provider, strategi routing, dan environment variables DikaRoute."
---

# Konfigurasi

## Provider

Provider dikonfigurasi dari dashboard (atau `dikaroute providers`), dengan API key per-provider, base URL, model, concurrency, dan rate-limit windows.

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

## Strategi Routing

| Strategi          | Perilaku                                          |
| ----------------- | ------------------------------------------------- |
| **Priority**      | Selalu mencoba provider sesuai urutan konfigurasi. |
| **Round-robin**   | Membagi beban secara merata ke provider aktif.    |
| **Auto-fallback** | Coba provider utama; cascade ke cadangan saat gagal. |
| **Health-based**  | Preferensikan provider dengan skor kesehatan terbaik. |
| **Model-based**   | Routing berdasarkan prefix ID model / aturan kustom. |
| **Custom rules**  | Routing sepenuhnya kustom via rules engine.       |

## Environment Variables

Salin `.env.example` → `.env` dan sesuaikan. Essentials:

| Variable                                | Fungsi                                                 | Default                  |
| --------------------------------------- | ------------------------------------------------------ | ------------------------ |
| `JWT_SECRET`                            | Menandatangani session token dashboard. **Wajib.**     | —                        |
| `API_KEY_SECRET`                        | Mengenkripsi API key provider di SQLite. **Wajib.**    | —                        |
| `INITIAL_PASSWORD`                      | Password admin saat boot pertama.                      | `CHANGEME`               |
| `STORAGE_ENCRYPTION_KEY`                | Enkripsi penuh SQLite saat disimpan.                   | kosong (mati)            |
| `DATA_DIR`                              | Direktori data persisten (DB, log, backup).            | `~/.dikaroute/`          |
| `PORT`                                  | Port dashboard + API (mode single-port).               | `20128`                  |
| `API_PORT` / `DASHBOARD_PORT`           | Mode port terpisah untuk isolasi jaringan.             | `20129` / `20128`        |
| `REQUIRE_API_KEY`                       | Wajibkan API key untuk semua endpoint `/v1/*`.         | `false`                  |
| `REDIS_URL`                             | Redis opsional untuk rate limiting.                    | —                        |
| `DIKAROUTE_ALLOW_PRIVATE_PROVIDER_URLS` | Izinkan URL provider lokal/privat (Ollama, vLLM).      | `false`                  |
| `INPUT_SANITIZER_MODE`                  | Mode guard prompt-injection (`warn` / `block`).        | `warn`                   |
| `PII_RESPONSE_SANITIZATION`             | Redaksi PII dari respons LLM.                          | `false`                  |
| `ENABLE_TLS_FINGERPRINT`                | Spoof TLS fingerprint Chrome untuk hindari blokir.     | `false`                  |
