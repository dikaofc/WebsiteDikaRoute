---
title: "Security"
description: "DikaRoute's layered security."
---

# Security

| Layer                        | Purpose                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| **Secret isolation**         | Provider API keys encrypted in SQLite (`API_KEY_SECRET`); optional full DB encryption (`STORAGE_ENCRYPTION_KEY`). |
| **SSRF guard**               | Blocks outbound calls to private / cloud-metadata networks unless explicitly allowed.        |
| **Prompt-injection guard**   | Scans incoming messages for injection patterns (`warn` / `block` / threshold mode).          |
| **PII sanitizer**            | Redacts or blocks PII on requests and LLM responses.                                         |
| **Credential masking**       | Hides known API-key patterns in payloads and logs.                                           |
| **Rate limits & budgets**    | Per-key and per-IP gates, spend tracking, quota monitoring.                                  |
| **Proxy egress**             | HTTP/SOCKS5 egress with fail-closed mode + optional TLS fingerprint spoofing.                |
| **Access control**           | `REQUIRE_API_KEY`, scoped MCP access, JWT sessions, secure cookies, CORS allow-list.         |

## Best Practices for Production

1. Always set `JWT_SECRET` and `API_KEY_SECRET` to strong random values.
2. Enable `STORAGE_ENCRYPTION_KEY` for full database encryption.
3. Require `REQUIRE_API_KEY=true` if the gateway is exposed publicly.
4. Use `AUTH_COOKIE_SECURE=true` behind HTTPS.
5. Restrict origins with `CORS_ALLOWED_ORIGINS`.
6. Monitor regularly with `dikaroute logs` and `dikaroute doctor`.
