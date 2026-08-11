import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Github,
  TerminalSquare,
  Boxes,
  Heart,
  ShieldCheck,
  ChevronRight,
  Terminal as TerminalIcon,
} from "lucide-react";
import Terminal from "../components/Terminal";
import Marquee from "../components/Marquee";
import { Tooltip, BrandTipCard } from "../components/Tooltip";
import StatsBand from "../components/StatsBand";
import Pipeline from "../components/Pipeline";
import FaqAccordion from "../components/FaqAccordion";
import { Reveal, SectionHeading, CodeBlock, IconBadge, GradientTitle, btnClass } from "../lib/ui";
import { TOOLS } from "../content/data";
import { useTypewriter } from "../lib/hooks";
import { api } from "../lib/api";
import { useLang } from "../i18n";

function VersionBadge() {
  const { dict } = useLang();
  const h = dict.hero;
  const [version, setVersion] = useState("3.8.68");
  const [live, setLive] = useState(false);

  useEffect(() => {
    api
      .version()
      .then((v) => {
        if (v.version) setVersion(v.version);
        setLive(v.source !== "local");
      })
      .catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-3 inline-flex items-center gap-2.5 rounded-full border-indigo-400/30 px-4 py-1.5 text-xs font-semibold text-indigo-300"
    >
      <span className="flex h-2 w-2">
        <span className="absolute h-2 w-2 animate-ping rounded-full bg-accent opacity-75" />
        <span className="h-2 w-2 rounded-full bg-accent" />
      </span>
      v{version} · {h.badge}
      <span
        className={`hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] sm:flex ${
          live
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
            : "border-white/10 bg-white/5 text-slate-400"
        }`}
      >
        {live ? `● ${h.live}` : h.offline}
      </span>
    </motion.div>
  );
}

function Hero() {
  const { dict } = useLang();
  const h = dict.hero;
  const typed = useTypewriter(h.typed);

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 animate-grid-pan opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.22),transparent)]" />
        <div className="absolute -left-32 top-1/3 h-96 w-96 animate-float rounded-full bg-indigo-600/10 blur-[110px]" />
        <div className="absolute -right-24 top-16 h-80 w-80 animate-float-slow rounded-full bg-accent/15 blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 animate-float rounded-full bg-pink-500/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <VersionBadge />

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-6 font-display text-[2.6rem] font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-[4rem]"
          >
            {h.title1} <br />
            <span className="gradient-text">{h.title2}</span>
            <br />
            {h.title3}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            {h.desc}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 flex items-center gap-2 font-mono text-sm text-accent"
          >
            <TerminalIcon size={15} className="text-indigo-400" />
            <span className="text-slate-500">&gt;_</span> {typed}
            <span className="h-4 w-2 animate-blink bg-accent" />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/playground"
              className={btnClass("primary", "lg", "group")}
            >
              {h.ctaPlayground}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="https://github.com/dikaofc/DikaRoute"
              target="_blank"
              rel="noreferrer"
              className={btnClass("glass", "lg", "text-slate-200 hover:text-white")}
            >
              <Github size={16} />
              {h.ctaGithub}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex items-center gap-6 text-xs text-slate-500"
          >
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> {h.trust[0]}</span>
            <span className="flex items-center gap-1.5"><Heart size={14} className="text-pink-400" /> {h.trust[1]}</span>
            <span className="flex items-center gap-1.5"><Boxes size={14} className="text-cyan-400" /> {h.trust[2]}</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <Terminal />
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-indigo-500/20 to-accent/20 blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  const { dict } = useLang();
  const fx = dict.features;
  return (
    <section id="fitur" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow={fx.eyebrow}
        title={<GradientTitle parts={fx.title} />}
        description={fx.desc}
      />
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
    </section>
  );
}

function Architecture() {
  const { dict } = useLang();
  const a = dict.architecture;
  return (
    <section id="arsitektur" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow={a.eyebrow}
        title={<GradientTitle parts={a.title} />}
        description={a.desc}
      />
      <Reveal>
        <Pipeline />
      </Reveal>

      {/* strategies */}
      <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {a.strategies.items.map((s, i) => (
          <Reveal key={s.name} delay={i * 0.06}>
            <div className="glass-2 glass-hover group relative overflow-hidden rounded-2xl p-6">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl transition-all group-hover:bg-indigo-500/25" />
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-accent">0{i + 1}</span>
                <h3 className="font-display text-base font-semibold text-white">{s.name}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Compression() {
  const { dict } = useLang();
  const c = dict.compression;
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="glass relative overflow-hidden rounded-3xl p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pink-500/[0.07] blur-[90px]" />
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-pink-400/30 bg-pink-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-pink-300">
                {c.badge}
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                <GradientTitle parts={c.title} />
              </h2>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mt-5 text-slate-400 leading-relaxed">
                {c.desc}
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-6 space-y-3 text-sm text-slate-300">
                {c.items.map((t) => (
                  <div key={t} className="flex items-start gap-2.5">
                    <ChevronRight size={16} className="mt-0.5 shrink-0 text-pink-400" />
                    {t}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="glass-2 rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-300">{c.perRequest}</span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-300">
                  {c.saveBadge}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
                    <span>{c.noRoute}</span>
                    <span>24.800 tokens</span>
                  </div>
                  <div className="h-3.5 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-rose-500/70 to-rose-400/70"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
                    <span>{c.withRoute}</span>
                    <span className="text-emerald-300">16.400 tokens</span>
                  </div>
                  <div className="h-3.5 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "66%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500/70 to-accent/70"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-300">
                  {c.saveNote}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Security() {
  const { dict } = useLang();
  const s = dict.security;
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow={s.eyebrow}
        title={<GradientTitle parts={s.title} />}
        description={s.desc}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {s.items.map((item, i) => (
          <Reveal key={item.title} delay={(i % 4) * 0.07}>
            <div className="glass-2 card-hover h-full rounded-2xl p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
                <ShieldCheck size={17} />
              </div>
              <h3 className="mt-4 font-display text-[15px] font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{item.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CliSection() {
  const { dict, lang } = useLang();
  const c = dict.cli;
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
              {c.badge}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              <GradientTitle parts={c.title} />
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mt-5 text-slate-400 leading-relaxed">
              {c.desc}
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-7 flex flex-wrap gap-2">
              {TOOLS.map((t) => (
                <Tooltip
                  key={t.name}
                  label={
                    <BrandTipCard
                      title={t.name}
                      description={t.desc[lang]}
                      fallbackIcon={<TerminalIcon size={14} className="text-slate-500" />}
                    />
                  }
                >
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white">
                    {t.name}
                  </span>
                </Tooltip>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.26}>
            <Link
              to="/docs/cli"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-white"
            >
              {c.link}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="space-y-4">
            <CodeBlock
              title={c.codeTitle}
              code={c.code}
            />
            <div className="grid gap-2.5">
              {c.commands.map(([cmd, desc]) => (
                <div
                  key={cmd}
                  className="glass-3 group flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors hover:border-indigo-400/30"
                >
                  <code className="font-mono text-[13px] text-indigo-300">{cmd}</code>
                  <span className="text-xs text-slate-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FaqTeaser() {
  const { dict } = useLang();
  const f = dict.faqTeaser;
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow={f.eyebrow}
        title={<GradientTitle parts={f.title} />}
        description={f.desc}
      />
      <FaqAccordion items={dict.faq.slice(0, 4)} />
      <Reveal delay={0.15}>
        <div className="mt-8 text-center">
          <Link
            to="/faq"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-white"
          >
            {f.link}
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function CTA() {
  const { dict } = useLang();
  const c = dict.cta;
  return (
    <section className="relative mx-auto max-w-5xl px-4 py-24 sm:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-indigo-400/25 bg-gradient-to-br from-indigo-600/20 via-ink-900 to-ink-950 p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />
          <div className="relative">
            <TerminalSquare size={30} className="mx-auto text-accent" />
            <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              <GradientTitle parts={c.title} />
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-slate-400">
              {c.desc}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <CodeBlock
                className="w-full max-w-md !rounded-xl"
                title={c.installTitle}
                code={c.install}
              />
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <Link to="/docs" className={btnClass("primary")}>
                {c.docsBtn}
                <ArrowRight size={15} />
              </Link>
              <Link to="/donasi" className={btnClass("glass", undefined, "text-slate-200 hover:text-white")}>
                <Heart size={15} className="text-pink-400" />
                {c.donasiBtn}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function Home() {
  const { dict } = useLang();
  return (
    <>
      <Hero />
      <div className="relative border-y border-white/5 bg-white/[0.02] py-8">
        <div className="mx-auto mb-5 max-w-7xl px-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          {dict.marquee.label}
        </div>
        <Marquee />
      </div>
      <StatsBand />
      <Features />
      <Architecture />
      <Compression />
      <Security />
      <CliSection />
      <FaqTeaser />
      <CTA />
    </>
  );
}
