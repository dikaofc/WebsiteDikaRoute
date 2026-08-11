import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// CJS-safe: saat fungsi di-bundle oleh Vercel (CJS), import.meta.url = undefined
// (esbuild mengubahnya jadi objek kosong) → fallback ke process.cwd().
// Native ESM (tsx / npm start) tetap memakai import.meta.url → root = proyek.
const root =
  typeof import.meta.url === "string"
    ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    : process.cwd();

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
