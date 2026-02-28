"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { PauseIcon, PlayIcon } from "@radix-ui/react-icons";
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
    // Audio not available — silent fallback
  }
}

/* ─── Constants ─── */

const EASE_OUT_QUINT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const FEATURE_DURATION = 6000;
const SCROLL_HEIGHT = "700vh"; // enough scroll room for 6 features

const FEATURES = [
  {
    number: "01",
    title: "Autonomous Detection",
    copy: "Satellites, heat sensors, and AI-powered cameras detect fire before it reaches the home. The system douses the exterior on its own, even when municipal water and power fail.",
    cost: "$325,000",
    label: "FIRE DETECTION SYSTEM",
    cue: "Detection",
    media: { src: "/detection system.jpeg", type: "image" as const },
  },
  {
    number: "02",
    title: "Structural Steel",
    copy: "30 tons of precision structural steel replace the traditional wood frame. This is the skeleton of a home that refuses to burn.",
    cost: "$300,000",
    label: "STEEL FRAME",
    cue: "Steel",
    media: { src: "/steel.jpeg", type: "image" as const },
  },
  {
    number: "03",
    title: "Six-Hour Walls",
    copy: "12-inch composite walls made from stone, magnesium oxide, sulfate board, and gypsum. Engineered to resist an active blaze for six hours.",
    cost: "$400,000",
    label: "FIRE-RATED WALLS",
    cue: "Walls",
    media: { src: "/walls.jpeg", type: "image" as const },
  },
  {
    number: "04",
    title: "Sealed Glass",
    copy: "Lab-grade borosilicate glass framed by metal shutters that seal remotely. Every opening becomes a barrier.",
    cost: "$300,000",
    label: "BOROSILICATE WINDOWS",
    cue: "Glass",
    media: { src: "/glass.mov", type: "video" as const },
  },
  {
    number: "05",
    title: "Off-Grid Backup",
    copy: "On-site generators and independent water reserves keep every defense system running when the grid goes dark.",
    cost: null,
    label: "BACKUP SYSTEMS",
    cue: "Backup",
    media: { src: "/backup.webp", type: "image" as const },
  },
  {
    number: "06",
    title: "Zero Combustion",
    copy: "No combustible surface touches the outside world. The entire building envelope is engineered to give fire nothing to feed on.",
    cost: null,
    label: "NONCOMBUSTIBLE ENVELOPE",
    cue: "Envelope",
    media: { src: "/envelope.jpeg", type: "image" as const },
  },
];

// Scroll thresholds — evenly spaced for 6 features
const THRESHOLDS = FEATURES.map((_, i) => i / FEATURES.length);

function getPhase(progress: number): number {
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (progress >= THRESHOLDS[i]) return i;
  }
  return 0;
}

/* ─── Illustration SVGs ─── */

function IllustrationDetection() {
  return (
    <svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="300" cy="320" rx="180" ry="40" stroke="#616D45" strokeWidth="2.5" opacity="0.35" />
      <path d="M300 120 L300 280" stroke="#4A3C24" strokeWidth="3" />
      <circle cx="300" cy="110" r="16" stroke="#B8965A" strokeWidth="3" fill="none" />
      <circle cx="300" cy="110" r="6" fill="#B8965A" opacity="0.7" />
      <path d="M330 130 Q360 160 340 200" stroke="#B8965A" strokeWidth="2.5" fill="none" opacity="0.8" />
      <path d="M345 120 Q390 160 360 210" stroke="#B8965A" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M360 110 Q420 160 380 220" stroke="#B8965A" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M220 380 L220 300 L300 250 L380 300 L380 380 Z" stroke="#4A3C24" strokeWidth="3" fill="none" />
      <rect x="270" y="330" width="60" height="50" stroke="#4A3C24" strokeWidth="2.5" fill="none" />
      <path d="M140 380 L460 380" stroke="#616D45" strokeWidth="2" opacity="0.5" />
      <circle cx="200" cy="260" r="5" fill="#B8965A" opacity="0.8" />
      <circle cx="400" cy="260" r="5" fill="#B8965A" opacity="0.8" />
      <circle cx="300" cy="200" r="5" fill="#B8965A" opacity="0.8" />
      <circle cx="300" cy="310" r="120" stroke="#B8965A" strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.35" />
    </svg>
  );
}

function IllustrationSteel() {
  return (
    <svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <rect x="260" y="140" width="80" height="14" fill="#4A3C24" opacity="0.9" />
      <rect x="288" y="154" width="24" height="278" fill="#4A3C24" opacity="0.7" />
      <rect x="260" y="432" width="80" height="14" fill="#4A3C24" opacity="0.9" />
      <rect x="160" y="200" width="60" height="12" fill="#4A3C24" opacity="0.7" />
      <rect x="181" y="212" width="18" height="176" fill="#4A3C24" opacity="0.5" />
      <rect x="160" y="388" width="60" height="12" fill="#4A3C24" opacity="0.7" />
      <rect x="380" y="200" width="60" height="12" fill="#4A3C24" opacity="0.7" />
      <rect x="401" y="212" width="18" height="176" fill="#4A3C24" opacity="0.5" />
      <rect x="380" y="388" width="60" height="12" fill="#4A3C24" opacity="0.7" />
      <line x1="196" y1="212" x2="288" y2="300" stroke="#B8965A" strokeWidth="2.5" opacity="0.6" />
      <line x1="312" y1="300" x2="404" y2="212" stroke="#B8965A" strokeWidth="2.5" opacity="0.6" />
      <line x1="196" y1="388" x2="288" y2="300" stroke="#B8965A" strokeWidth="2.5" opacity="0.5" />
      <line x1="312" y1="300" x2="404" y2="388" stroke="#B8965A" strokeWidth="2.5" opacity="0.5" />
      <circle cx="196" cy="212" r="5" fill="#B8965A" opacity="0.7" />
      <circle cx="404" cy="212" r="5" fill="#B8965A" opacity="0.7" />
      <circle cx="288" cy="154" r="5" fill="#B8965A" opacity="0.7" />
      <circle cx="312" cy="154" r="5" fill="#B8965A" opacity="0.7" />
      <text x="300" y="500" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="14" fill="#4A3C24" opacity="0.6" letterSpacing="3">30 TONS</text>
    </svg>
  );
}

function IllustrationWalls() {
  return (
    <svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <rect x="180" y="160" width="240" height="300" stroke="#4A3C24" strokeWidth="3" fill="none" />
      <rect x="180" y="160" width="60" height="300" fill="#4A3C24" opacity="0.25" />
      <text x="210" y="490" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="11" fill="#4A3C24" opacity="0.7" letterSpacing="1" transform="rotate(-90 210 490)">STONE</text>
      <rect x="240" y="160" width="60" height="300" fill="#616D45" opacity="0.18" />
      <text x="270" y="490" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="11" fill="#616D45" opacity="0.7" letterSpacing="1" transform="rotate(-90 270 490)">MGO</text>
      <rect x="300" y="160" width="60" height="300" fill="#B8965A" opacity="0.18" />
      <text x="330" y="490" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="11" fill="#B8965A" opacity="0.7" letterSpacing="1" transform="rotate(-90 330 490)">SULFATE</text>
      <rect x="360" y="160" width="60" height="300" fill="#4A3C24" opacity="0.14" />
      <text x="390" y="490" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="11" fill="#4A3C24" opacity="0.6" letterSpacing="1" transform="rotate(-90 390 490)">GYPSUM</text>
      <line x1="180" y1="140" x2="420" y2="140" stroke="#B8965A" strokeWidth="2" opacity="0.6" />
      <line x1="180" y1="133" x2="180" y2="147" stroke="#B8965A" strokeWidth="2" opacity="0.6" />
      <line x1="420" y1="133" x2="420" y2="147" stroke="#B8965A" strokeWidth="2" opacity="0.6" />
      <text x="300" y="131" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="13" fill="#B8965A" opacity="0.8" letterSpacing="2">12 INCHES</text>
      <path d="M140 310 Q130 280 145 260 Q135 290 150 300 Q155 270 160 290 Q165 260 155 310 Z" fill="#B8965A" opacity="0.5" />
    </svg>
  );
}

function IllustrationWindows() {
  return (
    <svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <rect x="180" y="160" width="240" height="300" stroke="#4A3C24" strokeWidth="3.5" fill="none" rx="2" />
      <line x1="300" y1="160" x2="300" y2="460" stroke="#4A3C24" strokeWidth="2.5" />
      <line x1="180" y1="310" x2="420" y2="310" stroke="#4A3C24" strokeWidth="2.5" />
      <rect x="182" y="162" width="117" height="147" fill="#616D45" opacity="0.1" />
      <rect x="301" y="162" width="117" height="147" fill="#616D45" opacity="0.1" />
      <rect x="182" y="312" width="117" height="147" fill="#616D45" opacity="0.1" />
      <rect x="301" y="312" width="117" height="147" fill="#616D45" opacity="0.1" />
      <rect x="420" y="160" width="40" height="300" fill="#4A3C24" opacity="0.2" stroke="#4A3C24" strokeWidth="2" />
      <line x1="430" y1="160" x2="430" y2="460" stroke="#4A3C24" strokeWidth="1" opacity="0.5" />
      <line x1="440" y1="160" x2="440" y2="460" stroke="#4A3C24" strokeWidth="1" opacity="0.5" />
      <line x1="450" y1="160" x2="450" y2="460" stroke="#4A3C24" strokeWidth="1" opacity="0.5" />
      <rect x="140" y="160" width="40" height="300" fill="#4A3C24" opacity="0.1" stroke="#4A3C24" strokeWidth="1" strokeDasharray="4 3" />
      <text x="300" y="520" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="12" fill="#4A3C24" opacity="0.6" letterSpacing="3">BOROSILICATE</text>
      <circle cx="300" cy="236" r="30" stroke="#B8965A" strokeWidth="2" fill="none" opacity="0.4" strokeDasharray="4 3" />
      <text x="300" y="240" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="11" fill="#B8965A" opacity="0.7">HEAT</text>
    </svg>
  );
}

function IllustrationBackup() {
  return (
    <svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <rect x="160" y="260" width="120" height="100" stroke="#4A3C24" strokeWidth="3" fill="none" rx="4" />
      <circle cx="220" cy="310" r="25" stroke="#4A3C24" strokeWidth="2.5" fill="none" />
      <path d="M210 300 L220 315 L230 300" stroke="#B8965A" strokeWidth="3" fill="none" />
      <text x="220" y="385" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="11" fill="#4A3C24" opacity="0.6" letterSpacing="2">GENERATOR</text>
      <rect x="340" y="230" width="100" height="130" stroke="#616D45" strokeWidth="3" fill="none" rx="4" />
      <rect x="342" y="270" width="96" height="88" fill="#616D45" opacity="0.15" />
      <line x1="350" y1="290" x2="430" y2="290" stroke="#616D45" strokeWidth="1" opacity="0.5" />
      <line x1="350" y1="310" x2="430" y2="310" stroke="#616D45" strokeWidth="1" opacity="0.5" />
      <line x1="350" y1="330" x2="430" y2="330" stroke="#616D45" strokeWidth="1" opacity="0.5" />
      <text x="390" y="385" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="11" fill="#616D45" opacity="0.6" letterSpacing="2">WATER RESERVE</text>
      <path d="M280 310 L340 310" stroke="#B8965A" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
      <path d="M215 190 L225 210 L210 210 L220 230" stroke="#B8965A" strokeWidth="3" fill="none" />
      <line x1="220" y1="230" x2="220" y2="260" stroke="#4A3C24" strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
      <path d="M270 170 L300 150 L330 170 L330 200 L270 200 Z" stroke="#4A3C24" strokeWidth="2" fill="none" opacity="0.5" />
      <line x1="300" y1="200" x2="300" y2="230" stroke="#4A3C24" strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />
    </svg>
  );
}

function IllustrationEnvelope() {
  return (
    <svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <path d="M180 400 L180 260 L300 180 L420 260 L420 400 Z" stroke="#4A3C24" strokeWidth="3.5" fill="none" />
      <path d="M210 390 L210 280 L300 210 L390 280 L390 390 Z" stroke="#4A3C24" strokeWidth="2" fill="#F8F2E4" opacity="0.9" />
      <path d="M300 170 Q200 220 180 340 Q240 420 300 440 Q360 420 420 340 Q400 220 300 170 Z" stroke="#B8965A" strokeWidth="2.5" fill="none" opacity="0.5" />
      <path d="M140 300 Q130 280 140 265 Q135 285 145 290 Q148 275 150 285 Q152 270 145 300 Z" fill="#B8965A" opacity="0.4" />
      <path d="M148 295 L170 290" stroke="#B8965A" strokeWidth="1.5" opacity="0.4" strokeDasharray="3 3" />
      <path d="M460 310 Q470 290 460 275 Q465 295 455 300 Q452 285 450 295 Q448 280 455 310 Z" fill="#B8965A" opacity="0.4" />
      <path d="M452 305 L430 300" stroke="#B8965A" strokeWidth="1.5" opacity="0.4" strokeDasharray="3 3" />
      <path d="M280 320 L295 335 L325 295" stroke="#616D45" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="300" y="480" textAnchor="middle" fontFamily="'Alte Haas Grotesk', sans-serif" fontSize="13" fill="#4A3C24" opacity="0.55" letterSpacing="4">ZERO COMBUSTION</text>
    </svg>
  );
}

const ILLUSTRATIONS = [
  IllustrationDetection,
  IllustrationSteel,
  IllustrationWalls,
  IllustrationWindows,
  IllustrationBackup,
  IllustrationEnvelope,
];

/* ─── Word blur-reveal variants ─── */

const wordVariants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: EASE_OUT_QUINT,
      delay: i * 0.06,
      filter: { duration: 0.9, ease: EASE_OUT_QUINT, delay: i * 0.06 },
    },
  }),
  exit: (i: number) => ({
    opacity: 0,
    y: -10,
    filter: "blur(4px)",
    transition: { delay: i * 0.015, duration: 0.35, ease: EASE_OUT_QUINT },
  }),
};

const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

/* ─── Component ─── */

export default function SystemSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion ? reducedVariants : wordVariants;

  const [activeIndex, setActiveIndex] = useState(0);
  const [timerProgress, setTimerProgress] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [inView, setInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);
  const pausedElapsedRef = useRef(0); // elapsed time when paused

  // Refs for hybrid timer+scroll logic
  const timerPhaseRef = useRef(0);
  const scrollPhaseRef = useRef(0);
  const timerResetRef = useRef(0); // timestamp of last scroll-driven change
  const rafRef = useRef<number>(0);
  const timerStartRef = useRef<number>(0);
  const activeIndexRef = useRef(0);

  activeIndexRef.current = activeIndex;

  /* ── Viewport detection (persistent) ── */
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { setInView(entry.isIntersecting); },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ── Reconcile timer + scroll into activeIndex ── */
  const reconcilePhase = useCallback((scrollDriven?: boolean) => {
    if (scrollDriven) {
      // Scroll always wins — allow both forward and backward
      const next = scrollPhaseRef.current;
      timerPhaseRef.current = next;
      setActiveIndex((prev) => (next !== prev ? next : prev));
    } else {
      const merged = Math.max(timerPhaseRef.current, scrollPhaseRef.current);
      setActiveIndex((prev) => (merged !== prev ? merged : prev));
    }
  }, []);

  /* ── Timer engine — auto-advances + drives progress bar ── */
  const tick = useCallback((now: number) => {
    if (pausedRef.current) {
      return; // Don't advance when paused
    }
    const elapsed = now - timerStartRef.current;
    const p = Math.min(1, elapsed / FEATURE_DURATION);
    setTimerProgress(p);
    if (p >= 1) {
      // Don't advance past last feature
      if (timerPhaseRef.current < FEATURES.length - 1) {
        // Skip if scroll just advanced us
        if (Date.now() - timerResetRef.current < FEATURE_DURATION * 0.8) {
          // Reset timer for current phase without advancing
          timerStartRef.current = performance.now();
          setTimerProgress(0);
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        timerPhaseRef.current = timerPhaseRef.current + 1;
        playTick(3600, 0.03, 0.05);
        reconcilePhase();
      }
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [reconcilePhase]);

  const startTimer = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    timerStartRef.current = performance.now();
    pausedElapsedRef.current = 0;
    setTimerProgress(0);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopTimer = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  const togglePause = useCallback(() => {
    playTick(3200, 0.035, 0.06);
    if (pausedRef.current) {
      // Resume: adjust timerStartRef so elapsed picks up where it left off
      pausedRef.current = false;
      setIsPaused(false);
      timerStartRef.current = performance.now() - pausedElapsedRef.current;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // Pause: save how far we were
      pausedRef.current = true;
      setIsPaused(true);
      pausedElapsedRef.current = performance.now() - timerStartRef.current;
      cancelAnimationFrame(rafRef.current);
    }
  }, [tick]);

  /* ── Start/stop timer based on visibility ── */
  useEffect(() => {
    if (inView && !pausedRef.current) {
      startTimer();
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [inView, startTimer, stopTimer]);

  /* ── Restart timer when activeIndex changes (if in view) ── */
  useEffect(() => {
    if (inView && !pausedRef.current) {
      startTimer();
    }
    return stopTimer;
  }, [activeIndex, inView, startTimer, stopTimer]);

  /* ── Scroll tracking ── */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = getPhase(v);
    if (next !== scrollPhaseRef.current) {
      scrollPhaseRef.current = next;
      timerResetRef.current = Date.now();
      reconcilePhase(true);
    }
  });

  /* ── Hover/click handlers for indicator lines ── */
  const handleIndicatorEnter = useCallback((i: number) => {
    playTick(4200, 0.025, 0.04);
    setHoveredIndex(i);
  }, []);

  const handleIndicatorLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const handleIndicatorClick = useCallback((i: number) => {
    playTick(3800, 0.04, 0.08);
    // Jump both timer and scroll phase refs to clicked index
    timerPhaseRef.current = i;
    scrollPhaseRef.current = i;
    timerResetRef.current = Date.now();
    setActiveIndex(i);
    setHoveredIndex(null);
  }, []);

  const feature = FEATURES[activeIndex];
  const IllustrationComponent = ILLUSTRATIONS[activeIndex];

  return (
    <div id="ambition" ref={containerRef} style={{ height: SCROLL_HEIGHT, position: "relative" }}>
      <section
        ref={stickyRef}
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "#F8F2E4",
          height: "100vh",
          minHeight: isMobile ? "600px" : "700px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Main two-column layout ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            padding: isMobile ? "40px 24px 0" : "0",
            minHeight: 0,
          }}
        >
          {/* ── LEFT COLUMN ── */}
          <div
            style={{
              flex: isMobile ? "none" : "0 0 45%",
              display: "flex",
              flexDirection: "column",
              justifyContent: isMobile ? "center" : "flex-start",
              paddingTop: isMobile ? 0 : "400px",
              paddingLeft: isMobile ? 0 : "60px",
              paddingRight: isMobile ? 0 : "60px",
              position: "relative",
              minHeight: isMobile ? "45%" : undefined,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`feature-${activeIndex}`}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? "16px" : "24px",
                }}
              >
                {/* Feature number + label */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? "10px" : "16px",
                  }}
                >
                  <motion.span
                    custom={0}
                    variants={variants}
                    style={{
                      fontFamily: "'Alte Haas Grotesk', sans-serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#B8965A",
                      letterSpacing: "2px",
                      willChange: "filter, opacity, transform",
                      display: "inline-block",
                    }}
                  >
                    [{feature.number}]
                  </motion.span>
                  <motion.span
                    custom={1}
                    variants={variants}
                    style={{
                      fontFamily: "'Alte Haas Grotesk', sans-serif",
                      fontSize: isMobile ? "12px" : "14px",
                      fontWeight: 500,
                      color: "#4A3C24",
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      opacity: 0.5,
                      willChange: "filter, opacity, transform",
                      display: "inline-block",
                    }}
                  >
                    {feature.label}
                  </motion.span>
                </div>

                {/* Title */}
                <motion.p
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: isMobile ? "0 7px" : "0 10px",
                    margin: 0,
                  }}
                >
                  {feature.title.split(" ").map((word, i) => (
                    <motion.span
                      key={`t-${activeIndex}-${i}`}
                      custom={i + 2}
                      variants={variants}
                      style={{
                        display: "inline-block",
                        fontFamily: "'Playfair Display', serif",
                        fontSize: isMobile ? "32px" : "56px",
                        fontWeight: 400,
                        color: "#4A3C24",
                        lineHeight: "110%",
                        letterSpacing: "-0.02em",
                        willChange: "filter, opacity, transform",
                      }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </motion.p>

                {/* Copy */}
                <motion.p
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0 5px",
                    margin: 0,
                    maxWidth: isMobile ? "100%" : "480px",
                  }}
                >
                  {feature.copy.split(" ").map((word, i) => (
                    <motion.span
                      key={`c-${activeIndex}-${i}`}
                      custom={i + 4}
                      variants={variants}
                      style={{
                        display: "inline-block",
                        fontFamily: "'Alte Haas Grotesk', sans-serif",
                        fontSize: isMobile ? "16px" : "22px",
                        fontWeight: 400,
                        color: "#4A3C24",
                        lineHeight: "160%",
                        willChange: "filter, opacity, transform",
                      }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </motion.p>

                {/* Cost */}
                {feature.cost && (
                  <motion.span
                    custom={18}
                    variants={variants}
                    style={{
                      display: "inline-block",
                      fontFamily: "'Alte Haas Grotesk', sans-serif",
                      fontSize: isMobile ? "16px" : "18px",
                      fontWeight: 700,
                      color: "#B8965A",
                      letterSpacing: "2px",
                      willChange: "filter, opacity, transform",
                    }}
                  >
                    {feature.cost}
                  </motion.span>
                )}

              </motion.div>
            </AnimatePresence>

          </div>

          {/* ── RIGHT COLUMN: Media ── */}
          <div
            style={{
              flex: isMobile ? "1" : "0 0 55%",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              minHeight: isMobile ? "200px" : undefined,
              padding: isMobile ? "0" : "0",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`media-${activeIndex}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: EASE_OUT_QUINT }}
                style={{
                  width: "100%",
                  aspectRatio: isMobile ? "16 / 10" : undefined,
                  maxHeight: isMobile ? "100%" : undefined,
                  height: isMobile ? undefined : "100%",
                  position: "relative",
                  borderRadius: isMobile ? "8px" : "0px",
                  overflow: "hidden",
                }}
              >
                {feature.media ? (
                  feature.media.type === "video" ? (
                    <video
                      key={feature.media.src}
                      src={feature.media.src}
                      autoPlay
                      muted
                      loop
                      playsInline
                      ref={(el) => { if (el) el.play().catch(() => {}); }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: isMobile ? "8px" : "0px",
                      }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={feature.media.src}
                      alt={feature.title}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: isMobile ? "8px" : "0px",
                      }}
                    />
                  )
                ) : (
                  /* Fallback: show illustration large when no media */
                  <div style={{ position: "absolute", inset: "10%", width: "80%", height: "80%" }}>
                    <IllustrationComponent />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Bottom: Indicator lines with timer + cue labels ── */}
        <div
          style={{
            padding: isMobile ? "0 24px 32px" : "0 60px 48px",
            display: "flex",
            flexDirection: "column",
            gap: "0",
            flexShrink: 0,
          }}
        >
          {/* Indicator lines row */}
          <div
            style={{
              display: "flex",
              gap: isMobile ? "4px" : "6px",
              alignItems: "flex-end",
              width: isMobile ? "100%" : "45%",
            }}
          >
            {FEATURES.map((f, i) => {
              const isActive = i === activeIndex;
              const isHovered = i === hoveredIndex;
              const isPast = i < activeIndex;

              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    cursor: "pointer",
                    position: "relative",
                    paddingTop: "28px",
                  }}
                  onMouseEnter={() => handleIndicatorEnter(i)}
                  onMouseLeave={handleIndicatorLeave}
                  onClick={() => handleIndicatorClick(i)}
                >
                  {/* Cue label — shows on hover */}
                  <AnimatePresence>
                    {isHovered && !isMobile && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2, ease: EASE_OUT_QUINT }}
                        style={{
                          fontFamily: "'Alte Haas Grotesk', sans-serif",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: isActive ? "#B8965A" : "#4A3C24",
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                          position: "absolute",
                          top: 0,
                          left: 0,
                          pointerEvents: "none",
                        }}
                      >
                        {f.cue}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Line track */}
                  <div
                    style={{
                      width: "100%",
                      height: isActive || isHovered ? "3px" : "2px",
                      backgroundColor: "rgba(74, 60, 36, 0.1)",
                      borderRadius: "1.5px",
                      overflow: "hidden",
                      position: "relative",
                      transition: "height 0.3s ease",
                    }}
                  >
                    {/* Single fill bar — always mounted, width driven by state */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        borderRadius: "1.5px",
                        width: isActive
                          ? `${timerProgress * 100}%`
                          : isPast
                            ? "100%"
                            : "0%",
                        backgroundColor: isActive
                          ? "#B8965A"
                          : isPast
                            ? "rgba(74, 60, 36, 0.35)"
                            : "transparent",
                        transition: isActive
                          ? "none"
                          : "width 0.4s cubic-bezier(0.23,1,0.32,1), background-color 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Counter + Pause/Play */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: isMobile ? "100%" : "45%",
              marginTop: "12px",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={activeIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: EASE_OUT_QUINT }}
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#4A3C24",
                  opacity: 0.4,
                  whiteSpace: "nowrap",
                }}
              >
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(FEATURES.length).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
            <button
              onClick={togglePause}
              aria-label={isPaused ? "Play" : "Pause"}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4A3C24",
                opacity: 0.4,
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.4"; }}
            >
              {isPaused ? (
                <PlayIcon width={16} height={16} />
              ) : (
                <PauseIcon width={16} height={16} />
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
