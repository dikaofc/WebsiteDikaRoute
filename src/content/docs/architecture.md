---
title: "Arsitektur"
description: "Memahami cara kerja DikaRoute: AI gateway, router model, auto-fallback, kompresi konteks, dan lapisan keamanan."
---

# Arsitektur DikaRoute

DikaRoute adalah **AI gateway** yang menyatukan banyak penyedia LLM (OpenAI,
Anthropic, Google Gemini, Ollama, dan ratusan lainnya) di balik **satu API yang
kompatibel dengan OpenAI**. Alih-alih mengelola banyak endpoint, API key, dan
perbedaan SDK secara terpisah, DikaRoute menyediakan satu titik masuk yang
menangani routing, fallback, kompresi, monitoring, dan keamanan secara otomatis.

## Gambaran Umum

```
                 Aplikasi Pengguna

        Claude Code        Cursor
        Aplikasi Kustom    AI Agents
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
  OpenAI   Anthropic   Gemini   Ollama · API Kustom
```

## Alur Request

1. Klien mengirim request bergaya OpenAI ke `POST /v1/chat/completions`.
2. **Router** memilih provider berdasarkan strategi yang dikonfigurasi
   (priority, round-robin, health score, model map, atau aturan kustom).
3. Pipeline menerapkan **kompresi konteks**, **payload rules**, serta
   pemeriksaan **rate limit** dan **budget**.
4. Jika provider utama gagal (429 / 5xx / timeout / outage), **fallback engine**
   secara transparan mencoba provider cadangan berikutnya.
5. Respons **di-streaming** (SSE) kembali ke klien sambil **usage analytics**
   dan **spend tracking** dicatat.

## Komponen Inti

### Router

Router menentukan penyedia mana yang akan melayani setiap request. Strategi yang
didukung:

| Strategi           | Perilaku                                          |
| ------------------ | ------------------------------------------------- |
| **Priority**       | Selalu mencoba provider sesuai urutan konfigurasi. |
| **Round-robin**    | Membagi beban secara merata ke provider yang aktif. |
| **Auto-fallback**  | Coba provider utama; otomatis pindah ke cadangan saat gagal. |
| **Health-based**   | Prioritaskan provider dengan skor kesehatan terbaik. |
| **Model-based**    | Routing berdasarkan prefix ID model / aturan kustom. |
| **Custom rules**   | Routing sepenuhnya kustom melalui rules engine. |

### Fallback Engine

Saat provider utama gagal karena rate limit, outage, atau kredensial habis,
request otomatis dilimpahkan ke provider sehat berikutnya — tanpa perubahan
aplikasi. Mekanisme pendukung:

- **Provider health checks** dengan interval dan cooldown recovery yang dapat
  dikonfigurasi.
- **Connection recovery** — memvalidasi ulang koneksi yang cooling-down di luar
  hot path.
- **Emergency fallback** untuk request yang kehabisan budget.
- **Admission control** mencegah OOM pada beban konkuren yang berat
  (HTTP 503 + `Retry-After`).

### Kompresi & Optimasi Konteks

Percakapan AI yang panjang cepat menghabiskan token. DikaRoute mengecilkan
ukuran payload sambil mempertahankan informasi yang berguna:

- **RTK & CCR compression engines** dengan payload rules yang hot-reloadable.
- **Prefix freezing** — mempertahankan prefix yang stabil dan cacheable dari
  hasil kompresi.
- **Pelacakan token & biaya** agar setiap percakapan selalu diketahui biayanya.

### Monitoring

- Status provider & health score.
- Statistik request, latensi, dan error.
- Penggunaan token, biaya, dan budget.
- Live view real-time melalui WebSocket.

### Penyimpanan Data

Semua data disimpan di **SQLite** lokal:

- API key provider dienkripsi saat disimpan (`API_KEY_SECRET`).
- Opsional enkripsi penuh database (`STORAGE_ENCRYPTION_KEY`).
- Lokasi data default: `~/.dikaroute/` (bisa diubah via `DATA_DIR`).

Driver SQLite dipilih otomatis berdasarkan platform — pada Android/Termux
DikaRoute menggunakan **sql.js (WASM)** agar selalu berjalan tanpa kompilasi
native.

### Dashboard & CLI

- **Dashboard web** (`http://localhost:20128`) untuk mengelola provider, model,
  routing, kombo, kompresi, webhook, dan memantau penggunaan.
- **CLI** (`dikaroute`) untuk setup satu-perintah ke Claude Code, Codex, Cursor,
  Cline, dan lainnya, plus perintah operasional seperti `doctor`, `logs`,
  `backup`, `tunnel`, dan `update`.

## Lapisan Keamanan

| Lapisan                     | Fungsi                                                        |
| --------------------------- | ------------------------------------------------------------- |
| **Isolasi secret**          | API key dienkripsi di SQLite; opsi enkripsi DB penuh.         |
| **SSRF guard**              | Memblokir panggilan ke jaringan privat/cloud metadata.        |
| **Prompt-injection guard**  | Memindai pesan masuk untuk pola injeksi (`warn` / `block`).   |
| **PII sanitizer**           | Meredaksi atau memblokir PII pada request dan respons.        |
| **Credential masking**      | Menyembunyikan pola API key di payload dan log.               |
| **Rate limit & budget**     | Gerbang per-key dan per-IP, pelacakan spend, monitoring kuota. |
| **Access control**          | `REQUIRE_API_KEY`, MCP scoped, sesi JWT, cookie aman, CORS.   |

## Ringkasan

DikaRoute dirancang dengan satu tujuan: **satu endpoint, banyak AI provider,
reliabilitas maksimal**. Dengan arsitektur gateway yang tipis di depan
provider-provider AI, DikaRoute menangani kompleksitas routing dan kegagalan
sehingga aplikasi Anda cukup berbicara dengan satu API saja.
