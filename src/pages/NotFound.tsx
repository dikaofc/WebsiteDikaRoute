import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Route } from "lucide-react";
import { useLang } from "../i18n";

export default function NotFound() {
  const { dict } = useLang();
  const p = dict.notFound;
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 pt-24 pb-20">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rotate-12 bg-indigo-500/10" />
      <div className="relative text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 glow-ring"
        >
          <Route size={34} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 font-display text-7xl font-bold text-white"
        >
          4<span className="gradient-text">0</span>4
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-slate-400"
        >
          {p.desc}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-center gap-3"
        >
          <Link to="/" className="btn-primary btn px-6 text-sm text-white">
            <ArrowLeft size={15} /> {p.back}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
