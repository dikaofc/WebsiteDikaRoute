import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Architecture from "./pages/Architecture";
import Docs from "./pages/Docs";
import FAQ from "./pages/FAQ";
import Changelog from "./pages/Changelog";
import Playground from "./pages/Playground";
import Contact from "./pages/Contact";
import Donate from "./pages/Donate";
import Forum from "./pages/Forum";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";

/** Lapisan background ambience — radial gradient kalem + blob cahaya yang
 *  bergerak pelan (hanya transform/opacity, GPU-friendly, reduced-motion aware). */
function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="bg-blob animate-drift-1 -top-48 -left-40 h-[32rem] w-[32rem] opacity-70"
        style={{ background: "radial-gradient(circle, var(--bg-glow-a), transparent 65%)" }} />
      <div className="bg-blob animate-drift-2 top-1/3 -right-52 h-[30rem] w-[30rem] opacity-60"
        style={{ background: "radial-gradient(circle, var(--bg-glow-b), transparent 65%)" }} />
      <div className="bg-blob animate-drift-1 -bottom-56 left-1/4 h-[28rem] w-[28rem] opacity-50"
        style={{ background: "radial-gradient(circle, var(--bg-glow-c), transparent 65%)" }} />
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-[60vh]"
    >
      {children}
    </motion.main>
  );
}

export default function App() {
  const { pathname, hash } = useLocation();

  /* Scroll handling: hash (#fitur, #arsitektur, dst.) di-scroll ke section —
     polling singkat karena elemen baru muncul setelah transisi halaman;
     tanpa hash, kembali ke atas halaman. */
  useEffect(() => {
    const id = hash ? hash.slice(1) : null;
    if (!id) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      return;
    }
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        window.clearInterval(timer);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (++tries > 40) {
        // elemen tak ditemukan (hash tidak valid) — berhenti mencoba
        window.clearInterval(timer);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [pathname, hash]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen pb-20 lg:pb-0">
        <AmbientBackground />
        <div className="relative z-10">
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes location={location} key={pathname}>
              <Route path="/" element={<Page><Home /></Page>} />
              <Route path="/fitur" element={<Page><Features /></Page>} />
              <Route path="/arsitektur" element={<Page><Architecture /></Page>} />
              <Route path="/docs" element={<Page><Docs /></Page>} />
              <Route path="/docs/:slug" element={<Page><Docs /></Page>} />
              <Route path="/faq" element={<Page><FAQ /></Page>} />
              <Route path="/changelog" element={<Page><Changelog /></Page>} />
              <Route path="/playground" element={<Page><Playground /></Page>} />
              <Route path="/contact" element={<Page><Contact /></Page>} />
              <Route path="/donasi" element={<Page><Donate /></Page>} />
              <Route path="/forum" element={<Page><Forum /></Page>} />
              <Route path="/unsubscribe" element={<Page><Unsubscribe /></Page>} />
              <Route path="*" element={<Page><NotFound /></Page>} />
            </Routes>
          </AnimatePresence>
          <Footer />
        </div>
        <MobileNav />
      </div>
    </MotionConfig>
  );
}
