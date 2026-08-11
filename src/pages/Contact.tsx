import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle, MapPin, Github, Heart } from "lucide-react";
import { api } from "../lib/api";
import { Reveal, PageHero, GradientTitle, btnClass } from "../lib/ui";
import { useLang } from "../i18n";

export default function Contact() {
  const { dict } = useLang();
  const p = dict.contact;
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await api.contact(form);
      setStatus("ok");
      setMsg(res.message);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const cardIcons = [<Mail size={17} key="mail" />, <Github size={17} key="gh" />, <MessageSquare size={17} key="ms" />, <Heart size={17} key="heart" />];
  const cardHrefs = [
    "https://t.me/dikaacode",
    "https://github.com/dikaofc/DikaRoute",
    "https://obitoglory.tech",
    "/donasi",
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-24 sm:px-6">
      <PageHero
        eyebrow={p.eyebrow}
        title={<GradientTitle parts={p.title} />}
        description={p.desc}
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <Reveal className="lg:col-span-2">
          <div className="space-y-4">
            {p.cards.map((item, i) => {
              const inner = (
                <>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${item.tone}`}>
                    {cardIcons[i]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </>
              );
              return cardHrefs[i].startsWith("/") ? (
                <Link key={item.title} to={cardHrefs[i]} className="glass-2 card-hover flex items-center gap-4 rounded-2xl p-5">
                  {inner}
                </Link>
              ) : (
                <a
                  key={item.title}
                  href={cardHrefs[i]}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-2 card-hover flex items-center gap-4 rounded-2xl p-5"
                >
                  {inner}
                </a>
              );
            })}
            <div className="glass-2 flex items-center gap-4 rounded-2xl p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-300">
                <MapPin size={17} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{p.locationTitle}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  {p.locationDesc} <Heart size={11} className="fill-rose-500 text-rose-500" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-3">
          <form onSubmit={submit} className="glass rounded-3xl p-7 sm:p-9">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{p.name}</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={p.namePh}
                  className="h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-slate-600 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{p.email}</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={p.emailPh}
                  className="h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>
            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{p.message}</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={p.messagePh}
                className="w-full resize-none rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className={btnClass("primary", "lg", "mt-6 w-full text-sm text-white")}
            >
              {status === "loading" ? (
                <>
                  <span className="btn-spinner" />
                  {p.sending}
                </>
              ) : (
                <>
                  <Send size={15} /> {p.submit}
                </>
              )}
            </button>

            {status === "ok" && (
              <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 size={16} /> {msg}
              </p>
            )}
            {status === "error" && (
              <p className="mt-4 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                <AlertCircle size={16} /> {msg}
              </p>
            )}
          </form>
        </Reveal>
      </div>
    </div>
  );
}
