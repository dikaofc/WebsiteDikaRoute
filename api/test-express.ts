/** Diagnostic — import express saja. */
import express from "express";

export default (req, res) => {
  const a = express();
  res.status(200).json({ ok: true, express: typeof a.get });
};
