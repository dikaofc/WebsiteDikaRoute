---
title: "Docker Deployment"
description: "Menjalankan DikaRoute dengan Docker."
---

# Docker Deployment

```bash
# Stack development (dashboard + API di :20128)
docker compose up -d

# Stack produksi (port terpisah)
docker compose -f docker-compose.prod.yml up -d
```

## Catatan Penting

- **Persistensi data:** mount direktori host ke `DATA_DIR` (mis. `./data` atau `/var/lib/dikaroute`).
- **Port produksi:** host mempublikasikan `PROD_DASHBOARD_PORT` (default `20130`) dan `PROD_API_PORT` (default `20131`).
- **Podman:** set `CONTAINER_HOST=podman`.
- **Di belakang proxy:** set `DIKAROUTE_BASE_PATH` untuk serving subpath dan `NEXT_PUBLIC_BASE_URL` untuk origin publik.

## Dari Source

```bash
git clone https://github.com/dikaofc/DikaRoute.git
cd DikaRoute
npm install
npm run start
```

## Instalasi NPM

```bash
npm install -g dikaroute

# Mulai dashboard (default: http://localhost:20128)
dikaroute

# Update ke versi terbaru
dikaroute update
```
