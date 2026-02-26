"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";

/* ─────────────────────────────────────────────────────────────────────────────
 * COSMOS-STYLE DESTROYING SECTION
 *
 * Phase 1 (time-based, sticky):
 *   Text reveals → small gem-like images glimmer in batches across screen.
 *   Images cycle in/out — constant sparkle. Text stops at "entire neighborhoods."
 *
 * Phase 2 (scroll-driven):
 *   palisades-before image expands from bottom-center to fill viewport.
 *   Once full, dispatches event for burn transition to auto-trigger.
 * ─────────────────────────────────────────────────────────────────────────── */

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

// ── Source images (reused across many slots) ─────────────────────────────────
const SOURCES = [
  "ruins-1", "ruins-2", "ruins-3", "ruins-4",
  "families-1", "families-2", "families-3",
  "streets-1", "streets-2", "streets-3", "streets-4",
  "blaze-1", "blaze-2", "blaze-3",
  "palisades-before",
];

// ── Slot positions — ~28 small gems scattered, avoiding center text area ─────
interface Slot {
  id: number;
  left: string;
  top: string;
  width: string;
  height: string;
  depth: number; // cursor parallax
  dx: number;
  dy: number;
  dur: number;
  phase: number;
}

const DESKTOP_SLOTS: Slot[] = [
  // Row 1 — top edge
  { id: 0,  left: "3vw",  top: "4vh",  width: "5vw",  height: "6.5vh", depth: 1.0, dx: 2, dy: -1.5, dur: 8, phase: 0 },
  { id: 1,  left: "11vw", top: "7vh",  width: "4.5vw",height: "5.5vh", depth: 0.7, dx: -1.5, dy: 2, dur: 9, phase: 1.5 },
  { id: 2,  left: "20vw", top: "3vh",  width: "5.5vw",height: "5vh",   depth: 1.2, dx: 1.5, dy: 1, dur: 7.5, phase: 0.5 },
  { id: 3,  left: "32vw", top: "5vh",  width: "4.5vw",height: "6vh",   depth: 0.8, dx: -1, dy: -1.5, dur: 8.5, phase: 2.5 },
  { id: 4,  left: "55vw", top: "3vh",  width: "5vw",  height: "5.5vh", depth: 0.6, dx: 2, dy: 1.5, dur: 7, phase: 0.8 },
  { id: 5,  left: "66vw", top: "6vh",  width: "4.5vw",height: "6vh",   depth: 1.1, dx: -2, dy: -1, dur: 9.5, phase: 1.2 },
  { id: 6,  left: "78vw", top: "4vh",  width: "5vw",  height: "5.5vh", depth: 0.9, dx: 1.5, dy: -2, dur: 8, phase: 2 },
  { id: 7,  left: "90vw", top: "7vh",  width: "4.5vw",height: "5vh",   depth: 1.3, dx: -1.5, dy: 1.5, dur: 7.5, phase: 0.3 },
  // Row 2 — upper
  { id: 8,  left: "5vw",  top: "18vh", width: "5.5vw",height: "7vh",   depth: 1.4, dx: 2, dy: 2, dur: 9, phase: 1 },
  { id: 9,  left: "17vw", top: "20vh", width: "4.5vw",height: "5.5vh", depth: 0.8, dx: -1, dy: -2, dur: 7, phase: 2.2 },
  { id: 10, left: "58vw", top: "17vh", width: "5vw",  height: "6vh",   depth: 0.7, dx: 1.5, dy: 1, dur: 8.5, phase: 0.7 },
  { id: 11, left: "72vw", top: "19vh", width: "4.5vw",height: "5.5vh", depth: 1.2, dx: -2, dy: -1.5, dur: 7.5, phase: 1.8 },
  { id: 12, left: "88vw", top: "18vh", width: "5vw",  height: "6.5vh", depth: 0.6, dx: 1, dy: 2, dur: 9, phase: 2.5 },
  // Row 3 — mid (sides only, center clear for text)
  { id: 13, left: "2vw",  top: "36vh", width: "5vw",  height: "7vh",   depth: 1.5, dx: 2, dy: -2, dur: 7.5, phase: 0.3 },
  { id: 14, left: "14vw", top: "40vh", width: "4.5vw",height: "5.5vh", depth: 0.9, dx: -1.5, dy: 1.5, dur: 8, phase: 1.5 },
  { id: 15, left: "82vw", top: "37vh", width: "5vw",  height: "6vh",   depth: 1.0, dx: -1, dy: -2, dur: 9, phase: 2.8 },
  { id: 16, left: "93vw", top: "42vh", width: "4.5vw",height: "7vh",   depth: 0.5, dx: 2, dy: 1.5, dur: 7, phase: 0.8 },
  // Row 4 — lower
  { id: 17, left: "4vw",  top: "58vh", width: "5.5vw",height: "6.5vh", depth: 1.3, dx: -2, dy: -1.5, dur: 8.5, phase: 1 },
  { id: 18, left: "16vw", top: "55vh", width: "4.5vw",height: "5.5vh", depth: 0.7, dx: 1.5, dy: 2, dur: 7, phase: 2.2 },
  { id: 19, left: "27vw", top: "58vh", width: "5vw",  height: "6vh",   depth: 1.1, dx: -1, dy: -2, dur: 9.5, phase: 0.5 },
  { id: 20, left: "60vw", top: "57vh", width: "4.5vw",height: "5.5vh", depth: 0.8, dx: 2, dy: 1.5, dur: 8, phase: 1.7 },
  { id: 21, left: "74vw", top: "55vh", width: "5vw",  height: "6.5vh", depth: 1.2, dx: -1.5, dy: -1, dur: 7.5, phase: 2 },
  { id: 22, left: "88vw", top: "58vh", width: "5.5vw",height: "6vh",   depth: 0.6, dx: 1, dy: 2, dur: 9, phase: 0.3 },
  // Row 5 — bottom
  { id: 23, left: "2vw",  top: "74vh", width: "5vw",  height: "6vh",   depth: 1.4, dx: 2, dy: -2, dur: 7, phase: 1.5 },
  { id: 24, left: "14vw", top: "76vh", width: "4.5vw",height: "5.5vh", depth: 0.8, dx: -1.5, dy: 1, dur: 8.5, phase: 2.5 },
  { id: 25, left: "26vw", top: "73vh", width: "5.5vw",height: "6vh",   depth: 1.0, dx: 1, dy: -1.5, dur: 9, phase: 0.7 },
  // Palisades slot — bottom center (will expand)
  { id: 26, left: "44vw", top: "72vh", width: "6vw",  height: "8vh",   depth: 0.3, dx: -0.5, dy: -0.5, dur: 10, phase: 0 },
  { id: 27, left: "64vw", top: "75vh", width: "5vw",  height: "6vh",   depth: 1.1, dx: -2, dy: 1.5, dur: 7.5, phase: 1.2 },
  { id: 28, left: "78vw", top: "73vh", width: "4.5vw",height: "5.5vh", depth: 0.9, dx: 1.5, dy: -1, dur: 8, phase: 2 },
  { id: 29, left: "92vw", top: "76vh", width: "5vw",  height: "6.5vh", depth: 0.5, dx: -1, dy: 2, dur: 9.5, phase: 0.5 },
];

const MOBILE_SLOTS: Slot[] = [
  { id: 0,  left: "3vw",  top: "4vh",  width: "14vw", height: "8vh",  depth: 1.0, dx: 1.5, dy: -1, dur: 8, phase: 0 },
  { id: 1,  left: "22vw", top: "3vh",  width: "13vw", height: "7vh",  depth: 0.7, dx: -1, dy: 1.5, dur: 9, phase: 1.5 },
  { id: 2,  left: "60vw", top: "5vh",  width: "14vw", height: "7.5vh",depth: 1.2, dx: 1, dy: 1, dur: 7.5, phase: 0.5 },
  { id: 3,  left: "80vw", top: "3vh",  width: "12vw", height: "8vh",  depth: 0.8, dx: -1.5, dy: -1, dur: 8.5, phase: 2.5 },
  { id: 4,  left: "5vw",  top: "17vh", width: "13vw", height: "8vh",  depth: 1.4, dx: 1.5, dy: 1.5, dur: 9, phase: 1 },
  { id: 5,  left: "65vw", top: "18vh", width: "14vw", height: "7vh",  depth: 0.6, dx: -1, dy: -1.5, dur: 7, phase: 2.2 },
  { id: 6,  left: "84vw", top: "17vh", width: "12vw", height: "7.5vh",depth: 1.1, dx: 1, dy: 1, dur: 8.5, phase: 0.7 },
  { id: 7,  left: "2vw",  top: "36vh", width: "14vw", height: "9vh",  depth: 1.5, dx: 1.5, dy: -1.5, dur: 7.5, phase: 0.3 },
  { id: 8,  left: "80vw", top: "38vh", width: "15vw", height: "8vh",  depth: 0.5, dx: -1, dy: 1.5, dur: 9, phase: 2.8 },
  { id: 9,  left: "3vw",  top: "58vh", width: "13vw", height: "8vh",  depth: 1.3, dx: -1.5, dy: -1, dur: 8.5, phase: 1 },
  { id: 10, left: "20vw", top: "56vh", width: "14vw", height: "7vh",  depth: 0.7, dx: 1, dy: 1.5, dur: 7, phase: 2.2 },
  { id: 11, left: "70vw", top: "57vh", width: "13vw", height: "7.5vh",depth: 1.2, dx: -1.5, dy: -1, dur: 7.5, phase: 0.5 },
  { id: 12, left: "3vw",  top: "74vh", width: "14vw", height: "7vh",  depth: 0.8, dx: 1, dy: -1, dur: 8, phase: 1.5 },
  // Palisades
  { id: 13, left: "35vw", top: "72vh", width: "16vw", height: "10vh", depth: 0.3, dx: -0.5, dy: -0.5, dur: 10, phase: 0 },
  { id: 14, left: "72vw", top: "75vh", width: "14vw", height: "7vh",  depth: 1.1, dx: -1.5, dy: 1, dur: 7.5, phase: 1.2 },
];

const PALISADES_SLOT_DESKTOP = 26;
const PALISADES_SLOT_MOBILE = 13;

const SUBTITLES = [
  "homes built over decades,",
  "stability,",
  "sense of belonging,",
  "family memories,",
  "entire neighborhoods.",
];

const GLIMMER_CYCLE_MS = 2500; // ms between glimmer waves
const SLOTS_PER_WAVE = 5;      // how many slots activate per wave
const SLOT_VISIBLE_WAVES = 3;  // how many waves a slot stays visible before fading
const SUBTITLE_INTERVAL = 3000;
const SUBTITLE_START_DELAY = 1200;
const TITLE_REVEAL_DELAY = 400;
const IMAGES_START_DELAY = 2000; // images start after text

// ── Seeded random for deterministic image assignment ─────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Assign images to slots ensuring no adjacent slots have the same image
function assignImages(slotCount: number, wave: number): string[] {
  const rand = seededRandom(wave * 1000 + 42);
  const result: string[] = [];
  // Filter out palisades-before from the general pool
  const pool = SOURCES.filter((s) => s !== "palisades-before");
  for (let i = 0; i < slotCount; i++) {
    let attempts = 0;
    let pick: string;
    do {
      pick = pool[Math.floor(rand() * pool.length)];
      attempts++;
    } while (
      attempts < 20 &&
      ((i > 0 && result[i - 1] === pick) || (i > 1 && result[i - 2] === pick))
    );
    result.push(pick);
  }
  return result;
}

// ── Cursor parallax ──────────────────────────────────────────────────────────
function useCursorParallax() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5,
      };
    };
    const animate = () => {
      const t = mouseRef.current;
      const c = currentRef.current;
      c.x += (t.x - c.x) * 0.06;
      c.y += (t.y - c.y) * 0.06;
      setOffset({ x: c.x, y: c.y });
      rafRef.current = requestAnimationFrame(animate);
    };
    window.addEventListener("mousemove", handleMove);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return offset;
}

export default function DestroyingCosmos() {
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [textDone, setTextDone] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [wave, setWave] = useState(-1); // current glimmer wave (-1 = not started)
  const [expandTriggered, setExpandTriggered] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const cursorOffset = useCursorParallax();

  const slots = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;
  const palisadesSlotId = isMobile ? PALISADES_SLOT_MOBILE : PALISADES_SLOT_DESKTOP;

  // Track which slots are visible and their assigned images
  // Each wave activates SLOTS_PER_WAVE slots; they stay for SLOT_VISIBLE_WAVES waves
  const { visibleSlots, slotImages } = useMemo(() => {
    if (wave < 0) return { visibleSlots: new Set<number>(), slotImages: new Map<number, string>() };

    const visible = new Set<number>();
    const images = new Map<number, string>();
    const totalSlots = slots.length;

    // For each recent wave, activate a group of slots
    for (let w = Math.max(0, wave - SLOT_VISIBLE_WAVES + 1); w <= wave; w++) {
      const assignment = assignImages(totalSlots, w);
      // Each wave activates a different set of slots (round-robin through all slots)
      for (let i = 0; i < SLOTS_PER_WAVE; i++) {
        const slotIdx = (w * SLOTS_PER_WAVE + i) % totalSlots;
        visible.add(slotIdx);
        images.set(slotIdx, assignment[slotIdx]);
      }
    }

    // Always show palisades-before at its designated slot once images have started
    if (wave >= 1) {
      visible.add(palisadesSlotId);
      images.set(palisadesSlotId, "palisades-before");
    }

    return { visibleSlots: visible, slotImages: images };
  }, [wave, slots.length, palisadesSlotId]);

  // IntersectionObserver
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Title reveal
  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(() => setShowTitle(true), TITLE_REVEAL_DELAY);
    return () => clearTimeout(t);
  }, [isVisible]);

  // Subtitle reveal + cycling (STOPS at last subtitle)
  useEffect(() => {
    if (!isVisible) return;
    let count = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    const showTimer = setTimeout(() => setShowSubtitle(true), SUBTITLE_START_DELAY);
    const cycleTimer = setTimeout(() => {
      interval = setInterval(() => {
        count++;
        if (count >= SUBTITLES.length - 1) {
          // Stop at last subtitle
          setSubtitleIndex(SUBTITLES.length - 1);
          setTextDone(true);
          if (interval) clearInterval(interval);
        } else {
          setSubtitleIndex(count);
        }
      }, SUBTITLE_INTERVAL);
    }, SUBTITLE_START_DELAY + SUBTITLE_INTERVAL);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(cycleTimer);
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  // Glimmer waves — start after text begins, continue indefinitely
  useEffect(() => {
    if (!isVisible) return;
    const startTimer = setTimeout(() => {
      setWave(0);
      const interval = setInterval(() => {
        setWave((prev) => prev + 1);
      }, GLIMMER_CYCLE_MS);
      return () => clearInterval(interval);
    }, IMAGES_START_DELAY);

    let interval: ReturnType<typeof setInterval> | null = null;
    const t = setTimeout(() => {
      setWave(0);
      interval = setInterval(() => {
        setWave((prev) => prev + 1);
      }, GLIMMER_CYCLE_MS);
    }, IMAGES_START_DELAY);
    clearTimeout(startTimer);

    return () => {
      clearTimeout(t);
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  // ── Scroll-driven palisades expand (Phase 2) ──────────────────────────────
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });

  // Map scroll progress: 0-0.5 = pinned phase, 0.5-1.0 = expand phase
  const expandProgress = useTransform(scrollYProgress, [0.5, 0.95], [0, 1], {
    clamp: true,
  });
  const otherOpacity = useTransform(scrollYProgress, [0.5, 0.65], [1, 0], {
    clamp: true,
  });
  const textOpacity = useTransform(scrollYProgress, [0.5, 0.6], [1, 0], {
    clamp: true,
  });

  // Detect when expand is complete — dispatch event for burn transition
  useMotionValueEvent(expandProgress, "change", (v) => {
    if (v >= 0.98 && !expandTriggered) {
      setExpandTriggered(true);
      window.dispatchEvent(
        new CustomEvent("cosmos-expand-complete")
      );
    }
  });

  // Palisades slot position for expand animation
  const pSlot = slots[palisadesSlotId];

  return (
    <div ref={outerRef} style={{ height: "400vh" }}>
      <div
        ref={stickyRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          backgroundColor: "#F8F2E4",
        }}
      >
        {/* Float keyframes */}
        <style>{`
          @keyframes cosmos-float {
            0%, 100% { transform: translate(var(--cosmos-cx), var(--cosmos-cy)); }
            50% { transform: translate(calc(var(--cosmos-cx) + var(--cosmos-dx)), calc(var(--cosmos-cy) + var(--cosmos-dy))); }
          }
        `}</style>

        {/* Gem images — glimmer in/out */}
        <motion.div style={{ opacity: otherOpacity }}>
          {slots.map((slot) => {
            if (slot.id === palisadesSlotId) return null; // rendered separately
            const isActive = visibleSlots.has(slot.id);
            const src = slotImages.get(slot.id);
            const px = cursorOffset.x * slot.depth * 45;
            const py = cursorOffset.y * slot.depth * 45;

            return (
              <AnimatePresence key={slot.id}>
                {isActive && src && (
                  <motion.div
                    key={`${slot.id}-${src}`}
                    style={{
                      position: "absolute",
                      left: slot.left,
                      top: slot.top,
                      width: slot.width,
                      height: slot.height,
                      willChange: "filter, opacity, transform",
                      ["--cosmos-dx" as string]: `${slot.dx}px`,
                      ["--cosmos-dy" as string]: `${slot.dy}px`,
                      ["--cosmos-cx" as string]: `${px}px`,
                      ["--cosmos-cy" as string]: `${py}px`,
                      animation: `cosmos-float ${slot.dur}s ease-in-out infinite`,
                      animationDelay: `-${slot.phase}s`,
                    }}
                    initial={{ opacity: 0, filter: "blur(10px)", scale: 0.92 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(8px)", scale: 0.95 }}
                    transition={{
                      duration: 1.6,
                      ease: EASE_OUT_QUINT,
                      filter: { duration: 2.0, ease: EASE_OUT_QUINT },
                      scale: { duration: 2.2, ease: EASE_OUT_QUINT },
                    }}
                  >
                    <img
                      src={`/${src}.webp`}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 0,
                        display: "block",
                      }}
                      loading="eager"
                      draggable={false}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </motion.div>

        {/* Palisades-before — expands on scroll to fill viewport */}
        <motion.div
          style={{
            position: "absolute",
            left: pSlot.left,
            top: pSlot.top,
            width: pSlot.width,
            height: pSlot.height,
            zIndex: 20,
            willChange: "transform, filter, opacity",
            // Expand: scale and translate to fill viewport
            // We use expandProgress to interpolate from slot position to full screen
          }}
        >
          <motion.div
            style={{
              width: "100%",
              height: "100%",
              // Expand transforms driven by scroll
              scale: useTransform(expandProgress, [0, 1], [1, Math.max(100 / 6, 100 / 8)]),
              originX: 0.5,
              originY: 0.5,
            }}
          >
            {wave >= 1 && (
              <motion.img
                src="/palisades-before.webp"
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 0,
                  display: "block",
                }}
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.6, ease: EASE_OUT_QUINT }}
                loading="eager"
                draggable={false}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Center text */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 15,
            pointerEvents: "none",
            opacity: textOpacity,
          }}
        >
          <motion.h2
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: isMobile ? "40px" : "56px",
              fontWeight: 400,
              lineHeight: "110%",
              letterSpacing: "-0.02em",
              color: "#616D45",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              margin: 0,
              textAlign: "center",
            }}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={
              showTitle
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : undefined
            }
            transition={{
              duration: 0.9,
              ease: EASE_OUT_QUINT,
              filter: { duration: 1.1, ease: EASE_OUT_QUINT },
            }}
          >
            Destroying
          </motion.h2>

          <div style={{ minHeight: isMobile ? "52px" : "66px", marginTop: "2px" }}>
            <AnimatePresence mode="wait">
              {showSubtitle && (
                <motion.p
                  key={subtitleIndex}
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: isMobile ? "36px" : "48px",
                    fontWeight: 400,
                    lineHeight: "110%",
                    letterSpacing: "-0.02em",
                    color: "#616D45",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                    margin: 0,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                  initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={{
                    duration: 0.9,
                    ease: EASE_OUT_QUINT,
                    filter: { duration: 1.1, ease: EASE_OUT_QUINT },
                  }}
                >
                  {SUBTITLES[subtitleIndex]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
