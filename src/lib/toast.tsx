import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import clsx from "clsx";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
}

interface ToastCtx {
  toast: (kind: ToastKind, title: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

let nextId = 1;

const KIND_STYLE: Record<ToastKind, { icon: ReactNode; chip: string; ring: string }> = {
  success: {
    icon: <CheckCircle2 size={16} className="text-emerald-400" />,
    chip: "border-emerald-400/25 bg-emerald-500/10",
    ring: "border-emerald-400/20",
  },
  error: {
    icon: <AlertCircle size={16} className="text-rose-400" />,
    chip: "border-rose-400/25 bg-rose-500/10",
    ring: "border-rose-400/20",
  },
  info: {
    icon: <Info size={16} className="text-indigo-400" />,
    chip: "border-indigo-400/25 bg-indigo-500/10",
    ring: "border-indigo-400/20",
  },
};

/** Notifikasi glass mengambang — sukses/error/info, auto-dismiss + tombol tutup. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((kind: ToastKind, title: string) => {
    const id = nextId++;
    setItems((prev) => [...prev.slice(-2), { id, kind, title }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-4 z-[var(--z-toast)] flex flex-col items-center gap-2 px-4 sm:top-6"
        >
          <AnimatePresence>
            {items.map((t) => {
              const s = KIND_STYLE[t.kind];
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className={clsx(
                    "glass-strong pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3",
                    "border-l-2",
                    s.ring
                  )}
                  role="status"
                >
                  <span
                    className={clsx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                      s.chip
                    )}
                  >
                    {s.icon}
                  </span>
                  <span className="flex-1 text-sm font-medium text-white">{t.title}</span>
                  <button
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                    aria-label="Tutup"
                    className="glass-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx;
}
