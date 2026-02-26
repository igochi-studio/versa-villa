"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";

const NAV_ITEMS = [
  "DESTRUCTION",
  "IT\u2019S PERSONAL",
  "AMBITION",
  "PROCESS ARCHIVE",
  "FUTURE",
];

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

const LOAD_OFFSET = 2.0;
const SCROLL_THRESHOLD = 80;
const MOUSE_REVEAL_ZONE = 60;

// ── Haptic sound ────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

function playTick(frequency = 4200, duration = 0.03, volume = 0.06) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // Silent fallback
  }
}

// ── Scroll hide/show ────────────────────────────────────────────────────────
function useHeaderVisibility() {
  const [shown, setShown] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const onScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y < SCROLL_THRESHOLD) setShown(true);
      else if (y > lastScrollY.current + 5) setShown(false);
      else if (y < lastScrollY.current - 5) setShown(true);
      lastScrollY.current = y;
      ticking.current = false;
    });
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (e.clientY < MOUSE_REVEAL_ZONE) setShown(true);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [onScroll, onMouseMove]);

  return shown;
}

// ── Dark/light detection ────────────────────────────────────────────────────
// Checks ALL elements at sample points (not just the topmost). This catches
// video elements and overlays that sit as siblings in the stacking context.
function useHeaderTheme(headerRef: React.RefObject<HTMLElement | null>) {
  const [isDark, setIsDark] = useState(true);
  const rafRef = useRef(0);

  useEffect(() => {
    const check = () => {
      const sampleY = 90;
      const header = headerRef.current;

      const isDarkAtPoint = (x: number): boolean => {
        const elements = document.elementsFromPoint(x, sampleY);
        for (const el of elements) {
          // Skip header and its children
          if (header && header.contains(el)) continue;

          // Video element = dark
          if (el.tagName === "VIDEO") return true;

          // Check background image
          const style = getComputedStyle(el);
          if (style.backgroundImage && style.backgroundImage !== "none") return true;

          // Check background color
          const bg = style.backgroundColor;
          if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
            const match = bg.match(/\d+/g);
            if (match) {
              const [r, g, b] = match.map(Number);
              return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
            }
          }
        }
        return false;
      };

      setIsDark(isDarkAtPoint(100) || isDarkAtPoint(window.innerWidth - 100));
      rafRef.current = requestAnimationFrame(check);
    };

    rafRef.current = requestAnimationFrame(check);
    return () => cancelAnimationFrame(rafRef.current);
  }, [headerRef]);

  return isDark;
}

// ── Movie state from Hero ───────────────────────────────────────────────────
function useMovieState() {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => setPlaying((e as CustomEvent).detail.playing);
    window.addEventListener("versa-movie", handler);
    return () => window.removeEventListener("versa-movie", handler);
  }, []);
  return playing;
}

function NavItem({ label, delay, isDark }: { label: string; delay: number; isDark: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.a
      href="#"
      className="header-nav-item"
      onMouseEnter={() => playTick(4800, 0.025, 0.04)}
      style={{
        fontFamily: "'Alte Haas Grotesk', sans-serif",
        fontSize: "18px",
        fontWeight: 400,
        textDecoration: "none",
        letterSpacing: "0.05em",
        textTransform: "uppercase" as const,
        display: "block",
        padding: "2px 0",
        color: isDark ? "#F8F2E4" : "#616D45",
        opacity: 0.85,
        transition: "opacity 150ms ease, transform 150ms ease, color 400ms ease",
      }}
      initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 0.85, x: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUINT, delay }}
    >
      [ {label} ]
    </motion.a>
  );
}

export default function Header() {
  const shouldReduceMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);
  const headerShown = useHeaderVisibility();
  const isDark = useHeaderTheme(headerRef);
  const moviePlaying = useMovieState();

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let done = false;
    const minTimer = new Promise<void>((r) => setTimeout(r, LOAD_OFFSET * 1000));
    Promise.all([minTimer, document.fonts.ready]).then(() => {
      if (!done) setLoaded(true);
    });
    return () => { done = true; };
  }, []);

  if (!loaded) return null;

  const isVisible = headerShown && !moviePlaying;

  return (
    <>
      <header
        ref={headerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "80px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pointerEvents: isVisible ? "auto" : "none",
          opacity: moviePlaying ? 0 : 1,
          transform: isVisible ? "translateY(0)" : "translateY(-100%)",
          transition: moviePlaying
            ? "opacity 300ms ease, transform 300ms ease"
            : "transform 400ms cubic-bezier(0.23, 1, 0.32, 1), opacity 400ms ease",
          willChange: "transform, opacity",
        }}
      >
        {/* Logo */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isDark ? "/versa-villa-logo.svg" : "/versa-villa-logo-dark.svg"}
            alt="Versa Villa by Arya"
            style={{ height: "52px", width: "auto", display: "block" }}
          />
        </motion.div>

        {/* Navigation */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "4px",
          }}
        >
          {NAV_ITEMS.map((item, i) => (
            <NavItem key={item} label={item} delay={0.15 + i * 0.07} isDark={isDark} />
          ))}
        </nav>
      </header>

      <style>{`
        .header-nav-item:hover {
          opacity: 1 !important;
          transform: translateX(-3px);
        }
      `}</style>
    </>
  );
}
