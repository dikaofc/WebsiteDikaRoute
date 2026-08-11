/**
 * Vercel Serverless Function — catch-all /api/*.
 *
 * Vercel menyuntikkan env vars ke process.env, lalu memanggil handler ini.
 * Express di server/app.ts sudah memuat .env sendiri (loadEnv idempoten,
 * tidak menimpa env Vercel). Path asli (/api/health, /api/donation/pay, …)
 * dipertahankan oleh Vercel, jadi semua route Express cocok apa adanya.
 */
import { app } from "../server/app";

export const config = {
  maxDuration: 30,
  supportsResponseStreaming: true,
};

export default app;
