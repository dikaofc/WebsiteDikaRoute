import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import clsx from "clsx";
import { useLang } from "../i18n";

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items }: { items?: FaqItem[] }) {
  const { dict } = useLang();
  const list = items ?? dict.faq;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {list.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={item.q}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.05, duration: 0.45 }}
            className={clsx(
              "overflow-hidden rounded-2xl transition-all duration-300",
              isOpen
                ? "glass-2 border-indigo-400/40 shadow-lift"
                : "glass-3 hover:border-white/25"
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
              <MessageCircleQuestion
                size={19}
                className={clsx("shrink-0 transition-colors", isOpen ? "text-accent" : "text-slate-500")}
              />
              <span className="flex-1 text-[15px] font-semibold text-white">{item.q}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className={clsx("shrink-0", isOpen ? "text-accent" : "text-slate-500")}
              >
                <ChevronDown size={19} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="border-t border-white/5 px-5 py-4 pl-16 text-sm leading-relaxed text-slate-400">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
