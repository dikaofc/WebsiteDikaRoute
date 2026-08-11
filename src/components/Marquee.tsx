import { PROVIDERS } from "../content/data";
import { useLang } from "../i18n";
import { Tooltip, BrandTipCard } from "./Tooltip";

export default function Marquee() {
  const { lang } = useLang();
  const doubled = [...PROVIDERS, ...PROVIDERS];
  return (
    <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
        {doubled.map((p, i) => (
          <Tooltip
            key={`${p.name}-${i}`}
            label={<BrandTipCard icon={p.icon} title={p.name} description={p.desc[lang]} />}
          >
            <div className="glass-3 flex items-center gap-2.5 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white">
              {/* chip putih agar logo (umumnya monokrom) tetap terlihat di dark & light */}
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white p-[3px] shadow-sm">
                <img
                  src={p.icon}
                  alt={p.name}
                  width={18}
                  height={18}
                  loading="lazy"
                  className="h-[18px] w-[18px] object-contain"
                />
              </span>
              {p.name}
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
