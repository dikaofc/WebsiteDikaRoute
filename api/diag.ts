/**
 * Diagnostic — laporan lingkungan runtime serverless Vercel.
 * Tanpa import eksternal agar bebas dari risiko bundling.
 */
export default (req, res) => {
  res.status(200).json({
    ok: true,
    path: req.url,
    cwd: process.cwd(),
    node: process.version,
    nodeEnv: process.env.NODE_ENV || null,
    vercel: process.env.VERCEL || null,
    pid: process.pid,
  });
};
