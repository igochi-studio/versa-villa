"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion, useInView, AnimatePresence } from "motion/react";
import Header from "../components/Header";
import { useIsMobile } from "../hooks/useIsMobile";

/* ─── Haptic sound ─── */
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
    // Audio not available
  }
}

/* ─── Constants ─── */
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;
const AUTO_CYCLE_MS = 5000;

interface Model {
  number: string;
  image: string;
  icon: string;
  stories: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  style: string;
}

const MODELS: Model[] = [
  { number: "001", image: "/villa-type-7.webp", icon: "/model 001.svg", stories: "1", bedrooms: "3", bathrooms: "4", area: "2,200", style: "MEDITERRANEAN" },
  { number: "002", image: "/villa-type-8.webp", icon: "/model 002.svg", stories: "1", bedrooms: "3", bathrooms: "4", area: "2,200", style: "MODERN" },
  { number: "003", image: "/villa-type-1.webp", icon: "/model 003.svg", stories: "2", bedrooms: "4", bathrooms: "5", area: "3,957", style: "MEDITERRANEAN" },
  { number: "004", image: "/villa-type-2.webp", icon: "/model 004.svg", stories: "2", bedrooms: "4", bathrooms: "5", area: "4,147", style: "MODERN" },
  { number: "005", image: "/villa-type-3.webp", icon: "/model 005.svg", stories: "3", bedrooms: "5", bathrooms: "6", area: "4,947", style: "MEDITERRANEAN" },
  { number: "006", image: "/villa-type-4.webp", icon: "/model 006.svg", stories: "3", bedrooms: "5", bathrooms: "6", area: "4,947", style: "MODERN" },
  { number: "007", image: "/villa-type-5.webp", icon: "/model 007.svg", stories: "3", bedrooms: "4", bathrooms: "6", area: "7,400", style: "MEDITERRANEAN" },
  { number: "008", image: "/villa-type-6.webp", icon: "/model 008.svg", stories: "3", bedrooms: "4", bathrooms: "6", area: "7,400", style: "CAPE COD" },
];

/* ─── Desktop: fullscreen gallery with SVG icon selector ─── */
function DesktopModelGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const goTo = useCallback((i: number) => {
    if (i === activeIndex) return;
    playTick(4200, 0.025, 0.04);
    setActiveIndex(i);
    setProgress(0);
    setPaused(true);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setPaused(false), 8000);
  }, [activeIndex]);

  // Smooth progress bar + auto-cycle
  useEffect(() => {
    if (paused) {
      setProgress(0);
      return;
    }
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const p = Math.min(elapsed / AUTO_CYCLE_MS, 1);
      setProgress(p);
      if (p >= 1) {
        setActiveIndex((prev) => (prev + 1) % MODELS.length);
        startRef.current = now;
        setProgress(0);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [paused, activeIndex]);

  useEffect(() => () => {
    if (resumeRef.current) clearTimeout(resumeRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const model = MODELS[activeIndex];

  return (
    <section
      style={{
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
      }}
    >
      {/* ── Full-bleed image ── */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`model-img-${activeIndex}`}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          style={{ position: "absolute", inset: 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={model.image}
            alt={`VersaVilla Model ${model.number}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Bottom gradient overlay ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.15) 70%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Bottom content: icons + details ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          padding: "0 clamp(24px, 4vw, 60px) clamp(32px, 3vh, 48px)",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {/* Model selector row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "2px",
          }}
        >
          {MODELS.map((m, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={m.number}
                onClick={() => goTo(i)}
                onMouseEnter={() => playTick(5000, 0.02, 0.03)}
                aria-label={`View Model ${m.number}`}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px clamp(6px, 1vw, 12px)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                  transform: isActive ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.icon}
                  alt={`Model ${m.number}`}
                  style={{
                    height: isActive ? "clamp(36px, 4vw, 52px)" : "clamp(28px, 3vw, 40px)",
                    width: "auto",
                    display: "block",
                    opacity: isActive ? 1 : 0.55,
                    filter: isActive
                      ? "brightness(1.15) drop-shadow(0 2px 10px rgba(184, 150, 90, 0.4))"
                      : "brightness(0.9) grayscale(0.3)",
                    transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                />
                {/* Model number */}
                <span
                  style={{
                    fontFamily: "'Alte Haas Grotesk', sans-serif",
                    fontSize: "10px",
                    fontWeight: 400,
                    letterSpacing: "0.15em",
                    color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                    transition: "color 0.4s ease",
                  }}
                >
                  {m.number}
                </span>
                {/* Active indicator — thin line */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    height: "1.5px",
                    width: isActive ? "20px" : "0px",
                    backgroundColor: "#B8965A",
                    transition: "width 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Details row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "'Alte Haas Grotesk', sans-serif",
            fontSize: "clamp(11px, 1vw, 13px)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.75)",
            flexWrap: "wrap",
            gap: "8px 0",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={`specs-${activeIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE_OUT_QUINT }}
            >
              {model.stories} Stories &middot; {model.bedrooms} Bed &middot; {model.bathrooms} Bath
            </motion.span>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.span
              key={`style-${activeIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE_OUT_QUINT, delay: 0.04 }}
              style={{ color: "#B8965A", fontWeight: 600 }}
            >
              {model.style}
            </motion.span>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.span
              key={`area-${activeIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE_OUT_QUINT, delay: 0.08 }}
            >
              {model.area} SF
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: "1px",
            backgroundColor: "rgba(255,255,255,0.1)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${progress * 100}%`,
              backgroundColor: "#B8965A",
              transition: paused ? "none" : "width 50ms linear",
            }}
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Mobile: scrolling model cards ─── */
function MobileModelCard({ model }: { model: Model }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, ease: EASE_OUT_QUINT }}
      style={{ marginBottom: "48px" }}
    >
      <div style={{ overflow: "hidden", borderRadius: "3px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={model.image}
          alt={`VersaVilla Model ${model.number}`}
          style={{ width: "100%", display: "block" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          padding: "14px 0 8px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: "20px",
            fontWeight: 400,
            color: "#4A3C24",
            letterSpacing: "-0.01em",
          }}
        >
          Model {model.number}
        </span>
        <span
          style={{
            fontFamily: "'Alte Haas Grotesk', sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#B8965A",
          }}
        >
          {model.style}
        </span>
      </div>
      <div
        style={{
          fontFamily: "'Alte Haas Grotesk', sans-serif",
          fontSize: "12px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(74, 60, 36, 0.5)",
          display: "flex",
          gap: "14px",
          paddingBottom: "14px",
          borderBottom: "1px solid rgba(74, 60, 36, 0.08)",
        }}
      >
        <span>{model.stories} Stories</span>
        <span>{model.bedrooms} Bed</span>
        <span>{model.bathrooms} Bath</span>
        <span>{model.area} SF</span>
      </div>
    </motion.div>
  );
}

/* ─── Page ─── */
export default function FuturePage() {
  const isMobile = useIsMobile();

  return (
    <main style={{ backgroundColor: "#F8F2E4", minHeight: "100vh" }}>
      <Header />

      {/* Desktop: fullscreen gallery | Mobile: scrolling cards */}
      {isMobile ? (
        <section style={{ padding: "80px 20px 40px" }}>
          {MODELS.map((m) => (
            <MobileModelCard key={m.number} model={m} />
          ))}
        </section>
      ) : (
        <DesktopModelGallery />
      )}
    </main>
  );
}
