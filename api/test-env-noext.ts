/** Diagnostic — import dari luar api/ TANPA ekstensi file. */
import { loadEnv } from "../server/env";

export default (req, res) => {
  loadEnv();
  res.status(200).json({ ok: true, env: "loaded-noext" });
};
