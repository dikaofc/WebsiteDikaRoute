import { cloneElement, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import clsx from "clsx";

/**
 * Tooltip generik & reusable.
 *
 * - Trigger = `children` (satu elemen) — handler hover ditambahkan via
 *   cloneElement sehingga DOM tidak berubah (tanpa wrapper).
 * - Kartu dirender lewat portal ke document.body dengan posisi fixed,
 *   jadi aman dipakai di dalam elemen ber-`overflow-hidden` (marquee, dst).
 * - Posisi otomatis diklamp agar kartu tidak keluar viewport.
 */
export function Tooltip({
  label,
  side = "top",
  className,
  disabled = false,
  children,
}: {
  label: ReactNode;
  side?: "top" | "bottom";
  className?: string;
  disabled?: boolean;
  children: ReactElement;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const half = 132; // setengah lebar kartu (w-64 = 256px) + margin
    const x = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8);
    setPos({ x, y: rect.top });
  };

  const trigger = cloneElement(
    children as ReactElement<{ onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void; onMouseLeave?: () => void }>,
    { onMouseEnter: show, onMouseLeave: () => setPos(null) }
  );

  return (
    <>
      {trigger}
      {pos &&
        !disabled &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, y: side === "top" ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{ left: pos.x, top: side === "top" ? pos.y - 10 : pos.y + 10 }}
            className={clsx(
              "pointer-events-none fixed z-[70] w-64 -translate-x-1/2",
              side === "top" ? "-translate-y-full" : "",
              className
            )}
          >
            {label}
            {/* caret */}
            <div
              className={clsx(
                "absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-white/10 bg-[var(--glass-pri-bg)]",
                side === "top"
                  ? "top-full -translate-y-1.5 border-b border-r"
                  : "bottom-full translate-y-1.5 border-t border-l"
              )}
            />
          </motion.div>,
          document.body
        )}
    </>
  );
}

/**
 * Kartu konten tooltip: chip logo (brand atau fallback) + judul + deskripsi.
 * Dipakai Marquee (ikon brand) dan daftar tools (ikon fallback).
 */
export function BrandTipCard({
  icon,
  title,
  description,
  fallbackIcon,
}: {
  icon?: string;
  title: string;
  description: string;
  fallbackIcon?: ReactNode;
}) {
  return (
    <div className="glass rounded-xl p-3.5 shadow-lg">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white p-[3px] shadow-sm">
          {icon ? (
            <img src={icon} alt="" width={20} height={20} loading="lazy" className="h-5 w-5 object-contain" />
          ) : (
            (fallbackIcon ?? <Sparkles size={14} className="text-slate-500" />)
          )}
        </span>
        <span className="text-[13px] font-bold text-white">{title}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}
