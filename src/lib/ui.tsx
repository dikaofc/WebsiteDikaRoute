import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import clsx from "clsx";

/* =====================================================================
   Motion easing bersama (satu bahasa gerak di seluruh situs)
   ===================================================================== */
export const EASE = [0.22, 1, 0.36, 1] as const;

/* Scroll-reveal wrapper */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.65, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* =====================================================================
   PRIMITIF FLUID GLASS
   ===================================================================== */

/** Kartu glass utama (primary). */
export function GlassCard({
  className,
  hover = false,
  children,
}: {
  className?: string;
  hover?: boolean;
  children: ReactNode;
}) {
  return <div className={clsx("glass rounded-2xl", hover && "card-hover", className)}>{children}</div>;
}

/* ---------- Tombol ---------- */

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger" | "success" | "glass" | "icon" | "float";
export type ButtonSize = "sm" | "md" | "lg";

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  tertiary: "btn-tertiary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  success: "btn-success",
  glass: "btn-glass",
  icon: "btn-icon btn-ghost",
  float: "btn-float",
};

/** Kelas tombol reusable — juga untuk <a>/<Link> agar tampil sebagai tombol. */
export function btnClass(variant: ButtonVariant = "primary", size?: ButtonSize, className?: string) {
  return clsx(
    "btn",
    BTN_VARIANTS[variant],
    size === "sm" && "btn-sm",
    size === "lg" && "btn-lg",
    className
  );
}

/** Tombol glass — semua varian: primary, secondary, tertiary, ghost, danger, success + loading. */
export function GlassButton({
  variant = "primary",
  size,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      className={clsx(btnClass(variant, size), loading && "is-loading", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="btn-spinner" aria-hidden />}
      {children}
    </button>
  );
}

/* ---------- Badge, Input, Skeleton ---------- */

/** Badge glass kecil (tertiary). */
export function GlassBadge({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={clsx("badge-glass", className)}>{children}</span>;
}

/** Input glass — latar translucent + blur otomatis dari aturan global form kontrol. */
export function GlassInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "h-11 w-full rounded-xl px-3.5 text-sm text-white placeholder:text-slate-600 outline-none",
        className
      )}
      {...rest}
    />
  );
}

/** Select glass dengan chevron kustom. */
export function GlassSelect({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={clsx("relative", className)}>
      <select
        className="h-11 w-full appearance-none rounded-xl pl-3.5 pr-9 text-sm text-white outline-none"
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

/** Skeleton loading glass. */
export function GlassSkeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} />;
}

/* ---------- Switch ---------- */

/** Toggle ala iOS — glass & lancar. */
export function GlassSwitch({
  checked,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={typeof label === "string" ? label : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx("switch", className)}
    />
  );
  if (!label) return control;
  return (
    <span className="inline-flex items-center gap-3">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {control}
    </span>
  );
}

/* ---------- Tabs ---------- */

/** Segmen tab glass dengan indikator geser (layoutId). */
export function GlassTabs<T extends string>({
  items,
  value,
  onChange,
  id = "tabs",
  className,
  label,
}: {
  items: { id: T; label: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  id?: string;
  className?: string;
  label?: string;
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = items.findIndex((i) => i.id === value);
    let next = -1;
    if (e.key === "ArrowRight") next = (idx + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(items[next].id);
    }
  };

  return (
    <div className={clsx("tabs", className)} role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className="tab relative"
          >
            {selected && (
              <motion.span
                layoutId={`glass-tab-${id}`}
                className="absolute inset-0 rounded-[9px] border border-white/10 bg-white/[0.09] shadow-sm"
                transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Modal & Sheet ---------- */

/** Fokus panel + Escape menutup + kunci scroll body + restore fokus — dipakai GlassModal & GlassSheet. */
function useOverlayFocus(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement | null>) {
  const prev = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Saat open: fokus panel, trap Tab, Escape menutup, kunci scroll body.
  useEffect(() => {
    if (!open) return;
    prev.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => ref.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      // trap Tab di dalam panel
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, ref]);

  // Restore fokus hanya saat transisi open → closed (bukan saat re-render).
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
    } else if (wasOpen.current) {
      wasOpen.current = false;
      prev.current?.focus?.();
    }
  }, [open]);
}

/** Modal glass terpusat — layaknya sheet iOS di desktop. */
export function GlassModal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayFocus(open, onClose, panelRef);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center p-4 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="overlay-backdrop absolute inset-0"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={clsx(
              "glass-strong relative w-full max-w-lg rounded-[1.75rem] p-6 outline-none sm:p-8",
              "max-h-[88vh] overflow-y-auto",
              className
            )}
          >
            {(title || description) && (
              <div className="mb-5 flex items-start gap-4 pr-10">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 className="font-display text-xl font-bold tracking-tight text-white">{title}</h2>
                  )}
                  {description && <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{description}</p>}
                </div>
              </div>
            )}
            {children}
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="glass-3 absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white"
            >
              <X size={15} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Sheet glass — bottom sheet (mobile) atau panel samping (docs drawer). */
export function GlassSheet({
  open,
  onClose,
  title,
  children,
  side = "bottom",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  side?: "bottom" | "left";
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayFocus(open, onClose, panelRef);

  const isBottom = side === "bottom";
  const panelClass = isBottom
    ? "inset-x-0 bottom-0 rounded-t-[1.75rem] max-h-[85vh]"
    : "left-0 top-0 h-full w-[19rem] rounded-r-[1.75rem]";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={clsx("fixed z-[var(--z-sheet)]", isBottom ? "inset-0 flex items-end" : "inset-0")}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="overlay-backdrop absolute inset-0"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            tabIndex={-1}
            initial={isBottom ? { y: "100%" } : { x: "-100%" }}
            animate={isBottom ? { y: 0 } : { x: 0 }}
            exit={isBottom ? { y: "100%" } : { x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className={clsx("glass-strong absolute flex flex-col outline-none", panelClass, className)}
          >
            {isBottom && (
              <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-500/40" />
            )}
            {title && (
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <div className="font-display text-base font-bold text-white">{title}</div>
                <button
                  onClick={onClose}
                  aria-label="Tutup"
                  className="glass-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* =====================================================================
   HEADER HALAMAN
   ===================================================================== */

/** Floating glass header untuk halaman dalam — kontekstual, konsisten. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  center = true,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
  center?: boolean;
}) {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[1.75rem] px-6 py-12 sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[32rem] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[90px]" />
        <div className="glass-strong relative h-full rounded-[1.75rem] px-6 py-10 sm:px-12 sm:py-14">
          <div className={clsx("max-w-3xl", center && "mx-auto text-center")}>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="glass-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {eyebrow}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06, ease: EASE }}
              className="mt-5 font-display text-[2rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[2.75rem]"
            >
              {title}
            </motion.h1>
            {description && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
                className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-400 sm:text-base"
              >
                {description}
              </motion.p>
            )}
            {children && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
                className={clsx("mt-7", center && "flex flex-wrap justify-center gap-3")}
              >
                {children}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* Section heading block (dipakai section di Home) */
export function SectionHeading({
  eyebrow,
  title,
  description,
  center = true,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={clsx("max-w-3xl mb-14", center && "mx-auto text-center")}>
      <Reveal>
        <span className="glass-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-widest uppercase text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="mt-5 font-display text-3xl md:text-[2.6rem] leading-[1.12] font-bold text-white tracking-tight">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.16}>
          <p className="mt-5 text-base md:text-lg text-slate-400 leading-relaxed">{description}</p>
        </Reveal>
      )}
    </div>
  );
}

/* Code block with header bar */
export function CodeBlock({
  code,
  title = "terminal",
  className,
}: {
  code: string;
  title?: string;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-2xl border border-white/10 bg-ink-900/90 overflow-hidden backdrop-blur-md shadow-sm", className)}>
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[11px] text-slate-400">{title}</span>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed font-mono text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* Renders title parts with alternating gradient highlight (odd index = gradient). */
export function GradientTitle({ parts }: { parts: string[] }) {
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="gradient-text">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* Gradient badge for feature icons */
export function IconBadge({ icon, tone = "indigo" }: { icon: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    indigo: "from-indigo-500/25 to-indigo-500/5 text-indigo-300 border-indigo-400/25",
    cyan: "from-cyan-500/25 to-cyan-500/5 text-cyan-300 border-cyan-400/25",
    pink: "from-pink-500/25 to-pink-500/5 text-pink-300 border-pink-400/25",
    emerald: "from-emerald-500/25 to-emerald-500/5 text-emerald-300 border-emerald-400/25",
    amber: "from-amber-500/25 to-amber-500/5 text-amber-300 border-amber-400/25",
  };
  return (
    <div className={clsx("inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br", tones[tone] ?? tones.indigo)}>
      {icon}
    </div>
  );
}
