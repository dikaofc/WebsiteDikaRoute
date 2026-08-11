#!/bin/bash
# Probe koneksi ke server :4000, lalu jalankan validasi SSE bila terhubung.
cd "$(dirname "$0")/.."
if node -e "fetch('http://localhost:4000/api/health',{signal:AbortSignal.timeout(3000)}).then(r=>r.json()).then(j=>console.log('CONNECTED',j.status)).catch(()=>process.exit(2))"; then
  timeout 15 node scripts/test-sse-live.mjs
  echo "SSE exit:$?"
else
  echo "ISOLATED_SANDBOX"
fi
