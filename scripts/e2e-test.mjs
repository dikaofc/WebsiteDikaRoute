// End-to-end test — spawn server child, test endpoints, kill server.
// Data ditulis ke direktori sementara (DATA_DIR) agar tidak mencemari
// data asli di server/data/ (issues, contact, donasi, newsletter).
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const PORT = 4100;
const BASE = `http://localhost:${PORT}`;

// Seed: salin data asli ke folder temp (agar endpoint yang butuh seed
// seperti /api/issues tetap terisi), lalu buang setelah tes selesai.
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "dikaroute-e2e-"));
try {
  fs.cpSync(path.join(root, "server", "data"), dataDir, { recursive: true });
} catch {}

const server = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: "production",
    DATA_DIR: dataDir,
    MAIL_DISABLED: "1",
    SAWERIA_MOCK: "1", // tes pembayaran tanpa menyentuh Saweria
    SAWERIA_WEBHOOK_SECRET: "e2e-secret", // supaya jalur webhook aktif & bisa diuji
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, extra = "") => {
  results.push(`${ok ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
};

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return true;
    } catch {}
    await sleep(500);
  }
  return false;
}

async function getJson(url) {
  const r = await fetch(url);
  return { status: r.status, body: await r.json() };
}

/** Baca semua event SSE sampai stream ditutup (atau timeout). */
async function readSseEvents(res, timeoutMs = 8000) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const events = [];
  let buffer = "";
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { done, value } = await Promise.race([
      reader.read(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("SSE timeout")), 500)),
    ]);
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const ev of parts) {
      const line = ev.trim();
      if (!line.startsWith("data:")) continue;
      try {
        events.push(JSON.parse(line.slice(5).trim()));
      } catch {}
    }
  }
  return events;
}

async function testSse() {
  const res = await fetch(`${BASE}/api/playground`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "gemini", message: "halo SSE" }),
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let pipeline = 0;
  let tokenEvents = 0;
  let doneEvent = null;
  const start = Date.now();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const ev of events) {
      const line = ev.trim();
      if (!line.startsWith("data:")) continue;
      const data = JSON.parse(line.slice(5).trim());
      if (data.type === "pipeline") pipeline++;
      if (data.type === "token") tokenEvents++;
      if (data.type === "done") doneEvent = data;
    }
  }
  const ms = Date.now() - start;
  return { pipeline, tokenEvents, doneEvent, ms };
}

async function main() {
  const up = await waitForServer();
  check("server starts", up, up ? "" : "(lihat server log di bawah)");

  if (up) {
    // health
    try {
      const health = await getJson(`${BASE}/api/health`);
      check("GET /api/health", health.status === 200 && health.body.status === "ok");
    } catch (e) {
      check("GET /api/health", false, e.message);
    }

    // version (GitHub live)
    try {
      const v = await getJson(`${BASE}/api/version`);
      check("GET /api/version (live GitHub)", v.status === 200 && /^\d+\.\d+\.\d+$/.test(v.body.version), `v${v.body.version} · source=${v.body.source}`);
    } catch (e) {
      check("GET /api/version", false, e.message);
    }

    // changelog
    try {
      const cl = await getJson(`${BASE}/api/changelog`);
      check("GET /api/changelog", cl.status === 200 && cl.body.total > 0, `total=${cl.body.total} · source=${cl.body.source}`);
    } catch (e) {
      check("GET /api/changelog", false, e.message);
    }

    // contact + newsletter
    const c = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "E2E", email: "e2e@test.dev", message: "test" }),
    });
    const cj = await c.json();
    check("POST /api/contact", c.ok && cj.ok);

    const bad = await fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "", message: "" }),
    });
    check("POST /api/contact (validasi)", bad.status === 400);

    // newsletter
    const nlCount = await getJson(`${BASE}/api/newsletter`);
    check("GET /api/newsletter (count)", nlCount.status === 200 && typeof nlCount.body.total === "number");
    const nl = await fetch(`${BASE}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "e2e-news@test.dev" }),
    });
    const nlJ = await nl.json();
    check("POST /api/newsletter", nl.ok && nlJ.ok, nlJ.message ?? "");
    const nlBad = await fetch(`${BASE}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bukan-email" }),
    });
    check("POST /api/newsletter (validasi)", nlBad.status === 400);
    const nlUnauth = await fetch(`${BASE}/api/newsletter/broadcast`, { method: "POST" });
    check("POST /api/newsletter/broadcast (auth)", nlUnauth.status === 401);
    const unsub = await fetch(`${BASE}/api/newsletter/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "e2e-news@test.dev" }),
    });
    const unsubJ = await unsub.json();
    check("POST /api/newsletter/unsubscribe", unsub.ok && unsubJ.ok && unsubJ.removed >= 0, `removed=${unsubJ.removed}`);

    // donation
    const d = await fetch(`${BASE}/api/donation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Donatur E2E", email: "donor@test.dev", amount: 50000, frequency: "sekali", method: "saweria" }),
    });
    const dj = await d.json();
    check("POST /api/donation", d.ok && dj.ok, dj.message ?? "");
    const dbad = await fetch(`${BASE}/api/donation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "", amount: -5 }),
    });
    check("POST /api/donation (validasi)", dbad.status === 400);

    // === Donasi Saweria QRIS (mode mock) ===
    const pay = await fetch(`${BASE}/api/donation/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Donatur E2E", email: "donor@test.dev", amount: 25000, frequency: "sekali", method: "saweria", message: "test qris" }),
    });
    const payJ = await pay.json();
    check(
      "POST /api/donation/pay (QRIS mock)",
      pay.ok && payJ.ok && typeof payJ.transactionId === "string" && payJ.qrDataUrl.startsWith("data:image/png"),
      `tx=${payJ.transactionId?.slice(0, 14)}…`
    );
    if (pay.ok && payJ.transactionId) {
      const st = await getJson(`${BASE}/api/donation/status/${payJ.transactionId}`);
      check("GET /api/donation/status (pending)", st.status === 200 && st.body.paid === false && st.body.status === "pending", st.body.status);
    }
    const payPaid = await fetch(`${BASE}/api/donation/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Donatur E2E", email: "donor@test.dev", amount: 25000, method: "qris", message: "__PAID__" }),
    });
    const payPaidJ = await payPaid.json();
    if (payPaid.ok && payPaidJ.transactionId) {
      const st2 = await getJson(`${BASE}/api/donation/status/${payPaidJ.transactionId}`);
      check("GET /api/donation/status (paid)", st2.status === 200 && st2.body.paid === true && st2.body.status === "paid", st2.body.status);
    }
    const payMin = await fetch(`${BASE}/api/donation/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", email: "x@y.dev", amount: 5000, method: "saweria" }),
    });
    check("POST /api/donation/pay (min amount)", payMin.status === 400);
    const payMethod = await fetch(`${BASE}/api/donation/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x", email: "x@y.dev", amount: 25000, method: "transfer" }),
    });
    check("POST /api/donation/pay (validasi metode)", payMethod.status === 400);

    // === Webhook Saweria + SSE real-time ===
    // secret salah → 404 (sengaja disamarkan agar tidak bocor keberadaan endpoint)
    const whBad = await fetch(`${BASE}/api/webhooks/saweria/secret-salah`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "apa-saja" }),
    });
    check("POST /api/webhooks/saweria (secret salah → 404)", whBad.status === 404);

    // tx tidak dikenal → diabaikan (200, tanpa side-effect)
    const whUnknown = await fetch(`${BASE}/api/webhooks/saweria/e2e-secret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "tx-tidak-dikenal" }),
    });
    const whUnknownJ = await whUnknown.json();
    check("POST /api/webhooks/saweria (tx tak dikenal diabaikan)", whUnknown.ok && whUnknownJ.ok === true);

    // webhook valid → challenge paidStatusSafe lolos (mock :paid) → mark paid
    const payWh = await fetch(`${BASE}/api/donation/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Donatur E2E", email: "donor@test.dev", amount: 25000, method: "saweria", message: "__PAID__" }),
    });
    const payWhJ = await payWh.json();
    const wh = await fetch(`${BASE}/api/webhooks/saweria/e2e-secret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: payWhJ.transactionId }),
    });
    const whJ = await wh.json();
    check("POST /api/webhooks/saweria (challenge + mark paid)", wh.ok && whJ.ok === true && whJ.paid === true, `paid=${whJ.paid}`);
    if (payWhJ.transactionId) {
      const st3 = await getJson(`${BASE}/api/donation/status/${payWhJ.transactionId}`);
      check("GET /api/donation/status (paid via webhook)", st3.status === 200 && st3.body.paid === true && st3.body.status === "paid", st3.body.status);
    }

    // SSE stream: status paid terkirim real-time tanpa polling klien
    const payStream = await fetch(`${BASE}/api/donation/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Donatur E2E", email: "donor@test.dev", amount: 25000, method: "qris", message: "__PAID__" }),
    });
    const payStreamJ = await payStream.json();
    try {
      const sseRes = await fetch(`${BASE}/api/donation/stream/${payStreamJ.transactionId}`);
      const sseEvents = await readSseEvents(sseRes);
      const connected = sseEvents.some((e) => e.status === "connected");
      const paidEv = sseEvents.find((e) => e.paid === true);
      check(
        "GET /api/donation/stream (SSE paid tanpa polling)",
        connected && paidEv?.status === "paid",
        `${sseEvents.length} events: ${sseEvents.map((e) => e.status ?? e.error ?? "?").join(" → ")}`
      );
    } catch (e) {
      check("GET /api/donation/stream (SSE paid tanpa polling)", false, e.message);
    }

    // forum issues
    const iss = await getJson(`${BASE}/api/issues`);
    check("GET /api/issues (seed)", iss.status === 200 && iss.body.total >= 6, `total=${iss.body.total}`);
    const created = await fetch(`${BASE}/api/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Bug E2E", type: "bug", severity: "high", description: "Deskripsi tes", environment: "npm" }),
    });
    const createdJ = await created.json();
    check("POST /api/issues", created.ok && createdJ.ok, createdJ.message ?? "");
    const voted = await fetch(`${BASE}/api/issues/${createdJ.id}/vote`, { method: "POST" });
    const votedJ = await voted.json();
    check("POST /api/issues/:id/vote", voted.ok && votedJ.votes === 1, `votes=${votedJ.votes}`);
    const badIssue = await fetch(`${BASE}/api/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", description: "" }),
    });
    check("POST /api/issues (validasi)", badIssue.status === 400);

    // playground status
    const pgStatus = await getJson(`${BASE}/api/playground/status`);
    check(
      "GET /api/playground/status",
      pgStatus.status === 200 && typeof pgStatus.body.available === "boolean",
      `available=${pgStatus.body.available}`
    );

    // SSE
    try {
      const sse = await testSse();
      check(
        "POST /api/playground (SSE stream)",
        sse.pipeline === 4 && sse.tokenEvents > 3 && sse.doneEvent !== null,
        `${sse.pipeline} pipeline · ${sse.tokenEvents} token events · ${sse.ms}ms`
      );
    } catch (e) {
      check("POST /api/playground (SSE stream)", false, e.message);
    }

    // SPA fallback
    const spa = await fetch(`${BASE}/docs`);
    const spaText = await spa.text();
    check("SPA fallback /docs", spa.status === 200 && spaText.includes("<div id=\"root\">"));
  }

  console.log("\n===== E2E TEST RESULTS =====");
  console.log(results.join("\n"));
  const failed = results.filter((r) => r.startsWith("❌")).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  if (serverLog.trim()) console.log("\n[server log]\n" + serverLog.slice(-600));
  try {
    server.kill("SIGTERM");
  } catch {}
  try {
    fs.rmSync(dataDir, { recursive: true, force: true });
  } catch {}
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("E2E crashed:", e);
  server.kill("SIGTERM");
  try {
    fs.rmSync(dataDir, { recursive: true, force: true });
  } catch {}
  process.exit(1);
});
