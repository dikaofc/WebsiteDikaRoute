/**
 * Vercel Serverless Function — entry tunggal untuk semua /api/*.
 *
 * Routing: vercel.json me-rewrite /api/(.*) → /api/index, sehingga seluruh
 * request API masuk ke Express app ini. Vercel menyuntikkan env vars ke
 * process.env; server/app.ts memuat .env sendiri (loadEnv idempoten).
 * Path asli (/api/health, /api/donation/pay, …) dipertahankan oleh rewrite,
 * jadi semua route Express cocok apa adanya.
 */
import { app } from "../server/app.ts";

export const config = {
  maxDuration: 30,
};

export default app;
