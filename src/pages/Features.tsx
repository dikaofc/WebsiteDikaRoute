import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal, PageHero, GradientTitle, IconBadge, btnClass } from "../lib/ui";
import { useLang } from "../i18n";

export default function Features() {
  const { dict } = useLang();
  const fx = dict.features;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-24 sm:px-6">
      <PageHero
        eyebrow={fx.eyebrow}
        title={<GradientTitle parts={fx.title} />}
        description={fx.desc}
      >
        <Link to="/playground" className={btnClass("primary")}>
          {dict.nav.coba} <ArrowRight size={15} />
        </Link>
        <Link to="/docs" className={btnClass("glass", undefined, "text-slate-200 hover:text-white")}>
          {dict.cta.docsBtn}
        </Link>
      </PageHero>

      {/* grid fitur lengkap */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {fx.items.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.08}>
            <div className="glass-2 card-hover group h-full rounded-2xl p-6">
              <IconBadge icon={<f.icon size={20} />} tone={f.tone} />
              <h3 className="mt-5 font-display text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{f.description}</p>
              <div className="mt-4 h-px w-0 bg-gradient-to-r from-primary to-accent transition-all duration-500 group-hover:w-full" />
            </div>
          </Reveal>
        ))}
      </div>

      {/* CTA */}
      <Reveal delay={0.15}>
        <div className="relative mt-16 overflow-hidden rounded-[2rem] border border-indigo-400/25 bg-gradient-to-br from-indigo-600/20 via-ink-900 to-ink-950 p-10 text-center sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />
          <div className="relative">
            <Sparkles size={28} className="mx-auto text-accent" />
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {dict.cta.title[0]}
              <span className="gradient-text">{dict.cta.title[1]}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">{dict.cta.desc}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/playground" className={btnClass("primary")}>
                {dict.nav.coba} <ArrowRight size={15} />
              </Link>
              <Link to="/arsitektur" className={btnClass("glass", undefined, "text-slate-200 hover:text-white")}>
                {dict.nav.arsitektur}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
