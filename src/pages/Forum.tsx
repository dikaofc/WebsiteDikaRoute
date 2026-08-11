import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bug,
  Lightbulb,
  MessageCircleQuestion,
  BookOpen,
  Grid3x3,
  Search,
  ArrowBigUp,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Github,
  Inbox,
  Flame,
  RotateCcw,
} from "lucide-react";
import clsx from "clsx";
import { Reveal, PageHero, GradientTitle, GlassTabs, GlassSelect, GlassSkeleton, btnClass } from "../lib/ui";
import { api, type Issue } from "../lib/api";
import { useLang } from "../i18n";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  bug: <Bug size={14} />,
  feature: <Lightbulb size={14} />,
  question: <MessageCircleQuestion size={14} />,
  docs: <BookOpen size={14} />,
  other: <Grid3x3 size={14} />,
};

const SEVERITY_CLS: Record<string, string> = {
  low: "border-emerald-400/40 text-emerald-300",
  medium: "border-amber-400/40 text-amber-300",
  high: "border-orange-400/40 text-orange-300",
  critical: "border-rose-400/40 text-rose-300",
};

const STATUS_CLS: Record<Issue["status"], string> = {
  open: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  "in-progress": "border-amber-400/30 bg-amber-500/10 text-amber-300",
  resolved: "border-indigo-400/30 bg-indigo-500/10 text-indigo-300",
};

const ENVIRONMENTS = ["npm", "docker", "termux", "dashboard", "cli", "other"];

function IssuesSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass-2 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <GlassSkeleton className="h-14 w-12 rounded-xl" />
            <div className="flex-1 space-y-2.5">
              <GlassSkeleton className="h-4 w-2/3" />
              <GlassSkeleton className="h-4 w-full" />
              <GlassSkeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Forum() {
  const { dict } = useLang();
  const p = dict.forum;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ title: "", type: "bug", severity: "medium", description: "", steps: "", environment: "npm", email: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Issue["status"]>("all");
  const [sort, setSort] = useState<"newest" | "votes">("newest");
  const [voted, setVoted] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.issues();
      // Defensif: jangan pernah biarkan data malformed menggagalkan render.
      setIssues(Array.isArray(res.issues) ? res.issues : []);
      setStats({
        total: res.total ?? 0,
        open: res.open ?? 0,
        inProgress: res.inProgress ?? 0,
        resolved: res.resolved ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat forum");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = issues.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.type.includes(q)
      );
    });
    list = [...list].sort((a, b) =>
      sort === "votes" ? b.votes - a.votes : String(b.createdAt).localeCompare(String(a.createdAt))
    );
    return list;
  }, [issues, query, statusFilter, sort]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await api.reportIssue(form);
      setStatus("ok");
      setMsg(res.message);
      setForm({ ...form, title: "", description: "", steps: "" });
      load();
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const vote = async (id: string) => {
    if (voted.has(id)) return;
    setVoted((v) => new Set(v).add(id));
    try {
      const res = await api.voteIssue(id);
      setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, votes: res.votes } : i)));
    } catch {
      setVoted((v) => {
        const next = new Set(v);
        next.delete(id);
        return next;
      });
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days <= 0) {
      const hrs = Math.floor(diff / 3_600_000);
      if (hrs <= 0) return p.justNow;
      return `${hrs} ${p.hoursAgo}`;
    }
    if (days < 30) return `${days} ${p.daysAgo}`;
    return new Date(iso).toLocaleDateString("id-ID");
  };

  const statusLabel = (s: Issue["status"]) =>
    s === "open" ? p.tabOpen : s === "in-progress" ? p.tabProgress : p.tabResolved;

  const typeLabel = (t: string) => p.types.find((x) => x.id === t)?.label ?? p.types[4].label;
  const sevLabel = (s: string) => p.severities.find((x) => x.id === s)?.label ?? s;

  const filterTabs = [
    { id: "all" as const, label: `${p.tabAll} (${stats.total})` },
    { id: "open" as const, label: `${p.tabOpen} (${stats.open})` },
    { id: "in-progress" as const, label: `${p.tabProgress} (${stats.inProgress})` },
    { id: "resolved" as const, label: `${p.tabResolved} (${stats.resolved})` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-24 sm:px-6">
      <PageHero
        eyebrow={p.eyebrow}
        title={<GradientTitle parts={p.title} />}
        description={p.desc}
      />

      {/* GitHub banner */}
      <Reveal>
        <div className="glass-2 mb-10 flex flex-col items-center justify-between gap-4 rounded-2xl px-6 py-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-slate-200">
              <Github size={17} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{p.bannerTitle}</div>
              <div className="text-xs text-slate-500">{p.bannerDesc}</div>
            </div>
          </div>
          <a
            href="https://github.com/dikaofc/DikaRoute/issues"
            target="_blank"
            rel="noreferrer"
            className={btnClass("primary")}
          >
            {p.bannerBtn} <ExternalLink size={14} />
          </a>
        </div>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        {/* report form */}
        <Reveal>
          <form onSubmit={submit} className="glass sticky top-24 rounded-3xl p-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Bug size={17} className="text-rose-400" />
              <h3 className="font-display text-base font-bold text-white">{p.formTitle}</h3>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{p.category}</label>
              <div className="grid grid-cols-3 gap-2">
                {p.types.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setForm({ ...form, type: t.id })}
                    className={clsx(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-all duration-200",
                      form.type === t.id
                        ? "glass-2 border-indigo-400/60 text-white"
                        : "glass-3 text-slate-400 hover:border-white/25"
                    )}
                  >
                    {TYPE_ICONS[t.id]} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{p.severity}</label>
              <div className="grid grid-cols-4 gap-2">
                {p.severities.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setForm({ ...form, severity: s.id })}
                    className={clsx(
                      "rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-all duration-200",
                      form.severity === s.id ? SEVERITY_CLS[s.id] + " glass-2" : "glass-3 text-slate-500 hover:border-white/25"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{p.titleLabel}</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={p.titlePh}
                className="h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-slate-600 outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{p.descLabel}</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={p.descPh}
                className="w-full resize-none rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{p.stepsLabel}</label>
              <textarea
                rows={3}
                value={form.steps}
                onChange={(e) => setForm({ ...form, steps: e.target.value })}
                placeholder={p.stepsPh}
                className="w-full resize-none rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{p.envLabel}</label>
                <GlassSelect
                  value={form.environment}
                  onChange={(e) => setForm({ ...form, environment: e.target.value })}
                >
                  {ENVIRONMENTS.map((env) => (
                    <option key={env} value={env}>{env}</option>
                  ))}
                </GlassSelect>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">{p.emailLabel}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={p.emailPh}
                  className="h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className={btnClass("primary", undefined, "mt-6 w-full text-sm text-white")}
            >
              {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              {p.submit}
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

        {/* issues list */}
        <div className="min-w-0">
          <Reveal delay={0.05}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={p.search}
                  aria-label={p.search}
                  className="glass h-11 w-full rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none"
                />
              </div>
              <GlassSelect
                value={sort}
                onChange={(e) => setSort(e.target.value as "newest" | "votes")}
                className="sm:w-44"
              >
                <option value="newest">{p.sortNewest}</option>
                <option value="votes">{p.sortVotes}</option>
              </GlassSelect>
            </div>
            <div className="mt-3">
              <GlassTabs
                id="forum-status"
                label={p.tabAll}
                items={filterTabs}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                className="max-w-full overflow-x-auto no-scrollbar"
              />
            </div>
          </Reveal>

          <div className="mt-5 space-y-3">
            {loading && (
              <div className="py-2">
                <IssuesSkeleton />
              </div>
            )}
            {error && !loading && (
              <div className="glass flex flex-col items-center gap-4 rounded-2xl border-rose-400/30 px-5 py-6 text-sm text-rose-300">
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} /> {error}
                </div>
                <button onClick={load} className="btn btn-secondary btn-sm">
                  <RotateCcw size={13} /> {p.retry}
                </button>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="glass flex flex-col items-center gap-3 rounded-2xl py-16 text-center">
                <Inbox size={30} className="text-slate-600" />
                <p className="text-sm text-slate-400">{p.empty1}</p>
                <p className="text-xs text-slate-500">{p.empty2}</p>
              </div>
            )}
            <AnimatePresence>
              {!loading && !error &&
                filtered.map((issue, i) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.35 }}
                    className="glass card-hover rounded-2xl p-5"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => vote(issue.id)}
                        className={clsx(
                          "flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition-all duration-200",
                          voted.has(issue.id)
                            ? "glass-2 border-indigo-400/60 text-indigo-300"
                            : "glass-3 text-slate-500 hover:border-indigo-400/40 hover:text-indigo-300"
                        )}
                        aria-label="Vote"
                      >
                        <ArrowBigUp size={17} className={voted.has(issue.id) ? "animate-bounce" : ""} />
                        <span className="text-xs font-bold">{issue.votes}</span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={clsx("rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold", STATUS_CLS[issue.status])}>
                            {statusLabel(issue.status)}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10.5px] text-slate-300">
                            {typeLabel(issue.type)}
                          </span>
                          <span className={clsx("rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold", SEVERITY_CLS[issue.severity])}>
                            {sevLabel(issue.severity)}
                          </span>
                          {issue.environment && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10.5px] text-slate-400">
                              {issue.environment}
                            </span>
                          )}
                          <span className="ml-auto text-[11px] text-slate-500">{timeAgo(issue.createdAt)}</span>
                        </div>
                        <h4 className="mt-2.5 font-display text-[15px] font-semibold text-white">{issue.title}</h4>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{issue.description}</p>
                        {issue.steps && (
                          <pre className="glass-3 mt-3 whitespace-pre-wrap rounded-xl px-4 py-3 font-mono text-[11.5px] text-slate-400">
                            {issue.steps}
                          </pre>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* community note */}
      <Reveal delay={0.1}>
        <div className="glass-2 mt-14 flex items-center gap-3 rounded-2xl px-6 py-4 text-sm text-slate-400">
          <Flame size={16} className="shrink-0 text-orange-400" />
          {p.note}
        </div>
      </Reveal>
    </div>
  );
}
