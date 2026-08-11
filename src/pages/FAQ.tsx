import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, SearchX } from "lucide-react";
import FaqAccordion from "../components/FaqAccordion";
import { Reveal, PageHero, GradientTitle, btnClass } from "../lib/ui";
import { useLang } from "../i18n";

export default function FAQ() {
  const { dict } = useLang();
  const p = dict.faqPage;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dict.faq;
    return dict.faq.filter(
      (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [query, dict.faq]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-24 sm:px-6">
      <PageHero
        eyebrow={p.eyebrow}
        title={<GradientTitle parts={p.title} />}
        description={p.desc}
      />

      <div className="mx-auto -mt-6 mb-10 max-w-xl px-4">
        <Reveal>
          <div className="relative">
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
      </div>

      {filtered.length === 0 ? (
        <div className="glass mx-auto max-w-3xl rounded-2xl p-10 text-center">
          <SearchX size={26} className="mx-auto text-slate-500" />
          <p className="mt-3 text-sm text-slate-400">{p.empty}</p>
        </div>
      ) : (
        <FaqAccordion items={filtered} />
      )}

      <Reveal delay={0.2}>
        <div className="glass-2 mx-auto mt-14 max-w-3xl rounded-2xl p-8 text-center">
          <h3 className="font-display text-xl font-bold text-white">{p.cardTitle}</h3>
          <p className="mt-2 text-sm text-slate-400">
            {p.cardDesc}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/docs" className={btnClass("primary")}>
              {p.docsBtn} <ArrowRight size={14} />
            </Link>
            <Link to="/contact" className={btnClass("glass", undefined, "text-slate-200 hover:text-white")}>
              {p.contactBtn}
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
