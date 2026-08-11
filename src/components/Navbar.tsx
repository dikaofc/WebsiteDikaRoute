import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Github, ArrowRight, Moon, Sun } from "lucide-react";
import clsx from "clsx";
import { LanguageSwitch, useLang } from "../i18n";
import { useTheme } from "../lib/theme";
import { btnClass } from "../lib/ui";

/** Tombol toggle dark/light — ikon menyesuaikan tema aktif. */
function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const { dict } = useLang();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? dict.nav.themeLight : dict.nav.themeDark}
      title={isDark ? dict.nav.themeLight : dict.nav.themeDark}
      className={clsx(
        "glass-3 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:border-white/25 hover:bg-white/5 active:scale-95",
        compact ? "h-9 w-9" : "h-9 w-9"
      )}
    >
      <span className="relative flex h-4 w-4">
        <Sun
          size={16}
          className={clsx(
            "absolute inset-0 transition-all duration-300",
            isDark ? "rotate-0 scale-100 opacity-100 text-amber-300" : "rotate-90 scale-0 opacity-0"
          )}
        />
        <Moon
          size={16}
          className={clsx(
            "absolute inset-0 transition-all duration-300",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 text-slate-200"
          )}
        />
      </span>
    </button>
  );
}

export default function Navbar() {
  const { dict } = useLang();
  const nav = dict.nav;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkCls = (active: boolean) =>
    clsx(
      "rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200",
      active ? "glass-3 text-white shadow-sm" : "text-slate-300 hover:bg-white/5 hover:text-white"
    );

  return (
    <header className="fixed inset-x-0 top-0 z-[var(--z-header)] px-3 pt-3 sm:px-6">
      <div
        className={clsx(
          "mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl px-2.5 transition-all duration-300 sm:px-4",
          scrolled || open ? "glass shadow-lift" : "border border-transparent bg-transparent"
        )}
      >
        <Link to="/" className="group flex items-center gap-2.5 pl-1.5">
          <img
            src="/dikaroute.svg"
            alt="DikaRoute"
            className="h-8 w-8 transition-transform duration-500 group-hover:rotate-[360deg]"
          />
          <span className="font-display text-lg font-bold text-white tracking-tight">
            Dika<span className="gradient-text">Route</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {nav.links.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={linkCls(isActive(link.href))}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 lg:flex">
          <ThemeToggle />
          <LanguageSwitch />
          <a
            href="https://github.com/dikaofc/DikaRoute"
            target="_blank"
            rel="noreferrer"
            className={clsx(btnClass("tertiary", "sm"), "h-9 rounded-lg px-3 text-slate-300 hover:text-white")}
          >
            <Github size={15} />
            {nav.github}
          </a>
          <Link to="/playground" className={btnClass("primary", "sm", "group h-9 rounded-xl px-4 text-sm text-white")}>
            {nav.coba}
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle compact />
          <LanguageSwitch compact />
          <button
            onClick={() => setOpen((v) => !v)}
            className="glass-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-200 transition-colors active:scale-95"
            aria-label={nav.menu}
            aria-expanded={open}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="glass mx-auto mt-2 max-w-7xl rounded-2xl p-3 lg:hidden"
          >
            <div className="space-y-1">
              {nav.links.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={link.href}
                    className={clsx(
                      "block rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                      isActive(link.href) ? "glass-3 text-white" : "text-slate-200 hover:bg-white/5"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-3 flex gap-2.5 border-t border-white/10 pt-3">
                <a
                  href="https://github.com/dikaofc/DikaRoute"
                  target="_blank"
                  rel="noreferrer"
                  className={btnClass("glass", undefined, "flex-1 text-sm")}
                >
                  <Github size={15} /> {nav.github}
                </a>
                <Link to="/playground" className={btnClass("primary", undefined, "flex-1 text-sm text-white")}>
                  {nav.coba}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
