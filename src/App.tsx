import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import Footer from "./components/Footer";

/* Code-splitting: tiap halaman dimuat on-demand (chunk terpisah) → first-load
   lebih ringan & cepat, halaman lain baru diunduh saat dibuka. */
const Home = lazy(() => import("./pages/Home"));
const Features = lazy(() => import("./pages/Features"));
const Architecture = lazy(() => import("./pages/Architecture"));
const Docs = lazy(() => import("./pages/Docs"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Changelog = lazy(() => import("./pages/Changelog"));
const Playground = lazy(() => import("./pages/Playground"));
const Contact = lazy(() => import("./pages/Contact"));
const Donate = lazy(() => import("./pages/Donate"));
const Forum = lazy(() => import("./pages/Forum"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));

/**
 * Error boundary global — bila ada halaman yang crash saat render (bug tak
 * terduga), pengunjung melihat kartu error yang bisa di-reload, BUKAN layar
 * putih kosong (root cause keluhan "halaman blank/null").
 */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-black bg-amber-400 shadow-[4px_4px_0_0_#16161a]">
            <AlertTriangle size={28} className="text-black" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-extrabold text-white">
            Ups — ada yang salah di halaman ini
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Terjadi error saat merender halaman. Ini bukan masalah jaringanmu.
            Silakan muat ulang, atau kembali ke beranda.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="btn btn-primary text-sm text-white"
            >
              <RotateCcw size={15} /> Coba lagi
            </button>
            <a href="/" className="btn btn-secondary text-sm">
              Ke Beranda
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Dekorasi latar ringan (tanpa blur — murah untuk GPU & hemat di mobile). */
function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-64 w-64 -rotate-12 bg-primary/[0.06] transition-transform" />
      <div className="absolute -right-20 top-1/3 h-56 w-56 rotate-45 bg-accent/[0.05]" />
      <div className="absolute -bottom-28 left-1/4 h-72 w-72 -rotate-6 bg-glow/[0.04]" />
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-[60vh]"
    >
      {children}
    </motion.main>
  );
}

/** Fallback saat chunk halaman sedang diunduh — loader brutalist yang halus. */
function RouteLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass flex items-center gap-3 rounded-xl px-6 py-4 text-sm font-semibold text-slate-400">
        <Loader2 size={17} className="animate-spin text-primary" />
        Memuat halaman…
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const { pathname, hash } = location;

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
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
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
            </Suspense>
          </ErrorBoundary>
          <Footer />
        </div>
        <MobileNav />
      </div>
    </MotionConfig>
  );
}
