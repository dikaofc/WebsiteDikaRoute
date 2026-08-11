import { motion } from "framer-motion";
import { Workflow, Server, Cpu, Activity, ShieldCheck, Zap } from "lucide-react";
import { Reveal } from "../lib/ui";
import { useLang } from "../i18n";

function FlowLine({ label }: { label: string }) {
  return (
    <div className="relative h-10 flex-1 overflow-visible">
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-indigo-500/60 to-accent/60" />
      <span className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 animate-flow-x bg-gradient-to-r from-transparent via-white to-transparent" />
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </span>
    </div>
  );
}

function Node({
  icon,
  title,
  sub,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass card-hover flex flex-col items-center gap-2 rounded-2xl px-4 py-5 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/25 to-indigo-500/5 text-indigo-300">
        {icon}
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </motion.div>
  );
}

export default function Pipeline() {
  const { dict } = useLang();
  const p = dict.architecture.pipeline;
  const chips = dict.architecture.flowChips;
  const chipIcons = [ShieldCheck, Zap, Activity];

  return (
    <div className="glass rounded-3xl p-6 sm:p-10">
      <Reveal>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300">
            <Workflow size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">{p.title}</h3>
            <p className="text-xs text-slate-500">{p.sub}</p>
          </div>
        </div>
      </Reveal>

      <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
        <Node icon={<Server size={19} />} title={p.appTitle} sub={p.appSub} delay={0} />
        <div className="flex w-full items-center gap-2 md:w-16 md:flex-col">
          <FlowLine label={p.flowOpenai} />
        </div>
        <Node icon={<Cpu size={19} />} title={p.drTitle} sub={p.drSub} delay={0.15} />
        <div className="flex w-full items-center gap-2 md:w-16 md:flex-col">
          <FlowLine label={p.flowSmart} />
        </div>
        <Node icon={<Activity size={19} />} title={p.provTitle} sub={p.provSub} delay={0.3} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {chips.map((text, i) => {
          const Icon = chipIcons[i];
          return (
            <Reveal key={i} delay={0.1 * i}>
              <div className="glass-3 flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] text-slate-300">
                <span className="text-accent"><Icon size={16} /></span>
                {text}
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
