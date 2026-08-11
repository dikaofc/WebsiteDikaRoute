import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Languages } from "lucide-react";
import clsx from "clsx";
import { id as dictId } from "./id";
import { en as dictEn } from "./en";

export type Lang = "id" | "en";
export type Dict = typeof dictId;

const STORAGE_KEY = "dikaroute-lang";

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (path: string) => string;
  dict: Dict;
}

const Ctx = createContext<I18nCtx | null>(null);

function resolve(dict: Dict, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, dict);
  return typeof value === "string" ? value : path;
}

function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "id" || stored === "en") return stored;
  } catch {}
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")
    ? "en"
    : "id";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, [lang]);

  const value = useMemo<I18nCtx>(() => {
    const dict = lang === "en" ? dictEn : dictId;
    return {
      lang,
      setLang: setLangState,
      toggle: () => setLangState((l) => (l === "id" ? "en" : "id")),
      t: (path) => resolve(dict, path),
      dict,
    };
  }, [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang harus dipakai di dalam <LanguageProvider>");
  return ctx;
}

/** Switch bahasa ID / EN untuk navbar — segmented control glass ala iOS. */
export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className="glass-3 flex items-center gap-0.5 rounded-lg p-0.5"
      role="group"
      aria-label="Language"
    >
      {!compact && <Languages size={13} className="ml-1.5 mr-0.5 text-slate-500" />}
      {(["id", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={clsx(
            "rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition-all duration-200",
            lang === l
              ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
              : "text-slate-500 hover:text-white"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
