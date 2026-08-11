import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Menu, BookOpen, ChevronRight, Github, FileText } from "lucide-react";
import clsx from "clsx";
import Markdown from "../components/Markdown";
import { GlassSheet } from "../lib/ui";
import { getDocs, getDoc, getDocGroups, type DocEntry } from "../content/docs";
import { useLang } from "../i18n";

function Sidebar({
  docs,
  groups,
  active,
  onNavigate,
  title,
  repoLabel,
  header = true,
}: {
  docs: DocEntry[];
  groups: string[];
  active: string;
  onNavigate: () => void;
  title: string;
  repoLabel: string;
  header?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      {header && (
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-400/25 bg-indigo-500/10 text-indigo-300">
            <BookOpen size={15} />
          </span>
          <h2 className="font-display text-base font-bold text-white">{title}</h2>
        </div>
      )}
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-8">
        {groups.map((group) => (
          <div key={group}>
            <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {group}
            </div>
            <div className="space-y-0.5">
              {docs.filter((d) => d.group === group).map((doc) => (
                <Link
                  key={doc.slug}
                  to={`/docs/${doc.slug}`}
                  onClick={onNavigate}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] transition-all duration-200",
                    active === doc.slug
                      ? "glass-3 font-semibold text-white shadow-sm"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <doc.icon size={15} className={clsx("shrink-0", active === doc.slug ? "text-accent" : "opacity-80")} />
                  {doc.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <a
          href="https://github.com/dikaofc/DikaRoute"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Github size={14} /> {repoLabel}
        </a>
      </div>
    </div>
  );
}

export default function Docs() {
  const { lang, dict } = useLang();
  const p = dict.docsPage;
  const docs = getDocs(lang);
  const groups = getDocGroups(lang);
  const { slug = "quickstart" } = useParams();
  const doc = getDoc(slug, lang);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeHeading, setActiveHeading] = useState("");

  useEffect(() => {
    setMenuOpen(false);
    setActiveHeading("");
    const els = Array.from(document.querySelectorAll<HTMLElement>(".md-body h2, .md-body h3"));
    const list = els.map((el, i) => {
      if (!el.id) el.id = `heading-${i}`;
      return { id: el.id, text: el.textContent ?? "", level: Number(el.tagName[1]) };
    });
    setHeadings(list);
    if (list.length === 0) return;

    // scrollspy — heading yang sedang aktif di viewport
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveHeading(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -70% 0px", threshold: 0 }
    );
    list.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [slug, lang]);

  if (!doc) return <Navigate to="/docs" replace />;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-24 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="glass-3 flex items-center gap-2 rounded-full px-4 py-2 text-xs text-slate-400">
          <Link to="/" className="transition-colors hover:text-white">{p.home}</Link>
          <ChevronRight size={12} className="opacity-60" />
          <Link to="/docs" className="transition-colors hover:text-white">{p.docs}</Link>
          <ChevronRight size={12} className="opacity-60" />
          <span className="font-semibold text-slate-200">{doc.title}</span>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          className="glass flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-200 transition-colors hover:text-white lg:hidden"
        >
          <Menu size={15} /> {p.list}
        </button>
      </div>

      <div className="flex gap-10">
        {/* desktop sidebar */}
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-64 shrink-0 lg:block">
          <div className="glass h-full rounded-2xl">
            <Sidebar docs={docs} groups={groups} active={slug} onNavigate={() => {}} title={dict.footer.docsTitle} repoLabel={dict.nav.github} />
          </div>
        </aside>

        {/* mobile drawer — glass sheet */}
        <GlassSheet
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          title={dict.footer.docsTitle}
          side="left"
        >
          <div className="flex h-full flex-col">
            <Sidebar docs={docs} groups={groups} active={slug} onNavigate={() => setMenuOpen(false)} title={dict.footer.docsTitle} repoLabel={dict.nav.github} header={false} />
          </div>
        </GlassSheet>

        <div className="min-w-0 flex-1">
          <div className="glass rounded-3xl p-6 sm:p-10">
            <div className="mb-8 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300">
                  <doc.icon size={24} />
                </span>
                <div>
                  <h1 className="font-display text-3xl font-bold tracking-tight text-white">{doc.title}</h1>
                  <p className="mt-1 text-sm text-slate-500">{doc.description}</p>
                </div>
              </div>
            </div>
            <Markdown content={doc.md} />
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <PrevNext docs={docs} slug={slug} prevLabel={p.prev} nextLabel={p.next} />
          </div>
        </div>

        {/* on this page */}
        <aside className="sticky top-20 hidden h-fit w-52 shrink-0 xl:block">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{p.onThisPage}</div>
          <ul className="mt-3 space-y-1 border-l border-white/10">
            {headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className={clsx(
                    "block border-l-2 py-0.5 pl-3 text-[12.5px] transition-all duration-200",
                    h.level === 2 ? "text-slate-300" : "border-transparent pl-6 text-slate-500",
                    activeHeading === h.id && "border-accent font-semibold text-accent"
                  )}
                >
                  {h.text}
                </a>
              </li>
            ))}
            {headings.length === 0 && (
              <li className="flex items-center gap-2 py-1 pl-3 text-xs text-slate-600">
                <FileText size={12} /> …
              </li>
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function PrevNext({
  docs,
  slug,
  prevLabel,
  nextLabel,
}: {
  docs: DocEntry[];
  slug: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const idx = docs.findIndex((d) => d.slug === slug);
  const prev = docs[idx - 1];
  const next = docs[idx + 1];
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      {prev ? (
        <Link
          to={`/docs/${prev.slug}`}
          className="glass card-hover group rounded-2xl p-4"
        >
          <div className="text-xs text-slate-500">← {prevLabel}</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-white group-hover:text-accent"><prev.icon size={15} /> {prev.title}</div>
        </Link>
      ) : <div />}
      {next && (
        <Link
          to={`/docs/${next.slug}`}
          className="glass card-hover group rounded-2xl p-4 text-right"
        >
          <div className="text-xs text-slate-500">{nextLabel} →</div>
          <div className="mt-1 flex items-center justify-end gap-1.5 font-semibold text-white group-hover:text-accent">{next.title} <next.icon size={15} /></div>
        </Link>
      )}
    </div>
  );
}
