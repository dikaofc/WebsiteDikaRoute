/** Diagnostic — import dari luar api/ dengan ekstensi .js (konvensi ESM). */
import { loadEnv } from "../server/env.js";

export default (req, res) => {
  loadEnv();
  res.status(200).json({ ok: true, env: "loaded-js" });
};
