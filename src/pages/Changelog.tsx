import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Search, Loader2, AlertCircle, GitCommitHorizontal, ExternalLink, RotateCcw } from "lucide-react";
import { api, type ChangelogRelease, type ChangelogResponse } from "../lib/api";
import { Reveal, PageHero, GradientTitle, GlassSkeleton } from "../lib/ui";
import clsx from "clsx";
import { useLang } from "../i18n";

const SECTION_COLORS: Record<string, string> = {
  Added: "text-emerald-400 border-emerald-400/30 bg-emerald-500/10",
  Fixed: "text-amber-300 border-amber-400/30 bg-amber-500/10",
  Changed: "text-cyan-300 border-cyan-400/30 bg-cyan-500/10",
  Removed: "text-rose-400 border-rose-400/30 bg-rose-500/10",
  Security: "text-pink-300 border-pink-400/30 bg-pink-500/10",
  Documentation: "text-indigo-300 border-indigo-400/30 bg-indigo-500/10",
  Deprecated: "text-orange-300 border-orange-400/30 bg-orange-500/10",
};

function ChangelogSkeleton() {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[13px] top-2 w-px bg-gradient-to-b from-indigo-500/40 via-white/10 to-transparent" />
      <div className="space-y-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative pl-12">
            <span className="absolute left-0 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-ink-900">
              <GlassSkeleton className="h-3.5 w-3.5 rounded-full" />
            </span>
            <div className="glass-2 rounded-2xl p-6">
              <GlassSkeleton className="h-6 w-32" />
              <div className="mt-3 space-y-2.5">
                <GlassSkeleton className="h-4 w-full" />
                <GlassSkeleton className="h-4 w-5/6" />
                <GlassSkeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Cache modul: bila API gagal sementara, rilis terakhir tetap tampil.
let cachedReleases: ChangelogRelease[] | null = null;
let cachedMeta: Pick<ChangelogResponse, "source" | "fetchedAt"> | null = null;

export default function Changelog() {
  const { dict } = useLang();
  const p = dict.changelogPage;
  const [meta, setMeta] = useState<Pick<ChangelogResponse, "source" | "fetchedAt"> | null>(cachedMeta);
  const [releases, setReleases] = useState<ChangelogRelease[]>(cachedReleases ?? []);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .changelog()
      .then((res) => {
        const list = Array.isArray(res.releases) ? res.releases : [];
        cachedReleases = list;
        cachedMeta = { source: res.source, fetchedAt: res.fetchedAt };
        setReleases(list);
        setMeta(cachedMeta);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat changelog"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = releases.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.version.toLowerCase().includes(q) ||
      r.sections.some((s) => s.items.some((i) => i.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="mx-auto max-w-5xl px-4 pt-28 pb-24 sm:px-6">
      <PageHero
        eyebrow={p.eyebrow}
        title={<GradientTitle parts={p.title} />}
        description={p.desc}
      />

      <Reveal>
        <div className="relative mx-auto mb-4 max-w-xl">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={p.search}
            aria-label={p.search}
            className="glass h-12 w-full rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none"
          />
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto mb-12 flex max-w-xl flex-wrap items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300">
            <GitCommitHorizontal size={12} />
            {meta?.source === "local" ? p.offlineBadge : p.liveBadge}
          </span>
          {meta?.fetchedAt && meta.source !== "local" && (
            <span className="chip">{p.fetchedAt} {new Date(meta.fetchedAt).toLocaleString("id-ID")}</span>
          )}
        </div>
      </Reveal>

      {loading && (
        <div className="py-6">
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin text-indigo-400" />
            {p.loading}
          </div>
          <ChangelogSkeleton />
        </div>
      )}

      {error && (
        <div className="glass mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border-rose-400/30 px-5 py-6 text-sm text-rose-300">
          <div className="flex items-center gap-3">
            <AlertCircle size={17} />
            {error}
          </div>
          <button onClick={load} className="btn btn-secondary btn-sm">
            <RotateCcw size={13} /> {p.retry}
          </button>
        </div>
      )}

      {!loading && releases.length > 0 && (
        <div className="relative">
          <div className="absolute bottom-0 left-[13px] top-2 w-px bg-gradient-to-b from-indigo-500/60 via-white/10 to-transparent" />
          <div className="space-y-8">
            {filtered.map((release, i) => (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.2) }}
                className="relative pl-12"
              >
                <span className="absolute left-0 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-indigo-400/40 bg-ink-900">
                  <Package size={12} className="text-indigo-300" />
                </span>
                <div className="glass card-hover rounded-2xl p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-mono text-lg font-bold text-white">v{release.version}</h3>
                    <span className="chip">{release.date}</span>
                    <a
                      href={`https://github.com/dikaofc/DikaRoute/releases/tag/v${release.version}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-accent"
                    >
                      {p.view} <ExternalLink size={11} />
                    </a>
                  </div>
                  <div className="mt-4 space-y-4">
                    {release.sections.map((section) => (
                      <div key={section.name}>
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                            SECTION_COLORS[section.name] ?? "text-slate-300 border-white/20 bg-white/5"
                          )}
                        >
                          <GitCommitHorizontal size={11} />
                          {section.name}
                        </span>
                        <ul className="mt-2.5 space-y-1.5 pl-1 text-sm text-slate-400">
                          {section.items.map((item, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-400/70" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="glass rounded-2xl p-10 text-center text-sm text-slate-400">
                {p.empty} “{query}”.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
