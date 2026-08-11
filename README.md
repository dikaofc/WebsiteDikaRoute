# 🌐 DikaRoute — Website Resmi

Website lengkap untuk **DikaRoute** (Unified AI Gateway & Intelligent Model Router),
dibangun dengan **React + TypeScript (TSX) + Tailwind CSS v4 + Framer Motion**
di frontend dan **Express** di backend.

## ✨ Fitur Website

| Halaman        | Konten                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| **Beranda**    | Hero animasi + terminal live, marquee 290+ provider, fitur, pipeline routing, statistik, keamanan, CLI, FAQ, CTA |
| **Dokumentasi**| 8 halaman docs (Quickstart, Arsitektur, API, Konfigurasi, Keamanan, CLI, Docker, Termux) dengan sidebar & TOC |
| **FAQ**        | Accordion animasi + pencarian                                            |
| **Changelog**  | 🔄 **Otomatis sinkron dari GitHub** setiap 10 menit (fallback file lokal) |
| **Playground** | Demo interaktif — streaming SSE nyata dari backend Express. Menampilkan **"PLAYGROUND IS NOT AVAILABLE RIGHT NOW"** sampai `PLAYGROUND_ENABLED=1` diatur di `.env` (gateway AI terhubung) |
| **Kontak**     | Form tersimpan ke backend (JSON)                                         |
| **Donasi**     | **Pembayaran QRIS Saweria NYATA** — scan QR, status real-time via Webhook + SSE (tanpa polling), ID transaksi, countdown |
| **Forum**      | Lapor issue/bug + vote + filter status, tersimpan ke backend             |

> 🌐 **Dua bahasa (ID/EN):** switch bahasa di navbar — seluruh halaman, FAQ,
> dan 8 dokumen ikut berubah bahasa (tersimpan di localStorage).
>
> 🌗 **Dark & Light mode:** tombol toggle di navbar (Sun/Moon) — tema tersimpan di
> localStorage, default mengikuti preferensi sistem. Seluruh halaman memakai
> token warna semantik (CSS variables), jadi dark/light berubah mulus tanpa
> flash (anti-FOUC script di `index.html`).

## 🧠 Backend (Express)

```
server/index.ts
├── GET  /api/health       — status server
├── GET  /api/news         — banner berita (dari news.json)
├── GET  /api/version      — versi terbaru, LIVE dari GitHub releases (cache 5 mnt)
├── GET  /api/changelog    — changelog, LIVE dari raw.githubusercontent (cache 10 mnt)
├── GET  /api/stats        — statistik gateway
├── POST /api/contact      — simpan pesan → server/data/contact.json
├── POST /api/newsletter   — simpan email → server/data/newsletter.json
├── POST /api/donation/pay — buat kode QRIS Saweria (scrape saweria.co + backend.saweria.co)
├── GET  /api/donation/status/:tx — polling status pembayaran (lunas?) → server/data/payments.json
├── POST /api/webhooks/saweria/:secret — webhook Saweria: tandai lunas + push SSE real-time
├── GET  /api/donation/stream/:tx — SSE: status pembayaran real-time tanpa polling klien
└── POST /api/playground   — simulasi AI gateway dengan SSE streaming
```

> **Donasi QRIS nyata:** port TypeScript dari library Python `saweriaqris`
> (nindtz) di `server/saweria.ts`. Set `SAWERIA_USERNAME` di `.env` (default
> `dikatech`). Minimal Rp10.000. `SAWERIA_MOCK=1` untuk tes tanpa menyentuh
> Saweria; `SAWERIA_DISABLED=1` untuk mematikan.

## 🔔 Webhook Saweria — real-time tanpa polling

Saat donasi dibayar, halaman donasi langsung berubah jadi **"Pembayaran
Berhasil"** dalam hitungan detik — tanpa polling dari klien:

1. **Saweria → Integrations → Webhook**, isi URL:

```
https://<domain-kamu>/api/webhooks/saweria/<SAWERIA_WEBHOOK_SECRET>
```

2. Generate secret acak dan set di `.env`:

```bash
openssl rand -hex 24   # contoh: 7f2c…
# .env → SAWERIA_WEBHOOK_SECRET="7f2c…"
```

3. Alur: user bayar QRIS → Saweria POST JSON `{ id, amount_raw, … }` ke URL
   tsb → server **challenge** ID transaksi ke `backend.saweria.co` (webhook
   palsu tidak bisa menandai lunas) → tandai `paid` → **push SSE** ke halaman
   donasi (`GET /api/donation/stream/:tx`) → status langsung berubah.

> Jika webhook belum aktif (secret kosong / serverless memutus stream), klien
> otomatis pindah ke **polling ringan** sebagai cadangan — tetap berfungsi.

> **Changelog otomatis dari GitHub:** setiap kali DikaRoute rilis baru, halaman
> Changelog dan badge versi di hero otomatis ter-update tanpa deploy ulang.
> Jika GitHub tidak terjangkau, otomatis fallback ke salinan lokal
> (`server/data/CHANGELOG.md`).

## 🚀 Menjalankan

### Development (hot reload)

```bash
npm install
npm run dev
```

- Frontend Vite: http://localhost:5173 (proxy `/api` → :4000)
- Backend API : http://localhost:4000

### Production

```bash
npm run build     # typecheck + build frontend → dist/
npm start         # Express menyajikan dist + API (port 4000)
```

Buka **http://localhost:4000**.

### Test otomatis

```bash
node scripts/e2e-test.mjs   # spawn server, tes semua endpoint + SSE (30/30)
```

## 📁 Struktur

```
WebsiteDikaRoute/
├── server/          # Backend Express (API + SSE + GitHub sync)
│   └── data/        # CHANGELOG.md, news.json, contact.json, newsletter.json
├── src/
│   ├── components/  # Navbar, Footer, Terminal, Marquee, Pipeline, FaqAccordion…
│   ├── pages/       # Home, Docs, FAQ, Changelog, Playground, Contact, 404
│   ├── content/     # Data konten + markdown docs (dari repo DikaRoute)
│   └── lib/         # API client, hooks, UI primitives
├── scripts/         # start-site.sh, e2e-test.mjs, validasi SSE
└── public/          # logo & aset
```

## 📧 Newsletter — email nyata (Gmail SMTP)

Newsletter bukan gimmick: email disimpan di `server/data/newsletter.json` **dan**
dikirim nyata via Gmail SMTP (nodemailer).

1. Salin `.env.example` → `.env` dan isi:

```
MAIL_USER="email.pengirim@gmail.com"
MAIL_PASS="app-password-16-karakter"   # dari myaccount.google.com/apppasswords
```

2. Saat user berlangganan → **email sambutan otomatis terkirim** (plus link berhenti
   berlangganan di `/unsubscribe`).
   Set `MAIL_DISABLED=1` di env bila ingin menonaktifkan pengiriman (mode tes).
3. Saat rilis baru → kirim notifikasi ke semua subscriber:

```bash
npm run broadcast                        # kirim ke semua subscriber
npm run broadcast -- --to kamu@email.com # mode test ke satu email
```

Atau via API dengan token admin (dicetak di console saat server boot, atau set
`BROADCAST_TOKEN` di `.env`):

```bash
curl -X POST http://localhost:4000/api/newsletter/broadcast \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <BROADCAST_TOKEN>"
```

> 💡 Gmail butuh **App Password** (aktifkan 2FA). Password akun biasa tidak akan
> diterima SMTP Gmail.

## 🚀 Deploy ke Vercel (frontend + backend serverless)

Arsitektur: Vite SPA disajikan Vercel (static) + seluruh API Express berjalan
sebagai **satu serverless function** di `api/[...path].ts` (catch-all `/api/*`).

### Langkah

1. **GitHub** — jadikan folder ini repo git & push:

```bash
git init && git add -A && git commit -m "init website"
git remote add origin https://github.com/<kamu>/WebsiteDikaRoute.git
git push -u origin main
```

2. **Vercel** → New Project → import repo tersebut. Setting otomatis terbaca
dari `vercel.json` (`npm run build`, output `dist`).

3. **Environment Variables** di dashboard Vercel (Project → Settings →
Environment Variables):

| Variable             | Wajib? | Contoh                          |
| -------------------- | ------ | ------------------------------- |
| `SAWERIA_USERNAME`    | ya       | `dikatech`                      |
| `SAWERIA_WEBHOOK_SECRET` | opsional | secret acak (real-time paid)   |
| `MAIL_USER`           | opsional | `email.pengirim@gmail.com`     |
| `MAIL_PASS`           | opsional | `16-karakter-app-password`      |
| `BROADCAST_TOKEN`     | opsional | `rahasia` (untuk broadcast)     |
| `PLAYGROUND_ENABLED`  | opsional | `1` (aktifkan playground)       |

4. **Deploy** → otomatis. Atau via CLI:

```bash
npm i -g vercel && vercel --prod
```

### ⚠️ Perilaku di serverless (penting)

- **Penyimpanan JSON ephemeral** — filesystem Vercel read-only (kecuali `/tmp`
  sementara). Form (kontak, newsletter, issue, donasi) tetap berfungsi, tapi
  datanya **hanya bertahan di memori proses** (hilang saat fungsi di-recycle).
  Kode sudah menangani write yang gagal dengan anggun (log `[store]`).
  Untuk penyimpanan permanen: integrasikan Postgres/Supabase atau Vercel KV.
- **SSE Playground & Donasi** — jalan (streaming didukung, `maxDuration: 30`);
  di serverless stream bisa diputus ~30 detik → klien otomatis fallback polling.
- **Broadcast newsletter** — dengan banyak subscriber bisa melebihi batas waktu
  fungsi; gunakan cron eksternal atau Webhook Saweria untuk notifikasi real-time.
- **Changelog/versi** — tetap live dari GitHub (fetch keluar diizinkan).

### Alternatif Netlify

Struktur API Express yang sama bisa dipakai via **Netlify Functions**:
buat `netlify/functions/api.ts` yang me-`export` handler dari `server/app.ts`
(dibungkus `@netlify/functions` / `serverless-http`) + `netlify.toml` dengan
redirect `/api/* → /.netlify/functions/api` dan SPA fallback. `server/app.ts`
sudah siap di-import tanpa side-effect (tidak ada `app.listen`).

## 🛠️ Teknologi

React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · Framer Motion · Express 4 ·
nodemailer · react-markdown · lucide-react · react-router-dom 7 · qrcode
