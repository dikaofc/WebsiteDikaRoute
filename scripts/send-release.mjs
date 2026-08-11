#!/usr/bin/env node
/**
 * Kirim notifikasi rilis terbaru ke semua subscriber newsletter.
 * Konten diambil OTOMATIS dari CHANGELOG.md DikaRoute di GitHub.
 *
 * Pemakaian:
 *   npm run broadcast            # kirim ke semua subscriber
 *   npm run broadcast -- --to kamu@email.com   # kirim test ke satu email
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// --- load .env sederhana ---
function loadEnv() {
  try {
    const envPath = path.join(root, ".env");
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      const value = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {}
}
loadEnv();

const USER = process.env.MAIL_USER;
const PASS = process.env.MAIL_PASS;

if (!USER || !PASS) {
  console.error("❌ MAIL_USER / MAIL_PASS belum diatur di .env");
  process.exit(1);
}

const toFlag = process.argv.indexOf("--to");
const testTo = toFlag !== -1 ? process.argv[toFlag + 1] : null;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: USER, pass: PASS },
  connectionTimeout: 10_000,
  socketTimeout: 15_000,
});

const stripCrlf = (s) => String(s).replace(/[\r\n]+/g, " ").trim();

function parseChangelog(md) {
  const releases = [];
  let current = null;
  let sectionName = "";
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    const h = line.match(/^##\s+\[([^\]]+)\]\s*-\s*([\d-]+)/);
    if (h) {
      if (current) releases.push(current);
      current = { version: h[1], date: h[2], sections: [] };
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
    if (item && current.sections.length) current.sections[current.sections.length - 1].items.push(item[1]);
  }
  if (current) releases.push(current);
  return releases;
}

const shell = (body) => `
<div style="background:#070812;padding:28px 16px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#0d1022;border:1px solid #232745;border-radius:16px;overflow:hidden">
    <div style="padding:22px 28px;border-bottom:1px solid #232745">
      <span style="font-size:19px;font-weight:700;color:#fff">Dika<span style="color:#818cf8">Route</span></span>
    </div>
    <div style="padding:28px">${body}</div>
    <div style="padding:18px 28px;border-top:1px solid #232745;font-size:12px;color:#7b82a0">
      Unified AI Gateway &amp; Intelligent Model Router · MIT License<br/>
      Berhenti berlangganan: balas email ini atau hubungi Telegram @dikaacode.
    </div>
  </div>
</div>`;

async function main() {
  console.log("📦 Mengambil changelog terbaru dari GitHub…");
  const res = await fetch("https://raw.githubusercontent.com/dikaofc/DikaRoute/main/CHANGELOG.md", {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
  const latest = parseChangelog(await res.text())[0];
  if (!latest) throw new Error("Tidak ada rilis ditemukan");
  console.log(`   → Rilis terbaru: v${latest.version} (${latest.date})`);

  const notes = latest.sections.flatMap((s) => s.items).slice(0, 6);
  const html = shell(`
    <h1 style="margin:0 0 6px;font-size:22px;color:#fff">DikaRoute v${latest.version} telah rilis!</h1>
    <p style="margin:0 0 18px;font-size:13px;color:#818cf8">Tanggal rilis: ${latest.date}</p>
    <div style="background:#0b0d1c;border:1px solid #232745;border-radius:12px;padding:18px 20px">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#7b82a0">Catatan perubahan</p>
      <ul style="margin:0;padding-left:18px;color:#b7bdd8;font-size:13.5px;line-height:1.6">${notes.map((n) => `<li>${n}</li>`).join("")}</ul>
    </div>
    <p style="margin:22px 0 0">
      <a href="https://github.com/dikaofc/DikaRoute/releases" style="display:inline-block;background:linear-gradient(120deg,#6366f1,#22d3ee);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px">Lihat Rilis Lengkap</a>
    </p>
  `);

  let recipients = [];
  if (testTo) {
    recipients = [testTo];
    console.log(`🧪 Mode test → ${testTo}`);
  } else {
    const subsFile = path.join(root, "server/data/newsletter.json");
    if (!fs.existsSync(subsFile)) {
      console.error("❌ Belum ada subscriber (server/data/newsletter.json kosong)");
      process.exit(1);
    }
    recipients = JSON.parse(fs.readFileSync(subsFile, "utf-8")).map((s) => s.email).filter(Boolean);
    console.log(`👥 Subscriber: ${recipients.length}`);
  }    const subject = `🚀 DikaRoute v${latest.version} telah rilis!`;
  let sent = 0;
  let failed = 0;
  for (const rawTo of recipients) {
    const to = stripCrlf(rawTo);
    try {
      await transporter.sendMail({
        from: `"DikaRoute" <${USER}>`,
        to,
        subject: stripCrlf(subject).slice(0, 120),
        html,
        text: `DikaRoute v${latest.version} telah rilis! Lihat di ${latest.url ?? "https://github.com/dikaofc/DikaRoute/releases"}`,
      });
      sent += 1;
      console.log(`   ✅ ${to}`);
    } catch (e) {
      failed += 1;
      console.error(`   ❌ ${to}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`\n🎉 Selesai: ${sent} terkirim, ${failed} gagal${testTo ? " (mode test)" : ""}.`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("❌ Gagal:", e.message);
  process.exit(1);
});
