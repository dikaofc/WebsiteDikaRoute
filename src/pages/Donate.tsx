import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Rocket,
  Server,
  CheckCircle2,
  QrCode,
  ExternalLink,
  HandCoins,
  ScanLine,
  ArrowLeft,
  BadgeCheck,
  PartyPopper,
  ZoomIn,
  Download,
  X,
} from "lucide-react";
import clsx from "clsx";
import { Reveal, PageHero, GradientTitle, btnClass } from "../lib/ui";
import { api } from "../lib/api";
import { useLang } from "../i18n";

type Phase = "form" | "qr" | "done";

function StaticQrPanel({
  onPaid,
  onEdit,
  d,
}: {
  onPaid: () => void;
  onEdit: () => void;
  d: {
    qrTitle: string;
    qrDesc: string;
    owner: string;
    step1: string;
    step2: string;
    step3: string;
    paidBtn: string;
    paidDesc: string;
    editBtn: string;
    zoomHint: string;
    download: string;
    close: string;
  };
}) {
  // Lightbox: klik gambar QRIS → tampil besar + bisa diunduh.
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom]);

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

        {/* QRIS statis — foto kartu QRIS resmi (klik untuk perbesar/unduh) */}
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label={d.zoomHint}
          className="group mx-auto mt-6 w-fit cursor-zoom-in rounded-2xl p-3 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.35)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.99]"
          style={{ background: "#fff" }}
        >
          <img
            src="/qris-static.jpg"
            alt="QRIS Dika Code"
            width={280}
            height={395}
            className="h-auto w-[230px] rounded-xl sm:w-[280px]"
          />
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <BadgeCheck size={12} className="text-pink-400" /> {d.owner}
          <span className="mx-1 text-slate-700">·</span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <ZoomIn size={11} /> {d.zoomHint}
          </span>
        </p>

        <div className="mx-auto mt-5 max-w-sm space-y-2 text-left">
          {[d.step1, d.step2, d.step3].map((s, i) => (
            <div key={i} className="glass-3 flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] text-slate-300">
              <span className="font-mono text-[11px] font-bold text-pink-400">{String(i + 1).padStart(2, "0")}</span>
              {s}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button onClick={onPaid} className={btnClass("primary", "lg", "w-full max-w-sm text-sm text-white")}>
            <CheckCircle2 size={16} /> {d.paidBtn}
          </button>
          <p className="max-w-sm text-[11px] leading-relaxed text-slate-500">{d.paidDesc}</p>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-white"
          >
            <ArrowLeft size={13} /> {d.editBtn}
          </button>
        </div>
      </div>

      {/* Lightbox — perbesar & unduh QRIS */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setZoom(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={d.zoomHint}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-full"
            >
              <img
                src="/qris-static.jpg"
                alt="QRIS Dika Code"
                className="max-h-[76vh] w-auto rounded-2xl shadow-2xl ring-1 ring-white/15"
              />
              <div className="mt-5 flex items-center justify-center gap-3">
                <a
                  href="/qris-static.jpg"
                  download="qris-dikacode.jpg"
                  className={btnClass("primary", undefined, "text-sm text-white")}
                >
                  <Download size={15} /> {d.download}
                </a>
                <button
                  onClick={() => setZoom(false)}
                  className={btnClass("glass", undefined, "text-sm text-slate-200 hover:text-white")}
                >
                  <X size={15} /> {d.close}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Donate() {
  const { dict } = useLang();
  const p = dict.donate;
  const payTxt = p.payment;

  // QRIS statis → nominal bebas (tanpa min/maks), diisi donatur di aplikasinya.
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [phase, setPhase] = useState<Phase>("form");
  const [emailSent, setEmailSent] = useState<boolean | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("qr");
  };

  // Donatur klik "Saya Sudah Membayar" → catat donasi + kirim email
  // terima kasih via Gmail SMTP (async; tidak menghalangi tampilan done).
  const handlePaid = () => {
    setEmailSent(null);
    api
      .donationConfirm({ name: form.name, email: form.email, message: form.message })
      .then((r) => setEmailSent(r.emailSent))
      .catch(() => setEmailSent(false));
    setPhase("done");
  };

  const resetForm = () => {
    setForm({ name: "", email: "", message: "" });
    setEmailSent(null);
    setPhase("form");
  };

  const input = "h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-slate-600 outline-none";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-24 sm:px-6">
      <PageHero
        eyebrow={p.eyebrow}
        title={<GradientTitle parts={p.title} />}
        description={p.desc}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* left: form / qr / done */}
        <Reveal>
          <div className="glass rounded-3xl p-7">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <Heart size={18} className="text-pink-400" />
              <h3 className="font-display text-base font-bold text-white">{p.formTitle}</h3>
              <span className="ml-auto rounded-full border border-pink-400/30 bg-pink-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-pink-300">
                {p.customTab}
              </span>
            </div>

            {phase === "qr" && (
              <div className="mt-6">
                <StaticQrPanel
                  onPaid={handlePaid}
                  onEdit={() => setPhase("form")}
                  d={payTxt}
                />
              </div>
            )}

            {phase === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-lg"
              >
                <div className="glass relative overflow-hidden rounded-3xl p-10 text-center sm:p-12">
                  <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-500/[0.07] blur-[80px]" />
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 glow-ring">
                    <PartyPopper size={28} />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold text-white">{payTxt.doneTitle}</h3>
                  {form.name.trim() && (
                    <p className="mt-1 font-display text-sm font-semibold text-pink-300">{form.name.trim()}</p>
                  )}
                  <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-slate-400">{payTxt.doneDesc}</p>
                  {emailSent && (
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-emerald-300">
                      <CheckCircle2 size={12} /> {payTxt.emailSent} <b>{form.email}</b>
                    </p>
                  )}
                  <button
                    onClick={resetForm}
                    className={btnClass("primary", undefined, "mx-auto mt-7 text-sm text-white")}
                  >
                    <Heart size={15} /> {payTxt.againBtn}
                  </button>
                </div>
              </motion.div>
            )}

            {phase === "form" && (
              <>
                <form onSubmit={submit} className="mt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={p.name}
                      className={input}
                    />
                    <input
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
                    className={btnClass("primary", "lg", "w-full text-sm text-white")}
                  >
                    <QrCode size={15} />
                    {p.seeQr}
                  </button>
                  <p className="flex items-start gap-2 text-center text-[11px] leading-relaxed text-slate-500">
                    <span className="mt-0.5">
                      <QrCode size={11} className="text-pink-400" />
                    </span>
                    {p.note}
                  </p>
                </form>
              </>
            )}
          </div>
        </Reveal>

        {/* right: steps & info */}
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
                <div className="glass-3 flex items-center gap-4 rounded-2xl p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{p.methods[1]}</div>
                    <div className="text-xs text-slate-500">{p.qris}</div>
                  </div>
                  <CheckCircle2 size={15} className="ml-auto text-emerald-400" />
                </div>
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
                      {i === 0 ? <Server size={17} /> : i === 1 ? <Rocket size={17} /> : <Heart size={17} />}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-200">{c.label}</div>
                  </div>
                ))}
              </div>
              <p className="glass-3 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] text-slate-400">
                <Heart size={13} className="text-pink-400" />
                {p.thanks}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
