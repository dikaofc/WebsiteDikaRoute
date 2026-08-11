// Validasi SSE terhadap server yang berjalan di :4000
const BASE = "http://localhost:4000";

const res = await fetch(`${BASE}/api/playground`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ provider: "ollama", message: "tes SSE" }),
  signal: AbortSignal.timeout(12000),
});
console.log("HTTP", res.status);

const reader = res.body.getReader();
const dec = new TextDecoder();
let buf = "";
let pipe = 0;
let tok = 0;
let done = false;
const t0 = Date.now();
while (true) {
  const { done: d, value } = await reader.read();
  if (d) break;
  buf += dec.decode(value, { stream: true });
  const evs = buf.split("\n\n");
  buf = evs.pop() ?? "";
  for (const e of evs) {
    const l = e.trim();
    if (!l.startsWith("data:")) continue;
    const j = JSON.parse(l.slice(5));
    if (j.type === "pipeline") pipe++;
    if (j.type === "token") tok++;
    if (j.type === "done") done = true;
  }
}
console.log(`pipeline=${pipe} tokenEvents=${tok} done=${done} ms=${Date.now() - t0}`);
process.exit(pipe === 4 && tok > 3 && done ? 0 : 1);
