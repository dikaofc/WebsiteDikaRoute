import path from "node:path";
import fs from "node:fs";

/**
 * Root proyek. Sengaja TIDAK memakai import.meta.url — Vercel meng-compile
 * fungsi serverless ke CJS di mana referensi `import.meta` bisa menjadi
 * SyntaxError (tergantung compiler) atau undefined (esbuild). process.cwd()
 * aman di semua mode: di Vercel cwd = root fungsi (/var/task), di lokal
 * (npm start / tsx dari root proyek) cwd = folder proyek.
 */
const root = process.cwd();

/** Load `.env` dari root proyek (idempoten, tidak menimpa env yang sudah ada). */
export function loadEnv() {
  try {
    const envPath = path.join(root, ".env");
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {}
}
