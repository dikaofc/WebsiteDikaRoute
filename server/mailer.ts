import nodemailer from "nodemailer";
import { loadEnv } from "./env.js";

// WAJIB load env dulu sebelum membaca MAIL_USER/MAIL_PASS — karena modul ini
// dieksekusi sebelum body server/index.ts berjalan (urutan import ESM).
loadEnv();

const user = process.env.MAIL_USER;
const pass = process.env.MAIL_PASS;
// MAIL_DISABLED=1 / MAIL_DRY_RUN=1 → tidak benar-benar mengirim (untuk tes/E2E)
const dryRun = process.env.MAIL_DISABLED === "1" || process.env.MAIL_DRY_RUN === "1";

const transporter =
  user && pass && !dryRun
    ? nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user, pass },
        connectionTimeout: 10_000,
        socketTimeout: 15_000,
      })
    : null;

export function isMailConfigured() {
  return transporter !== null;
}

const stripCrlf = (s: string) => String(s).replace(/[\r\n]+/g, " ").trim();

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  if (!transporter || !user) {
    if (dryRun) {
      console.log(`[mail:dry-run] → ${opts.to} | ${opts.subject}`);
      return;
    }
    throw new Error("MAIL_USER / MAIL_PASS belum dikonfigurasi di .env");
  }
  return transporter.sendMail({
    from: `"DikaRoute"`,
    to: stripCrlf(opts.to),
    subject: stripCrlf(opts.subject).slice(0, 120),
    html: opts.html,
    text: opts.text ?? "buka email ini di klien yang mendukung HTML.",
  });
}

const emailShell = (body: string, footer?: string) => `
<div style="background:#070812;padding:28px 16px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#0d1022;border:1px solid #232745;border-radius:16px;overflow:hidden">
    <div style="padding:22px 28px;border-bottom:1px solid #232745">
      <span style="font-size:19px;font-weight:700;color:#fff">Dika<span style="color:#818cf8">Route</span></span>
    </div>
    <div style="padding:28px">${body}</div>
    <div style="padding:18px 28px;border-top:1px solid #232745;font-size:12px;color:#7b82a0;line-height:1.7">
      ${footer ?? `Unified AI Gateway &amp; Intelligent Model Router · MIT License<br/>
      <a href="${baseUrl()}/unsubscribe" style="color:#818cf8">Berhenti berlangganan</a>`}
    </div>
  </div>
</div>`;

function baseUrl() {
  return (process.env.BASE_URL || "http://localhost:4000").replace(/\/$/, "");
}

export function welcomeEmailHtml(): string {
  return emailShell(`
    <h1 style="margin:0 0 12px;font-size:22px;color:#fff">Selamat datang di DikaRoute!</h1>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#b7bdd8">
      Terima kasih sudah berlangganan <b style="color:#fff">berita rilis DikaRoute</b>.
      Anda akan menerima notifikasi setiap ada versi baru — lengkap dengan catatan
      perubahan, langsung dari GitHub.
    </p>
    <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#b7bdd8">
      Sementara itu, siapkan gateway AI Anda dalam 60 detik:
    </p>
    <div style="background:#0b0d1c;border:1px solid #232745;border-radius:10px;padding:14px 16px;font-family:monospace;font-size:13px;color:#a5b4fc">
      npm install -g dikaroute && dikaroute
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:#7b82a0">
      Satu endpoint. 290+ provider AI. Auto-fallback bawaan.
    </p>
  `);
}

/** Email terima kasih donasi (QRIS statis — tombol "Saya Sudah Membayar"). */
export function donationThankYouEmailHtml(opts: { name?: string; message?: string }): string {
  const name = stripCrlf(opts.name || "Donatur");
  const msg = stripCrlf(opts.message || "");
  return emailShell(
    `
    <h1 style="margin:0 0 12px;font-size:22px;color:#fff">Terima kasih, ${name}! 💛</h1>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#b7bdd8">
      Donasi kamu sangat berarti untuk pengembangan <b style="color:#fff">DikaRoute</b> —
      Unified AI Gateway yang gratis dan open source.
    </p>
    ${
      msg
        ? `<blockquote style="margin:0 0 14px;padding:12px 16px;border-left:3px solid #818cf8;background:#0b0d1c;border-radius:8px;font-size:13px;color:#b7bdd8">“${msg}”</blockquote>`
        : ""
    }
    <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#b7bdd8">
      Setiap rupiah membantu menutup biaya server &amp; pengembangan fitur baru.
    </p>
    <div style="background:#0b0d1c;border:1px solid #232745;border-radius:10px;padding:14px 16px;font-family:monospace;font-size:13px;color:#a5b4fc">
      npm install -g dikaroute && dikaroute
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:#7b82a0">
      Satu endpoint. 290+ provider AI. Auto-fallback bawaan.
    </p>`,
    // footer tanpa link unsubscribe — donatur tidak berlangganan newsletter
    `Unified AI Gateway &amp; Intelligent Model Router · MIT License`
  );
}

export function releaseEmailHtml(opts: {
  version: string;
  date: string;
  notes: string[];
  url: string;
}): string {
  const items = opts.notes
    .map((n) => `<li style="margin:0 0 8px;font-size:13.5px;line-height:1.6;color:#b7bdd8">${stripCrlf(n)}</li>`)
    .join("");
  return emailShell(`
    <h1 style="margin:0 0 6px;font-size:22px;color:#fff">DikaRoute v${stripCrlf(opts.version)} telah rilis!</h1>
    <p style="margin:0 0 18px;font-size:13px;color:#818cf8">Tanggal rilis: ${stripCrlf(opts.date)}</p>
    <div style="background:#0b0d1c;border:1px solid #232745;border-radius:12px;padding:18px 20px">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#7b82a0">Catatan perubahan</p>
      <ul style="margin:0;padding-left:18px">${items}</ul>
    </div>
    <p style="margin:22px 0 0">
      <a href="${opts.url}" style="display:inline-block;background:linear-gradient(120deg,#6366f1,#22d3ee);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px">
        Lihat Rilis Lengkap
      </a>
    </p>
    <p style="margin:18px 0 0;font-size:12px;color:#7b82a0">
      Perbarui dengan: <code style="background:#0b0d1c;padding:2px 6px;border-radius:6px;color:#a5b4fc">npm install -g dikaroute@latest</code>
    </p>
  `);
}
