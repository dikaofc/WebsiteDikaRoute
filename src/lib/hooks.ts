import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

/** Animated number counter that runs when scrolled into view. */
export function useCountUp(target: number, duration = 1800, decimals = 0) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(parseFloat((target * eased).toFixed(decimals)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, decimals]);

  return { ref, value };
}

/** Typewriter effect that types out `lines` and loops. */
export function useTypewriter(lines: string[], speed = 38) {
  const [lineIdx, setLineIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = lines[lineIdx % lines.length];
    let delay = speed;
    if (deleting) delay = 16;

    const t = setTimeout(() => {
      if (!deleting) {
        const next = current.slice(0, text.length + 1);
        setText(next);
        if (next === current) {
          setTimeout(() => setDeleting(true), 1900);
        }
      } else {
        const next = current.slice(0, text.length - 1);
        setText(next);
        if (next === "") {
          setDeleting(false);
          setLineIdx((i) => (i + 1) % lines.length);
        }
      }
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, lineIdx, lines, speed]);

  return text;
}
