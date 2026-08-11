---
title: "CLI & Ecosystem"
description: "DikaRoute CLI commands for setup, operations, and management."
---

# CLI & Ecosystem

Run `dikaroute` for the dashboard, or use the CLI for everything:

| Command                                                                                          | Purpose                                   |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `dikaroute setup-claude`                                                                         | One-command Claude Code integration       |
| `dikaroute setup-codex`                                                                          | One-command Codex integration             |
| `dikaroute setup-cursor`                                                                         | One-command Cursor integration            |
| `dikaroute setup-cline` / `setup-continue` / `setup-roo` / `setup-goose` / `setup-qwen` / `setup-aider` / `setup-opencode` | One-command setup for other agents        |
| `dikaroute dashboard`                                                                            | Open the web dashboard                    |
| `dikaroute status` / `health`                                                                    | Gateway & provider health                 |
| `dikaroute providers` / `models`                                                                 | Manage providers & models                 |
| `dikaroute keys` / `usage` / `cost` / `tokens`                                                   | Keys, usage, spend, token tracking        |
| `dikaroute logs` / `doctor`                                                                      | Logs & diagnostics                        |
| `dikaroute tunnel`                                                                               | ngrok / Cloudflare / Tailscale tunnel     |
| `dikaroute mcp`                                                                                  | MCP server tooling                        |
| `dikaroute webhooks`                                                                             | Webhook management                        |
| `dikaroute backup` / `restart` / `stop` / `serve`                                                | Operational commands                      |
| `dikaroute update`                                                                               | Self-update                               |

## OAuth & Multi-Account

DikaRoute supports OAuth login for Claude Code, Codex, Gemini, Antigravity, Kimi, GitHub Copilot, GitLab Duo, Qoder, Trae and more — with a **warmup scheduler** for OAuth accounts to avoid cold-window throttling.
