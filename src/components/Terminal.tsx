import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCircle2, Loader2, Sparkles, Shuffle, Brain, ShieldCheck, Zap, Antenna } from "lucide-react";
import { useLang } from "../i18n";

const COMMAND = 'curl http://localhost:20128/v1/chat/completions -H "Authorization: Bearer $KEY" -d \'{"model": "auto", "messages": [{"role": "user", "content": "Halo AI"}]}\'';

const PIPELINE_ICONS = [Shuffle, Brain, ShieldCheck, Zap, Antenna];

function typeWriter(text: string, speed = 26, onDone?: (current: string) => void) {
  return new Promise<string>((resolve) => {
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      const current = text.slice(0, i);
      onDone?.(current);
      if (i >= text.length) {
        clearInterval(timer);
        resolve(text);
      }
    }, speed);
  });
}

export default function Terminal() {
  const { dict } = useLang();
  const t = dict.terminal;
  const pipeline = t.pipeline;
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "pipeline" | "done">("typing");
  const [visible, setVisible] = useState<number[]>([]);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const run = async () => {
      setTyped("");
      setVisible([]);
      setPhase("typing");
      await typeWriter(COMMAND, 14, (cur) => !cancelled && setTyped(cur));
      if (cancelled) return;
      setPhase("pipeline");
      for (let i = 0; i < pipeline.length; i++) {
        timers.push(
          setTimeout(() => {
            if (!cancelled) setVisible((v) => [...v, i]);
          }, 350 * (i + 1))
        );
      }
      timers.push(
        setTimeout(() => {
          if (!cancelled) {
            setPhase("done");
            setTimeout(() => {
              if (!cancelled) {
                setCycle((c) => c + 1);
              }
            }, 2600);
          }
        }, 350 * pipeline.length + 700)
      );
    };

    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [cycle, pipeline]);

  return (
    <div className="glass relative overflow-hidden rounded-2xl glow-ring">
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-xs text-slate-400">dikaroute — localhost:20128</span>
        <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {t.live}
        </span>
      </div>

      {/* body */}
      <div className="min-h-[330px] p-4 font-mono text-[12.5px] leading-relaxed sm:p-5 sm:text-[13px]">
        <div className="mb-3 flex items-center gap-2 text-slate-500">
          <span className="text-emerald-400">➜</span>
          <span>~</span>
        </div>
        <div className="mb-2 whitespace-pre-wrap break-all text-slate-200">
          <span className="text-fuchsia-400">$</span> {typed}
          {phase === "typing" && <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-blink bg-accent" />}
        </div>

        <div className="mt-1 space-y-1.5">
          <AnimatePresence>
            {visible.map((idx) => {
              const Icon = PIPELINE_ICONS[idx];
              return (
                <motion.div
                  key={`${cycle}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-2 text-slate-300"
                >
                  <span className="mt-px text-slate-600">│</span>
                  <span className="flex shrink-0 items-center text-indigo-300"><Icon size={13} /></span>
                  <span>
                    {pipeline[idx]}
                    <Check size={12} className="ml-2 inline text-emerald-400" />
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {phase === "pipeline" && visible.length < pipeline.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 flex items-center gap-2 text-slate-500"
            >
              <Loader2 size={13} className="animate-spin text-indigo-400" />
              {t.processing}
            </motion.div>
          )}
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-300"
            >
              <CheckCircle2 size={15} />
              <span className="flex items-center gap-1.5 font-semibold">
                {t.done} <Sparkles size={13} />
              </span>
              <span className="ml-auto text-[11px] text-emerald-400/70">
                {t.summary}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* glow */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-transparent to-accent/20 opacity-60 blur-md" />
    </div>
  );
}
