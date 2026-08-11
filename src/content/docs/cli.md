---
title: "CLI & Ekosistem"
description: "Perintah CLI DikaRoute untuk setup, operasi, dan manajemen."
---

# CLI & Ekosistem

Jalankan `dikaroute` untuk dashboard, atau gunakan CLI untuk semuanya:

| Perintah                                                                                       | Fungsi                                   |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `dikaroute setup-claude`                                                                       | Integrasi Claude Code satu-perintah      |
| `dikaroute setup-codex`                                                                        | Integrasi Codex satu-perintah            |
| `dikaroute setup-cursor`                                                                       | Integrasi Cursor satu-perintah           |
| `dikaroute setup-cline` / `setup-continue` / `setup-roo` / `setup-goose` / `setup-qwen` / `setup-aider` / `setup-opencode` | Setup satu-perintah untuk agen lain      |
| `dikaroute dashboard`                                                                          | Buka web dashboard                       |
| `dikaroute status` / `health`                                                                  | Kesehatan gateway & provider             |
| `dikaroute providers` / `models`                                                               | Kelola provider & model                  |
| `dikaroute keys` / `usage` / `cost` / `tokens`                                                 | Key, usage, spend, token tracking        |
| `dikaroute logs` / `doctor`                                                                    | Log & diagnostik                         |
| `dikaroute tunnel`                                                                             | ngrok / Cloudflare / Tailscale tunnel    |
| `dikaroute mcp`                                                                                | Tooling MCP server                       |
| `dikaroute webhooks`                                                                           | Manajemen webhook                        |
| `dikaroute backup` / `restart` / `stop` / `serve`                                              | Perintah operasional                     |
| `dikaroute update`                                                                             | Self-update                              |

## OAuth & Multi-Account

DikaRoute mendukung login OAuth untuk Claude Code, Codex, Gemini, Antigravity, Kimi, GitHub Copilot, GitLab Duo, Qoder, Trae dan lainnya — dengan **warmup scheduler** untuk akun OAuth agar terhindar dari throttling cold-window.
