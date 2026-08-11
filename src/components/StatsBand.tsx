import { useCountUp } from "../lib/hooks";
import { Reveal } from "../lib/ui";
import { useLang } from "../i18n";

const TARGETS: { target: number; decimals?: number; suffix?: string }[] = [
  { target: 290, suffix: "+" },
  { target: 6, suffix: "" },
  { target: 0.5, decimals: 1, suffix: "ms" },
  { target: 12, suffix: "+" },
  { target: 184, suffix: "K+" },
];

function Stat({
  target,
  decimals = 0,
  suffix = "",
  label,
  sub,
}: {
  target: number;
  decimals?: number;
  suffix?: string;
  label: string;
  sub: string;
}) {
  const { ref, value } = useCountUp(target, 1600, decimals);
  return (
    <div className="group relative text-center">
      <div className="font-display text-3xl font-bold text-white sm:text-4xl">
        <span ref={ref}>{decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("id-ID")}</span>
        <span className="gradient-text">{suffix}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-300">{label}</div>
      <div className="mt-0.5 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

export default function StatsBand() {
  const { dict } = useLang();
  const items = dict.stats.items;

  return (
    <section className="relative">
      <Reveal>
        <div className="glass grid grid-cols-2 gap-8 rounded-3xl px-6 py-10 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item, i) => (
            <Stat key={item.label} {...TARGETS[i]} label={item.label} sub={item.sub} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
