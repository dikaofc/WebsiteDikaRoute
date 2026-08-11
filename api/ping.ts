/**
 * Diagnostic — fungsi minimal tanpa import & tanpa config.
 * Untuk menguji apakah infrastruktur serverless Vercel-nya sendiri jalan.
 */
export default (req, res) => {
  res.status(200).json({ ok: true, path: req.url });
};
