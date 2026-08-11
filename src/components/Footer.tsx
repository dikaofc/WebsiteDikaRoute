import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Github, Send, Heart, CheckCircle2, AlertCircle, MailCheck } from "lucide-react";
import { api } from "../lib/api";
import { useLang } from "../i18n";
import { getDocs } from "../content/docs";
import { useToast } from "../lib/toast";

export default function Footer() {
  const { lang, dict } = useLang();
  const f = dict.footer;
  const docs = getDocs(lang);
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [subCount, setSubCount] = useState<number | null>(null);

  useEffect(() => {
    api
      .newsletterCount()
      .then((r) => setSubCount(r.total))
      .catch(() => {});
  }, []);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await api.newsletter(email);
      setStatus("ok");
      setMsg(res.message);
      setEmail("");
      toast("success", res.message);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Terjadi kesalahan";
      setStatus("error");
      setMsg(m);
      toast("error", m);
    }
  };

  return (
    <footer className="relative z-10 px-3 pb-8 pt-4 sm:px-6">
      <div className="glass mx-auto max-w-7xl rounded-3xl px-6 py-14 sm:px-12">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/dikaroute.svg" alt="DikaRoute" className="h-9 w-9" />
              <span className="font-display text-xl font-bold text-white">
                Dika<span className="gradient-text">Route</span>
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              {f.desc}
            </p>

            <form onSubmit={subscribe} className="mt-6 max-w-md">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {f.newsletterLabel}
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={f.placeholder}
                  className="h-11 flex-1 rounded-lg px-3.5 text-sm text-white placeholder:text-slate-600 outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-primary btn flex h-11 items-center gap-2 rounded-lg px-4 text-sm text-white"
                >
                  <Send size={14} />
                  {status === "loading" ? f.sending : f.subscribe}
                </button>
              </div>
              {status === "ok" && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 size={13} /> {msg}
                </p>
              )}
              {status === "error" && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle size={13} /> {msg}
                </p>
              )}
              {subCount !== null && subCount > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <MailCheck size={12} className="text-accent" />
                  {subCount} {f.countLine}
                </p>
              )}
            </form>

        <div className="mt-6 flex gap-2.5">
          <a
            href="https://github.com/dikaofc/DikaRoute"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="glass-3 flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-all hover:text-white"
          >
            <Github size={17} />
          </a>
          <a
            href="https://t.me/dikaacode"
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
            className="glass-3 flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-all hover:text-white"
          >
            <Send size={17} />
          </a>
          <Link
            to="/donasi"
            aria-label="Donasi"
            className="glass-3 flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-all hover:text-white"
          >
            <Heart size={17} />
          </Link>
          <a
            href="https://obitoglory.tech"
            target="_blank"
            rel="noreferrer"
            aria-label="Website"
            className="glass-3 flex h-10 items-center justify-center rounded-xl px-3 text-sm text-slate-300 transition-all hover:text-white"
          >
            obitoglory.tech
          </a>
        </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold text-white">{f.navTitle}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              {f.navLinks.map(([label, href]) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-sm font-semibold text-white">{f.docsTitle}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              {docs.map((doc) => (
                <li key={doc.slug}>
                  <Link to={`/docs/${doc.slug}`} className="flex items-center gap-1.5 transition-colors hover:text-white">
                    <doc.icon size={13} className="opacity-70" /> {doc.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold text-white">{f.ecoTitle}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              {f.ecoItems.map((label) => (
                <li key={label}>
                  <a
                    href={
                      label === "NPM Package"
                        ? "https://www.npmjs.com/package/dikaroute"
                        : label === "Source Code"
                          ? "https://github.com/dikaofc/DikaRoute"
                          : "#"
                    }
                    className="transition-colors hover:text-white"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 text-xs text-slate-500 sm:flex-row">
          <p>{f.copyright}</p>
          <div className="flex items-center gap-4">
            <Link to="/unsubscribe" className="transition-colors hover:text-slate-300">{f.unsubLink}</Link>
            <p className="flex items-center gap-1.5">
              {f.madeWith} <Heart size={12} className="fill-rose-500 text-rose-500" /> {f.madeFor}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
