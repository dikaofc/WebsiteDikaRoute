import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  BookOpenText,
  FlaskConical,
  MessagesSquare,
  MoreHorizontal,
  HelpCircle,
  GitCommitHorizontal,
  Heart,
  Mail,
  Github,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { GlassSheet } from "../lib/ui";
import { useLang } from "../i18n";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
}

/** Bottom navigation glass mengambang — iOS-like, safe-area aware. */
export default function MobileNav() {
  const { dict } = useLang();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const items: NavItem[] = [
    { id: "home", label: dict.nav.home, href: "/", icon: Home, active: pathname === "/" },
    { id: "docs", label: dict.nav.docs, href: "/docs", icon: BookOpenText, active: pathname.startsWith("/docs") },
    { id: "playground", label: dict.nav.playground, href: "/playground", icon: FlaskConical, active: pathname.startsWith("/playground") },
    { id: "forum", label: dict.nav.forum, href: "/forum", icon: MessagesSquare, active: pathname.startsWith("/forum") },
  ];

  const moreItems: { label: string; href: string; icon: LucideIcon }[] = [
    { label: dict.nav.faq, href: "/faq", icon: HelpCircle },
    { label: dict.nav.changelog, href: "/changelog", icon: GitCommitHorizontal },
    { label: dict.nav.donasi, href: "/donasi", icon: Heart },
    { label: dict.contact.eyebrow, href: "/contact", icon: Mail },
  ];

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        aria-label={dict.nav.label}
        className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="glass mx-auto flex max-w-md items-stretch justify-between rounded-[1.25rem] px-1.5 py-1.5 shadow-lift">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.href}
                aria-current={item.active ? "page" : undefined}
                className={clsx(
                  "flex min-w-[3.4rem] flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-200",
                  item.active
                    ? "glass-3 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={19} strokeWidth={item.active ? 2.3 : 1.8} />
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label={dict.nav.more}
            aria-expanded={moreOpen}
            className="flex min-w-[3.4rem] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
          >
            <MoreHorizontal size={19} strokeWidth={1.8} />
            <span className="text-[10px] font-semibold leading-none">{dict.nav.more}</span>
          </button>
        </div>
      </motion.nav>

      <GlassSheet open={moreOpen} onClose={() => setMoreOpen(false)} title={dict.nav.more}>
        <div className="space-y-1 px-3 pb-8 pt-2">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/contact"
              ? pathname.startsWith("/contact")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMoreOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                  active ? "glass-3 text-white" : "text-slate-200 hover:bg-white/5"
                )}
              >
                <Icon size={17} className={active ? "text-accent" : "text-slate-400"} />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-3 border-t border-white/10 pt-3">
            <a
              href="https://github.com/dikaofc/DikaRoute"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
            >
              <Github size={17} className="text-slate-400" />
              {dict.nav.github}
            </a>
          </div>
        </div>
      </GlassSheet>
    </>
  );
}
