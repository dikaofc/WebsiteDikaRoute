# Changelog

Semua perubahan penting pada **DikaRoute** didokumentasikan di sini.
File ini juga dirender di dalam dashboard aplikasi (halaman Changelog).

Format mengikuti [Keep a Changelog](https://keepachangelog.com/) dan versi
mengikuti [Semantic Versioning](https://semver.org/).

## [3.8.69] - 2026-08-11

### Added

- Vercel deployment support (preview/demo) — `vercel.json`, `scripts/deploy/` build/install commands, optional GitHub Actions workflow, and `docs/ops/vercel-deployment-guide.md`. Runs a plain `next build` (no standalone assembly) and disables standalone output on Vercel (`VERCEL=1`); the app boots in its existing `isCloud` in-memory mode.

## [3.8.68] - 2026-08-10

### Fixed

- ship fumadocs-mdx as runtime dep + fix docs home 404 links

## [3.8.67] - 2026-08-10

### Changed

- prune stale eslint suppression after health route import fix

## [3.8.66] - 2026-08-10

### Fixed

- Termux sql.js WASM resolution, health-gated readiness, aligned repair versions — Resolve sql-wasm.wasm cwd-independently (module walk-up), fail build on missing required WASM asset,

## [3.8.65] - 2026-08-09

### Fixed

- 500 on /docs routes — lazy-load jsdom (devDependency) in docsSanitizer to avoid SSR module eval crash in npm package

## [3.8.64] - 2026-08-09

### Added

- add Saweria donation tab to sidebar Help section + README donate section

## [3.8.63] - 2026-08-09

### Fixed

- 4 ReferenceError runtime bugs — ModelCompatPopover missing props, ProviderModalsPanel missing import+prop, RuntimePageClient nodeMap scope, chat handler isAllRateLimited undefined

### Changed

- prune stale eslint suppressions after ReferenceError fixes
- release v3.8.62

## [3.8.62] - 2026-08-09

### Fixed

- 4 ReferenceError runtime bugs — ModelCompatPopover missing props, ProviderModalsPanel missing import+prop, RuntimePageClient nodeMap scope, chat handler isAllRateLimited undefined

## [3.8.61] - 2026-08-09

### Fixed

- ReferenceError on /home dashboard — connected is undefined, use providerConnections (QuickStart badge + empty-state guard)

## [3.8.60] - 2026-08-09

### Fixed

- detect source-checkout run in Server-not-found hint (points to npx/global package instead of misleading reinstall)

### Changed

- tag release commit vX.Y.Z and dispatch publish against the tag (raw SHAs rejected by checkout)
- fix release dispatch — --ref must be a branch (SHA rejected 422); pass SHA via release_ref input
- dispatch publish against explicit release commit SHA (fix stale-main race that skipped 3.8.59 publish)

## [3.8.59] - 2026-08-09

### Fixed

- force sql.js WASM driver on Android/Termux (skip unreliable native sync drivers) + DIKAROUTE_FORCE_SQLJS override

## [3.8.58] - 2026-08-09

### Fixed

- surface real instrumentation-failure error on Termux/Android; add TERMUX_GUIDE

### Documentation

- fix markdown table alignment after npm badge style bump
- align npm version badge in Releases table with hero badge style

## [3.8.57] - 2026-08-09

### Added

- glass redesign for remaining inline tablists (ExportCodeModal, SearchToolsTopBar, ComboDefaultsTab, ProxyTab, DetailsPanel)
- glass redesign for DataTable, CommandPalette, old segmented controls, and provider detail page

### Changed

- clarify all-builds-in-CI pipeline (8192MB heap, pack dry-run gate, standalone+CLI build step)

## [3.8.56] - 2026-08-09

### Added

- iOS Fluid Glass dashboard redesign (AMOLED glassmorphism design system across all routes)
- hybrid OG images — transparent og:image + solid twitter:image (1200x630)
- add Open Graph + Twitter card metadata with social preview image

### Documentation

- add 1200x630 social preview variants (X/Twitter card size)
- add transparent dark-mode social preview variant (PNG + SVG source)
- add 1280x640 social preview image (dikaroute-social.png)

### Changed

- add UI validation job (lint + typecheck) to publish workflow; dry-run guard in release workflow
- add auto-release workflow (version bump + CHANGELOG generation)

## [3.8.55] - 2026-08-09

### Changed

- **README ditulis ulang** — hero 3D animasi (SVG), badge dinamis, dan dokumentasi
  lengkap (fitur, arsitektur, quickstart, API reference, konfigurasi env, FAQ,
  troubleshooting).
- **Stempel versi disinkronkan di seluruh repo** — commit `chore: sync version
stamp to 3.8.54 across all files` membuat setiap file menampilkan versi terbaru
  di GitHub.
- **`publish.sh` dihapus** — publikasi ke npm kini sepenuhnya ditangani GitHub
  Actions (`publish.yml`).

## [3.8.54] - 2026-08-09

### Fixed

- **CI build (Turbopack) dipulihkan** — 130 file di `src/lib` dikembalikan
  dari import relatif ber-ekstensi `.js` menjadi tanpa ekstensi. Commit
  sebelumnya memperkenalkan gaya import ESM `./x.js` yang tidak bisa
  diselesaikan Turbopack (`next build --turbopack`) ke file `.ts`, sehingga
  build publish di GitHub Actions gagal dengan `Module not found`
  (upstream [vercel/next.js#82945](https://github.com/vercel/next.js/issues/82945)).
- **Utilitas MITM kini ter-bundle sebagai JavaScript asli** — pipeline
  publish npm sebelumnya diam-diam menyalin source `.ts` mentah ke
  `dist/src/mitm/` karena kompilasi per-file `tsc` dengan
  `moduleResolution: NodeNext` selalu gagal. Kini `src/mitm/manager.ts`
  di-bundle dengan esbuild menjadi satu file `manager.js` yang siap jalan.
- **tsconfig** — menambahkan `ignoreDeprecations: "6.0"` agar TypeScript 6
  tidak lagi hard-error pada opsi `baseUrl`; `npm run typecheck:*` berfungsi
  kembali.
- **Traffic Inspector ingest** — menghapus key `requestBody`/`responseBody`
  duplikat (satu key menimpa yang lain secara diam-diam) dan memperbaiki
  tipe field `agent`.
- **HTTP proxy** — memperbaiki tipe body `fetch()` di inspector proxy.
- **CLI** — memperbaiki tautan release/changelog pada `dikaroute update`
  (placeholder `your-org/dikaroute` → `dikaofc/DikaRoute`).
- **Workflow publish** — job `publish` kini berjalan dengan
  `contents: write` sehingga step "Create GitHub Release" tidak lagi gagal
  dengan 403 akibat `GITHUB_TOKEN` default yang read-only.

## [3.8.52] - 2026-08-09

- Maintenance dan perbaikan stabilitas (detail lengkap lihat riwayat commit).

## [3.8.51] - 2026-08-09

- Maintenance dan perbaikan stabilitas (detail lengkap lihat riwayat commit).

## [3.8.50] - 2026-08-09

- Maintenance dan perbaikan stabilitas (detail lengkap lihat riwayat commit).
