/** Diagnostic — import file dari luar folder api/ (server/env.ts). */
import { loadEnv } from "../server/env.ts";

export default (req, res) => {
  loadEnv();
  res.status(200).json({ ok: true, env: "loaded" });
};
