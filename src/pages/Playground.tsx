import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Cpu,
  Server,
  Github,
  Sparkles,
  Terminal as TerminalIcon,
  Construction,
  Clock,
  BookOpen,
  Package,
  MessageSquare,
  RefreshCw,
  Info,
} from "lucide-react";
import clsx from "clsx";
import { Reveal, PageHero, GradientTitle, GlassSelect, GlassSkeleton, btnClass } from "../lib/ui";
import { api } from "../lib/api";
import { useLang } from "../i18n";

// ikon = path brand asli (lihat public/providers/); null = pakai ikon generik
const PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "/providers/openai.svg", color: "text-emerald-300 border-emerald-400/30", hint: "gpt-4.1 · auto-fallback" },
  { id: "anthropic", name: "Anthropic", icon: "/providers/anthropic.svg", color: "text-amber-300 border-amber-400/30", hint: "claude-sonnet · priority" },
  { id: "gemini", name: "Gemini", icon: "/providers/google.svg", color: "text-cyan-300 border-cyan-400/30", hint: "gemini-2.5 · health-based" },
  { id: "ollama", name: "Ollama", icon: "/providers/ollama.svg", color: "text-indigo-300 border-indigo-400/30", hint: "llama3 · round-robin" },
  { id: "local", name: "Local", icon: null, color: "text-pink-300 border-pink-400/30", hint: "vLLM / LM Studio" },
];

const STRATEGIES = ["auto-fallback", "priority", "round-robin", "health-based", "model-based", "custom-rules"];

interface PipeStep {
  step: string;
  label: string;
}

function UnavailableScreen({ onRetry }: { onRetry: () => void }) {
  const { dict } = useLang();
  const u = dict.playground.unavailable;
  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rotate-12 bg-indigo-500/10" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative mx-auto max-w-2xl rounded-3xl p-10 text-center sm:p-14"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-300 glow-ring"
        >
          <Construction size={30} />
        </motion.div>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          {u.badge}
        </span>

        <h2 className="mt-5 font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-[2rem]">
          {u.title1}<br />
          <span className="gradient-text">{u.title2}</span>
        </h2>

        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
          {u.desc}
        </p>

        <div className="mx-auto mt-7 flex max-w-md flex-wrap items-center justify-center gap-3">
          <Link to="/docs" className={btnClass("primary")}>
            <BookOpen size={15} /> {u.docs}
          </Link>
          <Link to="/changelog" className={btnClass("glass", undefined, "text-slate-200 hover:text-white")}>
            <Package size={15} /> {u.changelog}
          </Link>
          <Link to="/forum" className={btnClass("glass", undefined, "text-slate-200 hover:text-white")}>
            <MessageSquare size={15} /> {u.forum}
          </Link>
        </div>

        <button
          onClick={onRetry}
          className="mx-auto mt-8 flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-white"
        >
          <RefreshCw size={13} /> {u.retry}
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Clock size={12} /> {u.eta}
        </p>
      </motion.div>
    </div>
  );
}

function PlaygroundSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="glass-2 rounded-3xl p-6">
        <GlassSkeleton className="h-5 w-40" />
        <div className="mt-6 grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => <GlassSkeleton key={i} className="h-[4.5rem] rounded-xl" />)}
        </div>
        <GlassSkeleton className="mt-6 h-11 rounded-xl" />
        <GlassSkeleton className="mt-4 h-24 rounded-xl" />
        <GlassSkeleton className="mt-5 h-11 rounded-xl" />
      </div>
      <div className="glass-2 overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 px-4 py-3">
          <GlassSkeleton className="h-4 w-56" />
        </div>
        <div className="p-6">
          <GlassSkeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function Playground() {
  const { dict } = useLang();
  const p = dict.playground;
  const [availability, setAvailability] = useState<"loading" | "ok" | "unavailable">("loading");
  const [provider, setProvider] = useState("openai");
  const [strategy, setStrategy] = useState("auto-fallback");
  const [message, setMessage] = useState("Halo DikaRoute! Jelaskan cara kerja auto-fallback.");
  const [running, setRunning] = useState(false);
  const [pipeline, setPipeline] = useState<PipeStep[]>([]);
  const [tokens, setTokens] = useState("");
  const [done, setDone] = useState(false);
  const [usage, setUsage] = useState<{ tokens: number; cost: string } | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    api
      .playgroundStatus()
      .then((s) => setAvailability(s.available ? "ok" : "unavailable"))
      // Fail-safe: kalau API error (mis. fungsi serverless down), jangan
      // tampilkan playground sebagai aktif — lebih aman tampil "unavailable".
      .catch(() => setAvailability("unavailable"));
  }, []);

  const retryStatus = () => {
    setAvailability("loading");
    api
      .playgroundStatus()
      .then((s) => setAvailability(s.available ? "ok" : "unavailable"))
      // Fail-safe: kalau API error (mis. fungsi serverless down), jangan
      // tampilkan playground sebagai aktif — lebih aman tampil "unavailable".
      .catch(() => setAvailability("unavailable"));
  };

  const reset = () => {
    abortRef.current?.abort();
    setPipeline([]);
    setTokens("");
    setDone(false);
    setUsage(null);
    setError("");
    setRunning(false);
  };

  const run = async () => {
    reset();
    setRunning(true);
    const controller = new AbortController();
    const watchdog = setTimeout(() => controller.abort(), 20000);
    abortRef.current = controller;

    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, message }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(p.config.backendError);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());
            if (data.type === "pipeline") setPipeline((prev) => [...prev, data.step]);
            if (data.type === "token") setTokens(data.text);
            if (data.type === "done") {
              setUsage(data.usage);
              setDone(true);
            }
          } catch {
            // event rusak/terpotong — abaikan
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      }
    } finally {
      clearTimeout(watchdog);
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-24 sm:px-6">
      <PageHero
        eyebrow={p.eyebrow}
        title={<GradientTitle parts={p.title} />}
        description={p.desc}
      />

      {availability === "loading" ? (
        <div className="py-4">
          <PlaygroundSkeleton />
        </div>
      ) : availability === "unavailable" ? (
        <UnavailableScreen onRetry={retryStatus} />
      ) : (
        <>
        <div className="glass-3 mb-6 flex items-start gap-3 rounded-xl px-4 py-3 text-xs leading-relaxed text-slate-500">
          <Info size={14} className="mt-0.5 shrink-0 text-amber-400" />
          {p.demoNote}
        </div>
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* config panel */}
        <Reveal>
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Cpu size={17} className="text-indigo-300" />
              <h3 className="font-display text-base font-bold text-white">{p.config.title}</h3>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{p.config.provider}</label>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {PROVIDERS.map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => setProvider(pr.id)}
                    className={clsx(
                      "rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                      provider === pr.id
                        ? "glass-2 border-indigo-400/60 text-white"
                        : "glass-3 text-slate-400 hover:border-white/25"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {/* chip putih agar logo brand terlihat di dark & light */}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white p-[3px] shadow-sm">
                        {pr.icon ? (
                          <img src={pr.icon} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                        ) : (
                          <Server size={14} className="text-slate-500" />
                        )}
                      </span>
                      <span className="text-sm font-semibold">{pr.name}</span>
                    </div>
                    <div className="mt-1 text-[10px] opacity-70">{pr.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{p.config.strategy}</label>
              <div className="mt-2.5">
                <GlassSelect value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                  {STRATEGIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </GlassSelect>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{p.config.message}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mt-2.5 w-full resize-none rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
                placeholder={p.config.placeholder}
              />
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={run}
                disabled={running}
                className={clsx(btnClass("primary"), "flex-1 text-sm text-white")}
              >
                {running ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {running ? p.config.streaming : p.config.send}
              </button>
              <button
                onClick={reset}
                className={btnClass("icon", undefined, "text-slate-300 hover:text-white")}
                aria-label={p.config.reset}
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>
            )}
          </div>
        </Reveal>

        {/* output panel */}
        <Reveal delay={0.1}>
          <div className="glass overflow-hidden rounded-3xl">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-xs text-slate-400">
                {p.output.endpoint}
              </span>
              <span
                className={clsx(
                  "ml-auto flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                  running ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-300" : "border-white/10 bg-white/5 text-slate-500"
                )}
              >
                <span className={clsx("h-1.5 w-1.5 rounded-full", running ? "animate-pulse bg-indigo-400" : "bg-slate-500")} />
                {running ? p.output.connected : p.output.idle}
              </span>
            </div>

            <div className="min-h-[420px] p-5">
              {pipeline.length === 0 && !done && !error && (
                <div className="flex h-full min-h-[380px] flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/25 bg-indigo-500/10">
                    {(() => {
                      const active = PROVIDERS.find((pr) => pr.id === provider);
                      return active?.icon ? (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-[3px] shadow-sm">
                          <img src={active.icon} alt={active.name} width={28} height={28} className="h-7 w-7 object-contain" />
                        </span>
                      ) : (
                        <Server size={24} className="text-indigo-300" />
                      );
                    })()}
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold text-white">{p.output.readyTitle}</p>
                    <p className="mt-1 max-w-xs text-sm text-slate-500">
                      {(() => {
                        const [before, after] = p.output.readyDesc.split("{send}");
                        return (<>{before}<b className="text-slate-300">{p.config.send}</b>{after}</>);
                      })()}
                    </p>
                  </div>
                </div>
              )}

              {pipeline.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  <AnimatePresence>
                    {pipeline.map((step, i) => (
                      <motion.div
                        key={`${step.step}-${i}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-3 flex items-center gap-3 rounded-lg px-3 py-2"
                      >
                        <span className="font-mono text-[10px] font-bold text-indigo-300">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-sm text-slate-300">{step.label}</span>
                        {i === pipeline.length - 1 && running && <Loader2 size={13} className="ml-auto animate-spin text-indigo-400" />}
                        {i < pipeline.length - 1 && <CheckCircle2 size={14} className="ml-auto text-emerald-400" />}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <div className="glass-2 rounded-xl p-4 font-mono text-[13px] leading-relaxed">
                {tokens ? (
                  <p className="whitespace-pre-wrap text-slate-200">
                    <span className="mr-2 text-emerald-400">›</span>
                    {tokens}
                    {running && <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-blink bg-accent" />}
                  </p>
                ) : (
                  <p className="text-slate-600">{p.output.placeholder}</p>
                )}
              </div>

              <AnimatePresence>
                {done && usage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300"
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Sparkles size={13} /> {p.output.done}
                    </span>
                    <span className="rounded-full border border-emerald-400/25 px-2 py-0.5">{p.output.tokens}: {Math.round(usage.tokens)}</span>
                    <span className="rounded-full border border-emerald-400/25 px-2 py-0.5">{p.output.cost}: {usage.cost}</span>
                    <span className="rounded-full border border-emerald-400/25 px-2 py-0.5">{p.output.strategy}: {strategy}</span>
                    <span className="rounded-full border border-emerald-400/25 px-2 py-0.5">{p.output.provider}: {provider}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 border-t border-white/10 bg-white/[0.02] px-4 py-3 text-[11px] text-slate-500">
              <TerminalIcon size={12} />
              {p.output.footer}
              <a
                href="https://github.com/dikaofc/DikaRoute"
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1 text-slate-400 transition-colors hover:text-white"
              >
                <Github size={11} /> {p.output.real}
              </a>
            </div>
          </div>
        </Reveal>
        </div>
        </>
      )}
    </div>
  );
}
