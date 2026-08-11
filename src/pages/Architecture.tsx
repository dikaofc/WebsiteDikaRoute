import { Link } from "react-router-dom";
import { ArrowRight, Workflow } from "lucide-react";
import Pipeline from "../components/Pipeline";
import { Reveal, PageHero, GradientTitle, SectionHeading, btnClass } from "../lib/ui";
import { useLang } from "../i18n";

export default function Architecture() {
  const { dict } = useLang();
  const a = dict.architecture;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-24 sm:px-6">
      <PageHero
        eyebrow={a.eyebrow}
        title={<GradientTitle parts={a.title} />}
        description={a.desc}
      >
        <Link to="/docs/architecture" className={btnClass("primary")}>
          {dict.cta.docsBtn} <ArrowRight size={15} />
        </Link>
        <Link to="/fitur" className={btnClass("glass", undefined, "text-slate-200 hover:text-white")}>
          {dict.nav.fitur}
        </Link>
      </PageHero>

      {/* alur request */}
      <Reveal>
        <Pipeline />
      </Reveal>

      {/* strategi routing */}
      <div className="mt-20">
        <SectionHeading eyebrow={a.eyebrow} title={a.strategies.title} center={false} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {a.strategies.items.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.06}>
              <div className="glass-2 glass-hover group relative overflow-hidden rounded-2xl p-6">
                <div className="absolute -right-3 -top-3 h-10 w-10 rotate-12 bg-indigo-500/15 transition-all group-hover:rotate-45 group-hover:bg-indigo-500/30" />
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-accent">0{i + 1}</span>
                  <h3 className="font-display text-base font-semibold text-white">{s.name}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Reveal delay={0.15}>
        <div className="relative mt-16 overflow-hidden rounded-2xl border-2 border-[var(--bd)] bg-gradient-to-br from-indigo-600/20 via-ink-900 to-ink-950 p-10 text-center shadow-[4px_4px_0_0_var(--sh)] sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
          <div className="pointer-events-none absolute -top-16 left-1/2 h-36 w-64 -translate-x-1/2 rotate-12 bg-indigo-500/10" />
          <div className="relative">
            <Workflow size={28} className="mx-auto text-accent" />
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {dict.cta.title[0]}
              <span className="gradient-text">{dict.cta.title[1]}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">{dict.cta.desc}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/playground" className={btnClass("primary")}>
                {dict.nav.coba} <ArrowRight size={15} />
              </Link>
              <Link to="/fitur" className={btnClass("glass", undefined, "text-slate-200 hover:text-white")}>
                {dict.nav.fitur}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
