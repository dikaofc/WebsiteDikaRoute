---
title: "Panduan Cepat"
description: "Mulai menggunakan DikaRoute dalam beberapa menit: instalasi, dashboard, provider, dan API."
---

# Panduan Cepat

Panduan ini membawa Anda dari nol hingga request AI pertama dalam beberapa
menit. DikaRoute adalah AI gateway yang menyatukan banyak provider LLM di balik
satu API kompatibel OpenAI.

## Prasyarat

- **Node.js** versi `>=22.22.2 <23` atau `>=24.0.0 <27` (LTS direkomendasikan).

```bash
node --version
```

## Instalasi

### NPM (direkomendasikan)

```bash
npm install -g dikaroute
```

### Dari Source

```bash
git clone https://github.com/dikaofc/DikaRoute.git
cd DikaRoute
npm install
npm run start
```

### Docker

```bash
# Stack development (dashboard + API di :20128)
docker compose up -d

# Stack produksi (port terpisah)
docker compose -f docker-compose.prod.yml up -d
```

## Menjalankan Dashboard

```bash
dikaroute
```

Dashboard akan tersedia di **http://localhost:20128** dan API kompatibel OpenAI
di **http://localhost:20128/v1**.

> Ingin menjalankan dalam mode background penuh? Gunakan `dikaroute serve`.

## Login Pertama

1. Buka dashboard di `http://localhost:20128`.
2. Login dengan password awal (variabel env `INITIAL_PASSWORD`, default
   `CHANGEME`).
3. Segera ganti password di **Dashboard → Settings → Security**.

## Menambahkan Provider

Buka **Dashboard → Providers**, lalu tambahkan penyedia AI Anda:

- **OpenAI** — masukkan API key (`sk-...`).
- **Anthropic** — masukkan API key (`sk-ant-...`).
- **Gemini** — masukkan API key Google.
- **Ollama / LM Studio / vLLM** — cukup set `baseUrl` lokal
  (mis. `http://localhost:11434`).

> Provider lokal (Ollama dan sejenisnya) baru bisa diakses setelah
> `DIKAROUTE_ALLOW_PRIVATE_PROVIDER_URLS=true` diaktifkan.

## Menggunakan API

Setelah provider terpasang, aplikasi apa pun yang mendukung format OpenAI bisa
langsung terhubung ke `http://localhost:20128/v1`.

### Chat Completion

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [
      { "role": "user", "content": "Halo AI" }
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
    "messages": [{ "role": "user", "content": "Ceritakan sebuah kisah" }]
  }'
```

> `"model": "auto"` membuat DikaRoute memilih provider dan model terbaik untuk
> Anda secara otomatis.

## Menggunakan dengan Klien Populer

DikaRoute menyediakan setup satu-perintah untuk berbagai klien AI:

```bash
dikaroute setup-claude    # Claude Code
dikaroute setup-codex     # Codex
dikaroute setup-cursor    # Cursor
dikaroute setup-cline     # Cline
dikaroute setup-continue  # Continue
dikaroute setup-opencode  # OpenCode
```

Setiap perintah akan mengonfigurasi klien terkait agar otomatis menggunakan
DikaRoute sebagai gateway.

## Memperbarui

```bash
dikaroute update
```

atau:

```bash
npm install -g dikaroute@latest
```

## Langkah Selanjutnya

- 🌐 Baca [Arsitektur](/docs/architecture/overview) untuk memahami cara kerja
  internal DikaRoute.
- 🤖 Lihat dokumentasi API lengkap di `/docs/api` (Redoc interaktif).
- 📱 Menjalankan di Android? Lihat [Panduan Termux](/docs/guides/termux-guide).
- 🛠️ Bermasalah? Jalankan `dikaroute doctor` dan `dikaroute logs`.
