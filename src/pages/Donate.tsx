import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Coffee,
  Rocket,
  Server,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Send,
  ExternalLink,
  Sparkles,
  HandCoins,
  Pencil,
  Loader2,
  ScanLine,
  RefreshCw,
  Timer,
} from "lucide-react";
import clsx from "clsx";
import { Reveal, PageHero, GradientTitle, btnClass } from "../lib/ui";
import { api } from "../lib/api";
import { useLang } from "../i18n";

const AMOUNTS = [10000, 25000, 50000, 100000, 250000];
const FREQUENCY_IDS = ["sekali", "bulanan"];
const METHOD_IDS = ["saweria", "qris"];

const fmt = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

function AmountSelector({
  amount,
  custom,
  onChange,
  customLabel,
  customPh,
}: {
  amount: number | null;
  custom: string;
  onChange: (amount: number | null, custom: string) => void;
  customLabel: string;
  customPh: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => onChange(a, "")}
            className={clsx(
              "rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-200",
              amount === a
                ? "glass-2 border-pink-400/60 text-white"
                : "glass-3 text-slate-300 hover:border-white/25"
            )}
          >
            {fmt(a)}
          </button>
        ))}
        <button
          onClick={() => onChange(null, custom)}
          className={clsx(
            "rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-200",
            amount === null && custom
              ? "glass-2 border-pink-400/60 text-white"
              : "glass-3 text-slate-300 hover:border-white/25"
          )}
        >
          <Pencil size={14} /> {customLabel}
        </button>
      </div>
      {amount === null && (
        <input
          value={custom}
          onChange={(e) => onChange(null, e.target.value.replace(/\D/g, ""))}
          placeholder={customPh}
          inputMode="numeric"
          className="mt-3 h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-slate-600 outline-none"
        />
      )}
    </div>
  );
}

type Phase = "form" | "qr" | "done";
type PayState = "pending" | "paid" | "expired";

interface PayInfo {
  transactionId: string;
  qrDataUrl: string;
  amount: number;
  expiresInMs: number;
}

function PaymentPanel({
  pay,
  payState,
  remainingSec,
  onCheck,
  onNew,
  d,
  viaLabel,
}: {
  pay: PayInfo;
  payState: PayState;
  remainingSec: number;
  onCheck: () => void;
  onNew: () => void;
  d: {
    qrTitle: string;
    qrDesc: string;
    total: string;
    txId: string;
    validFor: string;
    waiting: string;
    pending: string;
    paid: string;
    expired: string;
    checkAgain: string;
    createNew: string;
    success: string;
    via: string;
  };
  viaLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-lg"
    >
      <div className="glass relative overflow-hidden rounded-3xl p-7 text-center sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pink-500/[0.07] blur-[80px]" />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-400/30 bg-pink-500/10 text-pink-300 glow-ring">
          <ScanLine size={26} />
        </div>
        <h3 className="mt-5 font-display text-xl font-bold text-white">{d.qrTitle}</h3>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-slate-400">{d.qrDesc}</p>

        <div className="mx-auto mt-6 w-fit rounded-2xl p-3 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.35)]" style={{ background: "#fff" }}>
          {pay.qrDataUrl ? (
            <img
              src={pay.qrDataUrl}
              alt="QRIS"
              width={220}
              height={220}
              className="h-[220px] w-[220px] rounded-xl"
            />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-[#f1f5f9]">
              <Loader2 size={28} className="animate-spin text-slate-400" />
            </div>
          )}
        </div>

        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 text-left">
          <div className="glass-3 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm">
            <span className="text-xs text-slate-500">{d.total}</span>
            <span className="font-bold text-white">{fmt(pay.amount)}</span>
          </div>
          <div className="glass-3 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm">
            <span className="text-xs text-slate-500">{d.via}</span>
            <span className="text-[13px] font-semibold text-pink-300">{viaLabel}</span>
          </div>
          <div className="glass-3 flex items-center justify-between rounded-xl px-4 py-2.5">
            <span className="text-xs text-slate-500">{d.txId}</span>
            <code className="max-w-[180px] truncate font-mono text-[11px] text-indigo-300">{pay.transactionId}</code>
          </div>
          {payState === "pending" && (
            <div className="flex items-center justify-between rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300">
              <span className="flex items-center gap-1.5">
                <Timer size={13} /> {d.validFor} {Math.max(0, Math.floor(remainingSec / 60))}:{String(Math.max(0, remainingSec % 60)).padStart(2, "0")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> {d.waiting}
              </span>
            </div>
          )}
        </div>

        <div className="mt-5">
          {payState === "pending" && (
            <>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300">
                <Loader2 size={13} className="animate-spin" /> {d.pending}
              </span>
              <button
                onClick={onCheck}
                className="mx-auto mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-white"
              >
                <RefreshCw size={13} /> {d.checkAgain}
              </button>
            </>
          )}
          {payState === "paid" && (
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4">
              <p className="flex items-center justify-center gap-2 font-semibold text-emerald-300">
                <CheckCircle2 size={18} /> {d.paid}
              </p>
              <p className="mt-1.5 text-xs text-emerald-400/80">{d.success}</p>
            </motion.div>
          )}
          {payState === "expired" && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4">
              <p className="flex items-center justify-center gap-2 font-semibold text-rose-300">
                <AlertCircle size={18} /> {d.expired}
              </p>
              <button
                onClick={onNew}
                className={btnClass("primary", undefined, "mx-auto mt-3 text-xs text-white")}
              >
                <RefreshCw size={13} /> {d.createNew}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Donate() {
  const { dict } = useLang();
  const p = dict.donate;
  const payTxt = p.payment;

  const [amount, setAmount] = useState<number | null>(50000);
  const [custom, setCustom] = useState("");
  const [frequency, setFrequency] = useState("sekali");
  const [method, setMethod] = useState("saweria");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const [phase, setPhase] = useState<Phase>("form");
  const [pay, setPay] = useState<PayInfo | null>(null);
  const [payState, setPayState] = useState<PayState>("pending");
  const [remainingSec, setRemainingSec] = useState(0);

  const finalAmount = amount ?? (custom ? Number(custom) : 0);
  const freqLabel = frequency === "sekali" ? p.freqOnce : p.freqMonthly;
  const isQris = method === "saweria" || method === "qris";

  // Status pembayaran REAL-TIME tanpa polling: EventSource (SSE) ke
  // /api/donation/stream/:tx. Push instan via webhook Saweria (host
  // selalu-on); di serverless stream bisa diputus (~maxDuration) →
  // otomatis pindah ke polling ringan sebagai cadangan.
  useEffect(() => {
    if (phase !== "qr" || !pay) return;
    const deadline = Date.now() + pay.expiresInMs;
    let stopped = false;
    let es: EventSource | null = null;
    let iv: ReturnType<typeof setInterval> | undefined;
    let tv: ReturnType<typeof setInterval> | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let fallbackOn = false;

    const finish = (s: PayState) => {
      if (stopped) return;
      stopped = true;
      setPayState(s);
      es?.close();
      if (iv) clearInterval(iv);
      if (tv) clearInterval(tv);
      if (watchdog) clearTimeout(watchdog);
    };

    const tickCountdown = () =>
      setRemainingSec(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));

    // Cadangan (serverless): polling ringan bila SSE gagal/terputus.
    const startFallbackPolling = () => {
      if (fallbackOn || stopped) return;
      fallbackOn = true;
      es?.close();
      iv = setInterval(async () => {
        if (stopped) return;
        tickCountdown();
        if (Date.now() >= deadline) return finish("expired");
        try {
          const r = await api.donationStatus(pay.transactionId);
          if (r.paid) return finish("paid");
          if (r.status === "expired") return finish("expired");
        } catch {
          // jaringan/temporary — tunggu tick berikutnya
        }
      }, 4000);
    };

    try {
      es = new EventSource(`/api/donation/stream/${encodeURIComponent(pay.transactionId)}`);
      es.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data);
          if (d.status === "paid") return finish("paid");
          if (d.status === "expired") return finish("expired");
          if (d.error) return startFallbackPolling();
        } catch {}
      };
      es.onerror = () => {
        tickCountdown();
        if (es?.readyState === EventSource.CLOSED) startFallbackPolling();
      };
    } catch {
      startFallbackPolling();
    }

    tickCountdown();
    tv = setInterval(tickCountdown, 1000);
    // Pengaman terakhir: bila deadline lewat tanpa event, tandai expired.
    watchdog = setTimeout(() => {
      if (!stopped && Date.now() >= deadline) finish("expired");
    }, Math.max(0, deadline - Date.now()) + 3000);

    return () => {
      stopped = true;
      es?.close();
      if (iv) clearInterval(iv);
      if (tv) clearInterval(tv);
      if (watchdog) clearTimeout(watchdog);
    };
  }, [phase, pay]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) {
      setStatus("error");
      setMsg("Silakan pilih atau isi nominal donasi terlebih dahulu");
      return;
    }
    if (isQris && finalAmount < 10000) {
      setStatus("error");
      setMsg(payTxt.minAmount);
      return;
    }
    setStatus("loading");
    try {
      if (isQris) {
        const res = await api.donationPay({
          name: form.name,
          email: form.email,
          amount: finalAmount,
          frequency,
          method: method as "saweria" | "qris",
          message: form.message,
        });
        setPay({ transactionId: res.transactionId, qrDataUrl: res.qrDataUrl, amount: res.amount, expiresInMs: res.expiresInMs });
        setPayState("pending");
        setPhase("qr");
        setStatus("idle");
      } else {
        const res = await api.donation({
          name: form.name,
          email: form.email,
          amount: finalAmount,
          frequency,
          method,
          message: form.message,
        });
        setStatus("ok");
        setMsg(res.message);
        setPhase("done");
      }
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const input =
    "h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-slate-600 outline-none";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-24 sm:px-6">
      <PageHero
        eyebrow={p.eyebrow}
        title={<GradientTitle parts={p.title} />}
        description={p.desc}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* left: form & amount */}
        <Reveal>
          <div className="glass rounded-3xl p-7">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <Heart size={18} className="text-pink-400" />
              <h3 className="font-display text-base font-bold text-white">{p.formTitle}</h3>
              <span className="ml-auto rounded-full border border-pink-400/30 bg-pink-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-pink-300">
                {p.customTab}
              </span>
            </div>

            {phase === "qr" && pay ? (
              <PaymentPanel
                pay={pay}
                payState={payState}
                remainingSec={remainingSec}
                viaLabel={method === "qris" ? p.methods[1] : p.methods[0]}
                onCheck={async () => {
                  try {
                    const r = await api.donationStatus(pay.transactionId);
                    if (r.paid) setPayState("paid");
                    else if (r.status === "expired") setPayState("expired");
                  } catch {}
                }}
                onNew={() => {
                  setPay(null);
                  setPayState("pending");
                  setPhase("form");
                }}
                d={payTxt}
              />
            ) : (
              <>
                <div className="mt-5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{p.amount}</label>
                  <div className="mt-2.5">
                    <AmountSelector
                      amount={amount}
                      custom={custom}
                      onChange={(a, c) => { setAmount(a); setCustom(c); }}
                      customLabel={p.custom}
                      customPh={p.customPh}
                    />
                  </div>
                  {isQris && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <QrCode size={12} className="text-pink-400" /> {payTxt.minAmount}
                    </p>
                  )}
                  <AnimatePresence>
                    {finalAmount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 flex items-center gap-2 rounded-xl border border-pink-400/25 bg-pink-500/10 px-4 py-3 text-sm text-pink-200"
                      >
                        <Sparkles size={15} />
                        {p.youDonate} <b className="text-white">{fmt(finalAmount)}</b> · {freqLabel}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{p.freq}</label>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                    {FREQUENCY_IDS.map((id, i) => (
                      <button
                        key={id}
                        onClick={() => setFrequency(id)}
                        className={clsx(
                          "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                          frequency === id
                            ? "glass-2 border-indigo-400/60 text-white"
                            : "glass-3 text-slate-400 hover:border-white/25"
                        )}
                      >
                        {i === 0 ? p.freqOnce : p.freqMonthly}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{p.method}</label>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                    {METHOD_IDS.map((id, i) => (
                      <button
                        key={id}
                        onClick={() => setMethod(id)}
                        className={clsx(
                          "flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[13px] font-semibold transition-all duration-200",
                          method === id
                            ? "glass-2 border-cyan-400/60 text-white"
                            : "glass-3 text-slate-400 hover:border-white/25"
                        )}
                      >
                        {i === 0 ? <HandCoins size={14} /> : <QrCode size={14} />}
                        {p.methods[i]}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={p.name}
                      className={input}
                    />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={p.email}
                      className={input}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={p.messagePh}
                    className="w-full resize-none rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className={btnClass("primary", "lg", "w-full text-sm text-white")}
                  >
                    {status === "loading" ? (
                      <>
                        <span className="spinner-white h-4 w-4 animate-spin rounded-full" />
                        {p.saving}
                      </>
                    ) : (
                      <>
                        {isQris ? <ScanLine size={15} /> : <Heart size={15} />}
                        {isQris ? `${p.payBtn} ${fmt(finalAmount || 0)}` : `${p.submit} ${fmt(finalAmount || 0)}`}
                      </>
                    )}
                  </button>
                  {status === "ok" && phase === "done" && (
                    <p className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                      <CheckCircle2 size={16} /> {msg}
                    </p>
                  )}
                  {status === "error" && phase !== "qr" && (
                    <p className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                      <AlertCircle size={16} /> {msg}
                    </p>
                  )}
                  <p className="text-center text-[11px] text-slate-500">
                    {p.note}
                  </p>
                </form>
              </>
            )}
          </div>
        </Reveal>

        {/* right: methods & info */}
        <div className="space-y-5">
          <Reveal delay={0.05}>
            <div className="glass rounded-3xl p-7">
              <h3 className="font-display text-base font-bold text-white">{p.howTitle}</h3>
              <div className="mt-5 space-y-4">
                {p.steps.map((s, i) => (
                  <div key={s.title} className="flex gap-4">
                    <span className="font-mono text-sm font-bold text-pink-400">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{s.title}</div>
                      <div className="mt-0.5 text-[13px] text-slate-400">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass rounded-3xl p-7">
              <h3 className="font-display text-base font-bold text-white">{p.methodsTitle}</h3>
              <div className="mt-4 space-y-3">
                <a
                  href="https://saweria.co/dikatech"
                  target="_blank"
                  rel="noreferrer"
                  className="glass-3 card-hover group flex items-center gap-4 rounded-2xl p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pink-400/25 bg-pink-500/10 text-pink-300">
                    <HandCoins size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{p.methods[0]}</div>
                    <div className="text-xs text-slate-500">{p.saweria}</div>
                  </div>
                  <ExternalLink size={15} className="text-slate-500 transition-colors group-hover:text-pink-300" />
                </a>
                <div className="glass-3 flex items-center gap-4 rounded-2xl p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{p.methods[1]}</div>
                    <div className="text-xs text-slate-500">{p.qris}</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="glass rounded-3xl p-7">
              <h3 className="font-display text-base font-bold text-white">{p.usageTitle}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {p.usage.map((c, i) => (
                  <div key={c.label} className="glass-3 rounded-xl p-4 text-center">
                    <div className={clsx("mx-auto flex h-9 w-9 items-center justify-center rounded-lg border", c.tone)}>
                      {i === 0 ? <Server size={17} /> : i === 1 ? <Rocket size={17} /> : <Coffee size={17} />}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-200">{c.label}</div>
                  </div>
                ))}
              </div>
              <p className="glass-3 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] text-slate-400">
                <Send size={13} className="text-pink-400" />
                {p.thanks}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
