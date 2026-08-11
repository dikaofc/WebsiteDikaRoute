import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MailX, CheckCircle2, AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { api } from "../lib/api";
import { Reveal, GradientTitle } from "../lib/ui";
import { useLang } from "../i18n";

export default function Unsubscribe() {
  const { dict } = useLang();
  const p = dict.unsubscribe;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await api.unsubscribe(email);
      setStatus("ok");
      setMsg(res.message);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  return (
    <div className="relative mx-auto max-w-lg px-4 pt-36 pb-24 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-40 h-56 w-56 -translate-x-1/2 rounded-full bg-indigo-600/[0.07] blur-[90px]" />

      <Reveal>
        <div className="glass-strong relative rounded-3xl p-8 sm:p-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 glow-ring"
          >
            <MailX size={26} />
          </motion.div>

          <h1 className="mt-6 text-center font-display text-2xl font-bold text-white sm:text-3xl">
            <GradientTitle parts={p.title} />
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-slate-400">
            {p.desc}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={p.placeholder}
                className="h-12 w-full rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-primary btn flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm text-white"
            >
              {status === "loading" ? p.processing : p.submit}
            </button>
            {status === "ok" && (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 size={16} /> {msg}
              </p>
            )}
            {status === "error" && (
              <p className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                <AlertCircle size={16} /> {msg}
              </p>
            )}
          </form>

          <div className="mt-7 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-white">
              <ArrowLeft size={14} /> {p.back}
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
