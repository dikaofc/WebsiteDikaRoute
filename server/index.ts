import { app } from "./app.js";

const PORT = Number(process.env.PORT || 4000);
const isProd = process.env.NODE_ENV === "production";

app.listen(PORT, () => {
  console.log(`⚡ DikaRoute website API running on http://localhost:${PORT}`);
  if (!isProd) console.log(`   Dev client: http://localhost:5173 (proxy /api → :${PORT})`);
});
