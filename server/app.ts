import express from "express";
import path from "node:path";
import fs from "node:fs";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import {
  isMailConfigured,
  sendMail,
  welcomeEmailHtml,
  releaseEmailHtml,
  donationThankYouEmailHtml,
} from "./mailer.js";
import { loadEnv } from "./env.js";
import { createPaymentQrSafe, paidStatusSafe, saweriaConfig } from "./saweria.js";
import QRCode from "qrcode";

// Load .env dari root (idempoten; di Vercel env disuntik lebih dulu dan
// loadEnv tidak menimpa). Dipanggil di sini — SEBELUM nilai turunan env
// seperti BROADCAST_TOKEN dievaluasi.
loadEnv();

// Path resolution TANPA import.meta.url — Vercel meng-compile fungsi ke CJS
// di mana referensi `import.meta` bisa SyntaxError (tergantung compiler) atau
// undefined (esbuild). process.cwd() aman di semua mode eksekusi:
//  - Vercel (bundle CJS / native ESM): cwd = root fungsi (/var/task)
//  - Lokal (npm start / tsx dari root): cwd = folder proyek
const root = process.cwd();
const DATA_DIR = (() => {
  const candidates = [
    path.join(root, "server", "data"), // lokal & Vercel (data ikut includeFiles)
    path.join(root, "data"),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  return candidates[0];
})();
const isProd = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";

const app = express();
app.use(express.json({ limit: "1mb" }));

/* ------------------------------------------------------------------ */
/*  Store tahan-serverless                                             */
/*  - Lokal: baca/tulis file JSON seperti biasa (persisten).           */
/*  - Serverless (Vercel/Netlify): filesystem read-only → write gagal  */
/*    ditangkap, data dipertahankan di memori selama proses hidup.     */
/* ------------------------------------------------------------------ */

const memoryStore = new Map<string, unknown>();

/**
 * Baca JSON. Sekali sebuah file "tersentuh" (dibaca atau ditulis) di proses
 * ini, memori menjadi sumber kebenaran — penting di serverless, karena
 * filesystem read-only tapi MASIH bisa dibaca: jika baca-dari-disk terus
 * menimpa cache, data baru yang hanya ada di memori (write gagal) akan
 * hilang oleh konten seed/disk yang basi.
 */
function readJson(file: string, fallback: unknown) {
  if (memoryStore.has(file)) return memoryStore.get(file);
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
    memoryStore.set(file, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

function writeStoreFile(file: string, data: unknown) {
  memoryStore.set(file, data);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn(
      `[store] write ${path.basename(file)} gagal (filesystem read-only?) — data hanya di memori:`,
      (e as Error).message
    );
  }
}

function appendToJson(file: string, entry: Record<string, unknown>) {
  const data = [...(readJson(file, []) as unknown[])];
  data.push({ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  writeStoreFile(file, data);
}

function writeJson(file: string, data: unknown) {
  writeStoreFile(file, data);
}

/** Parse a Keep-a-Changelog style markdown into release objects. */
function parseChangelog(md: string) {
  const releases: {
    version: string;
    date: string;
    sections: { name: string; items: string[] }[];
  }[] = [];
  let current: (typeof releases)[number] | null = null;
  let sectionName = "";

  for (const rawLine of md.split("\n")) {
    const line = rawLine.trim();
    const heading = line.match(/^##\s+\[([^\]]+)\]\s*-\s*([\d-]+)/);
    if (heading) {
      if (current) releases.push(current);
      current = { version: heading[1], date: heading[2], sections: [] };
      sectionName = "";
      continue;
    }
    if (!current) continue;
    if (/^###\s+(.+)/.test(line)) {
      sectionName = line.replace(/^###\s+/, "").trim();
      current.sections.push({ name: sectionName, items: [] });
      continue;
    }
    const item = line.match(/^[-*]\s+(.+)/);
    if (item && current.sections.length > 0) {
      current.sections[current.sections.length - 1].items.push(item[1]);
    }
  }
  if (current) releases.push(current);
  return releases;
}

/* ------------------------------------------------------------------ */
/*  GitHub auto-sync (changelog & latest version)                      */
/* ------------------------------------------------------------------ */

const GITHUB_RAW_CHANGELOG =
  "https://raw.githubusercontent.com/dikaofc/DikaRoute/main/CHANGELOG.md";
const GITHUB_LATEST_RELEASE =
  "https://api.github.com/repos/dikaofc/DikaRoute/releases/latest";
const CHANGELOG_CACHE_TTL_MS = Number(
  process.env.CHANGELOG_CACHE_TTL_MS || 10 * 60 * 1000
); // refresh dari GitHub tiap 10 menit
const VERSION_CACHE_TTL_MS = Number(process.env.VERSION_CACHE_TTL_MS || 5 * 60 * 1000);

let changelogCache: {
  md: string;
  source: "github" | "local";
  fetchedAt: string | null;
  cachedAt: number;
} | null = null;

let versionCache: { version: string; cachedAt: number } | null = null;

// dedup request bersamaan saat cache kedaluwarsa (anti cache-stampede)
let inflightChangelog: Promise<{ md: string; source: "github" | "local"; fetchedAt: string | null }> | null = null;
let inflightVersion: Promise<string> | null = null;

async function fetchGithubText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "dikaroute-website", Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
  return res.text();
}

function localChangelogMd() {
  try {
    return fs.readFileSync(path.join(DATA_DIR, "CHANGELOG.md"), "utf-8");
  } catch {
    return "# Changelog\n\n## [0.0.0] - 1970-01-01\n- (offline — file tidak tersedia)";
  }
}

/* ------------------------------------------------------------------ */
/*  API routes                                                         */
/* ------------------------------------------------------------------ */

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "dikaroute-website-api",
    version: "1.0.0",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/news", (_req, res) => {
  res.json(readJson(path.join(DATA_DIR, "news.json"), null));
});

/**
 * Changelog otomatis: ambil CHANGELOG.md terbaru dari GitHub setiap
 * 10 menit. Jika GitHub tidak terjangkau, fallback ke salinan lokal.
 */
app.get("/api/changelog", async (_req, res) => {
  const respond = (md: string, source: "github" | "local", fetchedAt: string | null) => {
    const releases = parseChangelog(md);
    res.json({
      total: releases.length,
      releases,
      source,
      fetchedAt,
      nextRefreshInMs: CHANGELOG_CACHE_TTL_MS,
    });
  };

  // pakai cache bila masih segar
  if (changelogCache && Date.now() - changelogCache.cachedAt < CHANGELOG_CACHE_TTL_MS) {
    return respond(changelogCache.md, changelogCache.source, changelogCache.fetchedAt);
  }

  // anti stampede: satu fetch untuk semua request yang bersamaan
  if (!inflightChangelog) {
    inflightChangelog = (async () => {
      try {
        const md = await fetchGithubText(GITHUB_RAW_CHANGELOG);
        return { md, source: "github" as const, fetchedAt: new Date().toISOString() };
      } catch {
        // GitHub gagal → TETAP pakai cache GitHub terakhir bila ada; jangan racuni cache.
        if (changelogCache) return changelogCache;
        const md = localChangelogMd();
        return { md, source: "local" as const, fetchedAt: null };
      } finally {
        inflightChangelog = null;
      }
    })();
  }

  const fresh = await inflightChangelog;
  changelogCache = { ...fresh, cachedAt: Date.now() };
  respond(fresh.md, fresh.source, fresh.fetchedAt);
});

/** Versi terbaru DikaRoute, diambil dari GitHub release + fallback lokal. */
app.get("/api/version", async (_req, res) => {
  if (versionCache && Date.now() - versionCache.cachedAt < VERSION_CACHE_TTL_MS) {
    return res.json({ version: versionCache.version, source: "cache" });
  }

  if (!inflightVersion) {
    inflightVersion = (async () => {
      try {
        const body = await fetchGithubText(GITHUB_LATEST_RELEASE);
        const data = JSON.parse(body) as { tag_name?: string; published_at?: string };
        const version = String(data.tag_name ?? "").replace(/^v/, "");
        if (version) return version;
        throw new Error("no tag");
      } catch {
        const first = parseChangelog(localChangelogMd())[0];
        return first?.version ?? "0.0.0";
      } finally {
        inflightVersion = null;
      }
    })();
  }

  const version = await inflightVersion;
  versionCache = { version, cachedAt: Date.now() };
  res.json({ version, source: "github" });
});

app.get("/api/stats", (_req, res) => {
  res.json({
    providers: 290,
    strategies: 6,
    compressionEngines: 2,
    avgOverheadMs: 0.5,
    githubStars: 1200,
    npmDownloads: 184000,
  });
});

app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body ?? {};
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: "Semua kolom wajib diisi" });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Format email tidak valid" });
  }
  appendToJson(path.join(DATA_DIR, "contact.json"), { name, email, message });
  res.json({ ok: true, message: "Pesan berhasil dikirim. Terima kasih!" });
});

const NEWSLETTER_FILE = path.join(DATA_DIR, "newsletter.json");
const BROADCAST_TOKEN =
  process.env.BROADCAST_TOKEN || randomBytes(16).toString("hex");

/** Jumlah subscriber (untuk ditampilkan di footer). */
app.get("/api/newsletter", (_req, res) => {
  const subs = readJson(NEWSLETTER_FILE, []) as unknown[];
  res.json({ total: subs.length });
});

app.post("/api/newsletter", (req, res) => {
  const { email } = req.body ?? {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Format email tidak valid" });
  }
  appendToJson(NEWSLETTER_FILE, { email });

  // Kirim email sambutan NYATA (async, tidak memblokir respons).
  // Subscriber tetap tersimpan walau pengiriman gagal.
  if (isMailConfigured()) {
    Promise.resolve()
      .then(() => sendMail({ to: email, subject: "Selamat datang di DikaRoute!", html: welcomeEmailHtml() }))
      .then(() => console.log(`[mail] welcome terkirim ke ${email}`))
      .catch((e) => console.error(`[mail] welcome gagal (${email}):`, (e as Error).message));
  } else {
    console.warn("[mail] MAIL_USER/MAIL_PASS belum diatur — email sambutan tidak dikirim.");
  }

  res.json({ ok: true, message: "Berhasil berlangganan! Email sambutan sedang dikirim." });
});

/**
 * Broadcast rilis terbaru ke semua subscriber.
 * Auth: header `x-admin-token` — nilai ada di console saat server boot
 * atau set env BROADCAST_TOKEN. Konten diambil otomatis dari changelog GitHub.
 */
app.post("/api/newsletter/broadcast", async (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== BROADCAST_TOKEN) {
    return res.status(401).json({ ok: false, error: "Token admin tidak valid" });
  }
  if (!isMailConfigured()) {
    return res.status(503).json({ ok: false, error: "Mail belum dikonfigurasi (MAIL_USER/MAIL_PASS)" });
  }

  const subs = readJson(NEWSLETTER_FILE, []) as { email: string }[];
  if (!subs.length) {
    return res.json({ ok: false, error: "Belum ada subscriber" });
  }

  const md = changelogCache?.md ?? localChangelogMd();
  const latest = parseChangelog(md)[0];
  if (!latest) return res.status(500).json({ ok: false, error: "Gagal membaca rilis terbaru" });

  const notes = latest.sections.flatMap((s) => s.items).slice(0, 6);
  const subject = `DikaRoute v${latest.version} telah rilis!`;
  const html = releaseEmailHtml({
    version: latest.version,
    date: latest.date,
    notes,
    url: "https://github.com/dikaofc/DikaRoute/releases",
  });

  let sent = 0;
  let failed = 0;
  const emails = subs.map((s) => s.email).filter(Boolean);
  for (const email of emails) {
    try {
      await sendMail({ to: email, subject, html });
      sent += 1;
    } catch (e) {
      failed += 1;
      console.error(`[mail] broadcast gagal (${email}):`, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 200)); // throttle anti rate-limit Gmail
  }
  res.json({ ok: true, total: emails.length, sent, failed, version: latest.version });
});

/** Hapus email dari daftar subscriber (untuk link berhenti berlangganan). */
app.post("/api/newsletter/unsubscribe", (req, res) => {
  const { email } = req.body ?? {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Format email tidak valid" });
  }
  const subs = readJson(NEWSLETTER_FILE, []) as { email: string }[];
  const before = subs.length;
  const remaining = subs.filter((s) => s.email.toLowerCase() !== String(email).toLowerCase());
  writeJson(NEWSLETTER_FILE, remaining);
  res.json({ ok: true, removed: before - remaining.length, message: "Berhasil berhenti berlangganan. Sampai jumpa!" });
});

/* ------------------------------------------------------------------ */
/*  Forum — laporan issue & bug                                        */
/* ------------------------------------------------------------------ */

const ISSUES_FILE = path.join(DATA_DIR, "issues.json");

app.get("/api/issues", (_req, res) => {
  const issues = readJson(ISSUES_FILE, []) as Record<string, unknown>[];
  const byStatus = (s: string) => issues.filter((i) => i.status === s).length;
  res.json({
    total: issues.length,
    open: byStatus("open"),
    inProgress: byStatus("in-progress"),
    resolved: byStatus("resolved"),
    issues: issues.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
  });
});

app.post("/api/issues", (req, res) => {
  const { title, type = "bug", severity = "medium", description, steps = "", environment = "", email = "" } = req.body ?? {};
  if (!title || !description) {
    return res.status(400).json({ ok: false, error: "Judul dan deskripsi wajib diisi" });
  }
  const allowedTypes = ["bug", "feature", "question", "docs", "other"];
  const allowedSeverity = ["low", "medium", "high", "critical"];
  const issue = {
    title: String(title).trim().slice(0, 120),
    type: allowedTypes.includes(type) ? type : "bug",
    severity: allowedSeverity.includes(severity) ? severity : "medium",
    description: String(description).trim().slice(0, 4000),
    steps: String(steps ?? "").trim().slice(0, 4000),
    environment: String(environment ?? "").trim(),
    email: String(email ?? "").trim(),
    status: "open",
    votes: 0,
  };
  const id = crypto.randomUUID();
  const issues = readJson(ISSUES_FILE, []) as unknown[];
  issues.push({ ...issue, id, createdAt: new Date().toISOString() });
  writeJson(ISSUES_FILE, issues);
  res.json({ ok: true, id, message: "Laporan berhasil dikirim ke forum. Terima kasih!" });
});

app.post("/api/issues/:id/vote", (req, res) => {
  const issues = readJson(ISSUES_FILE, []) as { id: string; votes: number }[];
  const found = issues.find((i) => i.id === req.params.id);
  if (!found) return res.status(404).json({ ok: false, error: "Issue tidak ditemukan" });
  found.votes = (found.votes || 0) + 1;
  writeJson(ISSUES_FILE, issues);
  res.json({ ok: true, votes: found.votes });
});

app.post("/api/donation", (req, res) => {
  const { name, email, amount, frequency = "sekali", method = "saweria", message = "" } = req.body ?? {};
  if (!name || !email) {
    return res.status(400).json({ ok: false, error: "Nama dan email wajib diisi" });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Format email tidak valid" });
  }
  const nominal = Number(amount);
  if (!Number.isFinite(nominal) || nominal <= 0) {
    return res.status(400).json({ ok: false, error: "Nominal donasi tidak valid" });
  }
  appendToJson(path.join(DATA_DIR, "donations.json"), {
    name,
    email,
    amount: nominal,
    frequency,
    method,
    message,
  });
  res.json({
    ok: true,
    message: `Terima kasih! Donasi intent Rp${nominal.toLocaleString("id-ID")} tercatat.`,
  });
});

/**
 * Konfirmasi donasi QRIS STATIS (tombol "Saya Sudah Membayar").
 * Mencatat donatur di donations.json + mengirim email terima kasih via
 * Gmail SMTP bila MAIL_USER/MAIL_PASS dikonfigurasi dan email valid.
 * QRIS statis tidak diverifikasi otomatis — konfirmasi ini manual.
 */
app.post("/api/donation/confirm", async (req, res) => {
  const { name = "", email = "", message = "" } = req.body ?? {};
  const cleanName = String(name).trim().slice(0, 60);
  const cleanEmail = String(email).trim().slice(0, 120);
  const cleanMessage = String(message).trim().slice(0, 200);

  // Catat donatur (tanpa nominal — QRIS statis nominal bebas).
  appendToJson(path.join(DATA_DIR, "donations.json"), {
    name: cleanName,
    email: cleanEmail,
    message: cleanMessage,
    method: "qris-static",
    status: "confirmed-manual",
  });

  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail);
  if (!validEmail) {
    return res.json({ ok: true, emailSent: false, message: "Konfirmasi donasi tercatat." });
  }
  if (!isMailConfigured()) {
    console.warn("[mail] MAIL_USER/MAIL_PASS belum diatur — email terima kasih tidak dikirim.");
    return res.json({ ok: true, emailSent: false, message: "Konfirmasi donasi tercatat." });
  }

  try {
    await sendMail({
      to: cleanEmail,
      subject: "Terima kasih atas donasi kamu! 💛",
      html: donationThankYouEmailHtml({ name: cleanName, message: cleanMessage }),
    });
    console.log(`[mail] terima kasih donasi terkirim ke ${cleanEmail}`);
    res.json({ ok: true, emailSent: true, message: "Email terima kasih terkirim." });
  } catch (e) {
    console.error(`[mail] email terima kasih gagal (${cleanEmail}):`, (e as Error).message);
    res.json({ ok: true, emailSent: false, message: "Donasi tercatat, tapi email gagal terkirim." });
  }
});

/* ------------------------------------------------------------------ */
/*  Donasi SAWERIA QRIS — pembayaran NYATA (port dari saweriaqris)     */
/* ------------------------------------------------------------------ */

const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");
const PAYMENT_TTL_MS = Number(process.env.PAYMENT_TTL_MS || 3 * 60 * 1000); // 3 menit
const PAYMENT_MAX_AMOUNT = Number(process.env.PAYMENT_MAX_AMOUNT || 50_000_000);

// Anti-abuse: maks 5 pembuatan pembayaran per IP per menit.
// (Penting: tiap pembuatan = request nyata ke Saweria — spam berisiko banned.)
const payBuckets = new Map<string, number[]>();
function isPayRateLimited(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (payBuckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    payBuckets.set(ip, arr);
    return true;
  }
  arr.push(now);
  payBuckets.set(ip, arr);
  return false;
}

// Kunci serial untuk read-modify-write payments.json — mencegah lost-update
// saat dua permintaan status/pembayaran berjalan bersamaan.
let paymentsLock: Promise<unknown> = Promise.resolve();
function withPaymentsLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const run = paymentsLock.then(() => fn(), () => fn());
  paymentsLock = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function clientIp(req: express.Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

interface PaymentRecord {
  id: string;
  transactionId: string;
  amount: number;
  name: string;
  email: string;
  message: string;
  method: string;
  frequency: string;
  status: "pending" | "paid" | "expired";
  createdAt: string;
  expiresAt: string;
}

function getPayments(): PaymentRecord[] {
  return readJson(PAYMENTS_FILE, []) as PaymentRecord[];
}

function savePayments(payments: PaymentRecord[]) {
  writeJson(PAYMENTS_FILE, payments);
}

/** Tandai pembayaran lunas (serial, anti lost-update) + sinkron intent. */
async function markPaymentPaid(tx: string): Promise<void> {
  await withPaymentsLock(() => {
    const current = getPayments().find((p) => p.transactionId === tx);
    if (current && current.status !== "paid") {
      current.status = "paid";
      savePayments(getPayments());
    }
    // tandai intent di donations.json
    const donations = readJson(path.join(DATA_DIR, "donations.json"), []) as Record<string, unknown>[];
    const target = donations.find((d) => d.transactionId === tx);
    if (target) target.paymentStatus = "paid";
    writeJson(path.join(DATA_DIR, "donations.json"), donations);
  });
}

/** Buat pembayaran QRIS baru lewat Saweria. Method: saweria | qris. */
app.post("/api/donation/pay", async (req, res) => {
  const { name, email, amount, message = "", frequency = "sekali", method = "saweria" } = req.body ?? {};

  if (!name || !email) {
    return res.status(400).json({ ok: false, error: "Nama dan email wajib diisi" });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Format email tidak valid" });
  }
  const nominal = Number(amount);
  if (!Number.isFinite(nominal) || nominal <= 0) {
    return res.status(400).json({ ok: false, error: "Nominal donasi tidak valid" });
  }
  if (nominal < 10_000) {
    return res.status(400).json({ ok: false, error: "Nominal minimum donasi QRIS adalah Rp10.000" });
  }
  if (nominal > PAYMENT_MAX_AMOUNT) {
    return res.status(400).json({ ok: false, error: `Nominal maksimal Rp${PAYMENT_MAX_AMOUNT.toLocaleString("id-ID")}` });
  }
  if (method !== "saweria" && method !== "qris") {
    return res.status(400).json({ ok: false, error: "Metode QRIS tidak valid" });
  }

  const ip = clientIp(req);
  if (isPayRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "Terlalu banyak pembayaran — coba lagi sebentar lagi" });
  }

  let payment: { qrString: string; transactionId: string };
  try {
    payment = await createPaymentQrSafe({
      username: saweriaConfig().username,
      amount: nominal,
      sender: String(name),
      email: String(email),
      message: String(message),
    });
  } catch (e) {
    const code = (e as { code?: string }).code;
    const status = code === "DISABLED" ? 503 : 502;
    return res.status(status).json({
      ok: false,
      error: (e as Error).message || "Gagal membuat pembayaran Saweria",
    });
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const record: PaymentRecord = {
    id,
    transactionId: payment.transactionId,
    amount: nominal,
    name: String(name).slice(0, 60),
    email: String(email).slice(0, 120),
    message: String(message).slice(0, 200),
    method,
    frequency,
    status: "pending",
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + PAYMENT_TTL_MS).toISOString(),
  };

  // Tulis di bawah kunci agar tidak ada dua request yang saling menimpa array.
  await withPaymentsLock(() => {
    savePayments([...getPayments(), record]);
  });

  // Simpan juga intent ke donations.json agar konsisten dengan riwayat donasi.
  appendToJson(path.join(DATA_DIR, "donations.json"), {
    name: record.name,
    email: record.email,
    amount: nominal,
    frequency,
    method,
    message,
    transactionId: payment.transactionId,
    paymentStatus: "pending",
  });

  // Render QR code sebagai data URL supaya klien cukup menampilkan <img>.
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(payment.qrString, { width: 640, margin: 2 });
  } catch {
    // kegagalan render QR → batal kirim OK agar klien tidak menggantung.
  }
  if (!qrDataUrl) {
    return res.status(500).json({ ok: false, error: "Gagal merender kode QR — silakan coba lagi" });
  }

  res.json({
    ok: true,
    id,
    transactionId: payment.transactionId,
    qrDataUrl,
    amount: nominal,
    expiresInMs: PAYMENT_TTL_MS,
    message: "Kode QRIS berhasil dibuat — silakan scan untuk membayar.",
  });
});

/** Cek status pembayaran (dipanggil polling klien). */
app.get("/api/donation/status/:transactionId", async (req, res) => {
  const transactionId = req.params.transactionId;
  const payments = getPayments();
  const record = payments.find((p) => p.transactionId === transactionId);

  if (!record) {
    return res.status(404).json({ ok: false, error: "Pembayaran tidak ditemukan" });
  }

  if (record.status === "paid") {
    return res.json({ ok: true, paid: true, status: "paid" });
  }
  if (Date.now() > new Date(record.expiresAt).getTime()) {
    await withPaymentsLock(() => {
      const current = getPayments().find((p) => p.transactionId === transactionId);
      if (current && current.status === "pending") {
        current.status = "expired";
        savePayments(getPayments());
      }
    });
    return res.json({ ok: true, paid: false, status: "expired" });
  }

  try {
    const paid = await paidStatusSafe(transactionId);
    if (paid) {
      await markPaymentPaid(transactionId);
    }
    res.json({ ok: true, paid, status: paid ? "paid" : "pending" });
  } catch (e) {
    res.status(502).json({ ok: false, error: (e as Error).message || "Gagal memeriksa status" });
  }
});

/* ------------------------------------------------------------------ */
/*  Webhook Saweria (Integrations → Webhook) + SSE real-time          */
/*  - Webhook: Saweria POST JSON saat donasi dibayar; kita challenge   */
/*    id-nya ke paidStatus() (biar webhook palsu tidak bisa mark paid) */
/*  - SSE: klien subscribe status; push instan via webhook (host       */
/*    selalu-on) + re-check berkala ke Saweria (jalan juga di serverless) */
/* ------------------------------------------------------------------ */

const saweriaWebhookSecret = process.env.SAWERIA_WEBHOOK_SECRET || "";

/** Bandingkan secret secara timing-safe (anti side-channel brute force). */
function secretMatches(input: string): boolean {
  if (!saweriaWebhookSecret) return false;
  const a = createHash("sha256").update(String(input)).digest();
  const b = createHash("sha256").update(saweriaWebhookSecret).digest();
  return timingSafeEqual(a, b);
}
const sseClients = new Map<string, Set<express.Response>>();

/** Push event ke semua klien SSE transaksi tsb, lalu tutup koneksi. */
function pushPaymentStatus(tx: string, payload: unknown) {
  const clients = sseClients.get(tx);
  if (!clients) return;
  const frame = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of [...clients]) {
    try {
      res.write(frame);
      res.end();
    } catch {}
  }
  sseClients.delete(tx);
}

/**
 * Endpoint webhook Saweria. URL di dashboard Saweria:
 * https://<domain>/api/webhooks/saweria/<SAWERIA_WEBHOOK_SECRET>
 * Payload contoh: { id, amount_raw, donator_name, message, ... }
 */
app.post("/api/webhooks/saweria/:secret", async (req, res) => {
  if (!secretMatches(req.params.secret)) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }

  const body = req.body ?? {};
  const tx = String(body.id ?? "").trim().slice(0, 128); // cap: hindari URL raksasa ke Saweria
  if (!tx) {
    // payload malformed — balas 200 agar Saweria tidak retry tanpa henti
    return res.json({ ok: true });
  }

  const record = getPayments().find((p) => p.transactionId === tx);
  if (!record) {
    // bukan transaksi dari website ini — abaikan
    return res.json({ ok: true });
  }
  if (record.status === "paid") {
    return res.json({ ok: true, paid: true });
  }

  try {
    // Challenge: hanya tandai lunas bila Saweria mengonfirmasi status.
    const paid = await paidStatusSafe(tx);
    if (paid) {
      await markPaymentPaid(tx);
      pushPaymentStatus(tx, { ok: true, paid: true, status: "paid" });
      console.log(`[webhook] pembayaran ${tx} lunas (Rp${record.amount.toLocaleString("id-ID")})`);
    }
    res.json({ ok: true, paid });
  } catch (e) {
    // challenge gagal (jaringan) → minta Saweria retry nanti
    res.status(502).json({ ok: false, error: (e as Error).message });
  }
});

/**
 * SSE stream status pembayaran — real-time tanpa polling dari klien.
 * 1) push instan dari webhook (host selalu-on),
 * 2) re-check berkala ke Saweria selama terhubung (jalan juga di serverless).
 */
app.get("/api/donation/stream/:transactionId", (req, res) => {
  const tx = req.params.transactionId;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (payload: unknown) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
  send({ ok: true, status: "connected" });

  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const finish = (payload: unknown) => {
    if (stopped) return;
    stopped = true;
    if (timer) clearInterval(timer);
    const clients = sseClients.get(tx);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) sseClients.delete(tx);
    }
    try {
      send(payload);
      res.end();
    } catch {}
  };

  const check = async () => {
    if (stopped) return;
    const record = getPayments().find((p) => p.transactionId === tx);
    if (!record) return finish({ ok: false, error: "not_found" });
    if (record.status === "paid") return finish({ ok: true, paid: true, status: "paid" });
    if (Date.now() > new Date(record.expiresAt).getTime()) {
      return finish({ ok: true, paid: false, status: "expired" });
    }
    try {
      const paid = await paidStatusSafe(tx);
      if (paid) {
        await markPaymentPaid(tx);
        // re-check stopped: webhook bisa saja sudah push + menutup stream ini
        // selagi kita menunggu challenge — jangan tulis frame ganda.
        if (stopped) return;
        return finish({ ok: true, paid: true, status: "paid" });
      }
    } catch {
      // jaringan/temporary — coba lagi tick berikutnya
    }
  };

  const set = sseClients.get(tx) ?? new Set();
  set.add(res);
  sseClients.set(tx, set);
  // pasang interval DULU, lalu check() — bila check() menyelesaikan stream
  // secara sinkron, timer sudah ada dan ikut dibersihkan oleh finish().
  // Interval 15 detik: webhook adalah sinyal utama; re-check hanya cadangan
  // (serverless) sehingga beban request eksternal ke Saweria tetap rendah.
  timer = setInterval(check, 15_000);
  check();

  res.on("close", () => {
    stopped = true;
    if (timer) clearInterval(timer);
    const clients = sseClients.get(tx);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) sseClients.delete(tx);
    }
  });
  res.on("error", () => {});
});

/* ------------------------------------------------------------------ */
/*  Playground — simulated AI gateway with real SSE streaming          */
/* ------------------------------------------------------------------ */

/**
 * Status playground. Default TIDAK tersedia (backend gateway belum
 * terhubung). Set PLAYGROUND_ENABLED=1 di .env untuk mengaktifkannya.
 */
app.get("/api/playground/status", (_req, res) => {
  const available = process.env.PLAYGROUND_ENABLED === "1";
  res.json({
    available,
    reason: available ? undefined : "Playground sedang kosong — gateway AI belum terhubung.",
  });
});

const PLAYGROUND_REPLIES: Record<string, string[]> = {
  openai: [
    "Halo! Saya OpenAI GPT-4.1 yang di-routing melalui DikaRoute.",
    "Satu endpoint, banyak provider — itulah kekuatan DikaRoute.",
  ],
  anthropic: [
    "Halo! Saya Claude dari Anthropic, melayani request Anda.",
    "DikaRoute menangani fallback otomatis bila saya sibuk.",
  ],
  gemini: [
    "Halo! Saya Gemini dari Google, siap membantu.",
    "Routing health-based memastikan provider terbaik yang melayani.",
  ],
  ollama: [
    "Halo! Saya model lokal via Ollama — tanpa biaya API.",
    "Provider lokal tetap aman dengan SSRF guard bawaan.",
  ],
  local: [
    "Halo! Saya di-routing ke model lokal (LM Studio / vLLM).",
    "Latensi super rendah, data tidak meninggalkan mesin Anda.",
  ],
};

app.post("/api/playground", (req, res) => {
  const { provider = "openai", message = "" } = req.body ?? {};
  const replies = PLAYGROUND_REPLIES[provider] ?? PLAYGROUND_REPLIES.openai;
  const reply = `[${provider}] ${replies[0]}\n\nAnda menulis: "${message.slice(0, 80)}"\n\n→ DikaRoute memilih ${provider} dengan strategi auto-fallback.`;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const pipeline = [
    { step: "router", label: "Router memilih provider" },
    { step: "compression", label: "Kompresi konteks (RTK/CCR)" },
    { step: "rate-limit", label: "Cek rate-limit & budget" },
    { step: "provider", label: `Forward ke ${provider}` },
  ];
  let i = 0;
  const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  let chunk: ReturnType<typeof setInterval> | null = null;
  let j = 0;

  const tick = setInterval(() => {
    if (i < pipeline.length) {
      send({ type: "pipeline", step: pipeline[i] });
      i += 1;
      return;
    }
    clearInterval(tick);
    chunk = setInterval(() => {
      if (j <= reply.length) {
        send({ type: "token", text: reply.slice(0, j) });
        j += 2;
      } else {
        if (chunk) clearInterval(chunk);
        send({ type: "done", usage: { tokens: reply.length / 4, cost: "$0.0012" } });
        res.end();
      }
    }, 16);
  }, 450);

  // Pakai res.on('close') — req.on('close') terpicu segera setelah body
  // POST selesai dibaca (express.json), yang akan membatalkan interval
  // sebelum event pertama terkirim. Bersihkan SEMUA interval saat client
  // disconnect dan jaga dari error write ke socket yang sudah mati.
  res.on("close", () => {
    clearInterval(tick);
    if (chunk) clearInterval(chunk);
  });
  res.on("error", () => {});
});

/* ------------------------------------------------------------------ */
/*  Static hosting (production, NON-Vercel)                            */
/*  Di Vercel, file statis disajikan oleh platform sendiri — fungsi   */
/*  ini hanya melayani /api/* dan tidak perlu express.static.          */
/* ------------------------------------------------------------------ */

if (isProd && !isVercel) {
  const dist = path.join(root, "dist");
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

export { app };
