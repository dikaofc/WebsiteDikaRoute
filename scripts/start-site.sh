#!/bin/bash
# Launcher produksi DikaRoute website — jalan detached via setsid.
cd "$(dirname "$0")/.."
export NODE_ENV=production
exec npx tsx server/index.ts
