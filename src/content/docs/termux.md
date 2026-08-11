---
title: "DikaRoute on Termux"
description: "Menjalankan DikaRoute di Android/Termux: instalasi, cache dir, dan troubleshooting instrumentation."
---

# DikaRoute on Termux (Android)

DikaRoute runs on Android via [Termux](https://termux.dev/). This guide covers the
common platform-specific problems and their fixes.

## Installation

```bash
# Use the Node.js LTS package (not the default), then install globally
pkg install nodejs-lts
npm install -g dikaroute
dikaroute --version
```

> Always keep the global install up to date — fixes for Termux land in every
> release:
>
> ```bash
> npm install -g dikaroute@latest
> ```

## Starting the server

```bash
dikaroute serve
```

The dashboard is served at `http://localhost:20128` and the OpenAI-compatible
API at `http://localhost:20128/v1`.

---

## Troubleshooting

### Dashboard / API returns `Internal Server Error` (HTTP 500) while the CLI says "running"

**Symptom:** `✔ DikaRoute is running!` is printed, but every request returns a
bare HTTP 500 and the dashboard shows _Internal Server Error_.

**Cause:** the Next.js instrumentation hook failed to load. When that hook never
runs, the server still binds its ports (so it _looks_ healthy) but every
DB-touching route 500s forever.

Two common Termux-specific causes:

1. **Missing Next.js cache directory** — Next.js has no `android` branch in its
   cache-dir probe. It only accepts a cache root that already exists (`~/.cache`
   or the tmp dir). The CLI normally creates it for you, but on a fresh install
   it may not have existed yet.
2. **A native module failed to load** — historically the SQLite driver
   (`better-sqlite3` when its compiled binary does not match the Termux Node
   build, or `node:sqlite` when unavailable in the Termux Node package).

> **Since 3.8.59** this is no longer expected: on Android/Termux the DB driver
> cascade now **skips native drivers entirely** and goes straight to the
> bundled **sql.js WASM** driver (pure WebAssembly — no compilation, no ABI
> matching, always works). See [SQLite driver on Termux](#sqlite-driver-on-termux)
> below. The remaining realistic cause of a 500 is the missing cache dir (#1).

**Step 1 — see the real error** (the CLI hides child output by default):

```bash
dikaroute serve --log
```

Look for the actual failure line, e.g.:

```
An error occurred while loading instrumentation hook: ...
```

**Step 2 — apply the fixes in order:**

```bash
# 1. Cache probe — make sure ~/.cache exists
mkdir -p ~/.cache
dikaroute serve

# 2. Verify the sql.js WASM fallback driver is actually installed.
#    Termux uses the WASM driver (better-sqlite3 is intentionally skipped), so
#    if sql-wasm.wasm is missing the server boots to HTTP 500 no matter what
#    you rebuild. This is the most common real cause of this symptom:
find "$(npm root -g)" -path '*sql.js/dist/sql-wasm.wasm' -print

#    If nothing is printed, the install is incomplete — reinstall:
npm install -g dikaroute@latest --include=optional

# 3. Only after the WASM check passes, rebuild native modules into a
#    user-writable runtime (works without a C++ toolchain):
dikaroute runtime repair

# 4. Or rebuild the SQLite driver explicitly (needs a C++ toolchain):
npm rebuild better-sqlite3
```

After each fix, restart: `dikaroute serve`.

> `dikaroute runtime repair` and `npm rebuild better-sqlite3` do **not** fix the
> sql.js WASM driver — on Termux that driver is used instead of
> better-sqlite3. Only reinstall (step 2) or update fixes a missing
> `sql-wasm.wasm`.

**Step 3 — if the error persists**, share the full `dikaroute serve --log`
output (especially the `An error occurred while loading instrumentation hook: …`
or `[STARTUP] Fatal: Database driver initialization failed` line) — that
identifies the exact module that failed on your device.

### SQLite driver on Termux

DikaRoute detects Android/Termux at boot and **forces the sql.js WASM driver**
— the native sync drivers (`better-sqlite3`, `node:sqlite`) are skipped before
they are even attempted, because their prebuilt binaries do not load on Android.

This is automatic — no action needed. You should see this line in the logs:

```
[DB] Android/Termux detected — forcing sql.js WASM driver (native sync drivers unreliable on Android)
[DB] Driver: sql.js | file: ...
```

On any other platform you can opt into the same behavior explicitly with:

```bash
DIKAROUTE_FORCE_SQLJS=1 dikaroute serve
```

sql.js is slower than the native drivers (it loads the database file into WASM
memory) but is fully functional — the right trade-off for Termux reliability.

### `Unsupported platform: android`

Next.js's `getCacheDirectory()` has no `android` branch. On Termux it falls back
to a generic tmp location, which only succeeds when `~/.cache` (or the tmp dir)
already exists. This is the root cause of the instrumentation failure above:

```bash
mkdir -p ~/.cache
dikaroute serve
```

### `module.register() is deprecated` warning

Harmless Node.js deprecation notice. Ignore it.

### Native module rebuild guidance

Termux usually has no full C++ toolchain. Prefer:

```bash
dikaroute runtime repair
```

This rebuilds required native modules into a user-writable runtime directory
without needing `make`/`gcc`. Only fall back to `npm rebuild …` when a toolchain
is installed.

> Since 3.8.59 the SQLite driver is **not** one of those native modules on
> Termux anymore — `npm rebuild better-sqlite3` is unnecessary there (sql.js
> WASM is used instead). The runtime-repair path still matters for other
> optional native pieces (e.g. `wreq-js`).
>
> The sql.js WASM driver is a **regular dependency** (`sql.js`), so a normal
> `npm install -g dikaroute` places `sql-wasm.wasm` under the global
> `node_modules` (typically `$(npm root -g)/node_modules/sql.js/dist/`).
> DikaRoute resolves it relative to the installed package rather than the
> current directory, so it works from any working directory. If it is missing,
> reinstall (`npm install -g dikaroute@latest --include=optional`) — no native
> rebuild will restore it.
