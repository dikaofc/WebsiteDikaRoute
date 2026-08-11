---
title: "Keamanan"
description: "Lapisan keamanan berlapis DikaRoute."
---

# Keamanan

| Lapisan                    | Fungsi                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| 🔑 **Secret isolation**    | API key provider dienkripsi di SQLite (`API_KEY_SECRET`); opsi enkripsi DB penuh (`STORAGE_ENCRYPTION_KEY`). |
| 🧱 **SSRF guard**          | Memblokir panggilan keluar ke jaringan privat/cloud metadata kecuali diizinkan eksplisit.      |
| 🛡️ **Prompt-injection guard** | Memindai pesan masuk untuk pola injeksi (`warn` / `block` / mode threshold).                 |
| 👁️ **PII sanitizer**       | Meredaksi atau memblokir PII pada request dan respons LLM.                                    |
| 🎭 **Credential masking**  | Menyembunyikan pola API key yang dikenal di payload dan log.                                  |
| 🚦 **Rate limits & budgets** | Gerbang per-key dan per-IP, pelacakan spend, monitoring kuota.                               |
| 🧭 **Proxy egress**        | HTTP/SOCKS5 egress dengan mode fail-closed + spoofing TLS fingerprint opsional.               |
| 🔒 **Access control**      | `REQUIRE_API_KEY`, akses MCP scoped, sesi JWT, cookie aman, CORS allow-list.                  |

## Praktik Terbaik untuk Produksi

1. Selalu set `JWT_SECRET` dan `API_KEY_SECRET` dengan nilai acak yang kuat.
2. Aktifkan `STORAGE_ENCRYPTION_KEY` untuk enkripsi penuh database.
3. Wajibkan `REQUIRE_API_KEY=true` jika gateway diekspos publik.
4. Gunakan `AUTH_COOKIE_SECURE=true` di belakang HTTPS.
5. Batasi origin dengan `CORS_ALLOWED_ORIGINS`.
6. Pantau dengan `dikaroute logs` dan `dikaroute doctor` secara berkala.
