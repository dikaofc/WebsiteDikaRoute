---
title: "Docker Deployment"
description: "Run DikaRoute with Docker."
---

# Docker Deployment

```bash
# Development stack (dashboard + API on :20128)
docker compose up -d

# Production stack (split ports)
docker compose -f docker-compose.prod.yml up -d
```

## Important Notes

- **Data persistence:** mount a host directory to `DATA_DIR` (e.g. `./data` or `/var/lib/dikaroute`).
- **Production ports:** the host publishes `PROD_DASHBOARD_PORT` (default `20130`) and `PROD_API_PORT` (default `20131`).
- **Podman:** set `CONTAINER_HOST=podman`.
- **Behind a proxy:** set `DIKAROUTE_BASE_PATH` to serve a subpath and `NEXT_PUBLIC_BASE_URL` for the public origin.

## From Source

```bash
git clone https://github.com/dikaofc/DikaRoute.git
cd DikaRoute
npm install
npm run start
```

## NPM Installation

```bash
npm install -g dikaroute

# Start the dashboard (default: http://localhost:20128)
dikaroute

# Update to the latest version
dikaroute update
```
