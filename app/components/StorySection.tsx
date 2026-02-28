"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";

// ── Easing ──────────────────────────────────────────────────────────────────
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as [number, number, number, number];

// ── Story lines ─────────────────────────────────────────────────────────────
const LINES = [
  "After decades shaping Pacific Palisades,",
  "the fires took Ardie\u2019s own home too.",
  "Rebuilding wasn\u2019t about replacing what was lost anymore.",
  "It was about creating something stronger.",
];

// Flatten all words with their line index for rendering
const ALL_WORDS: { word: string; line: number; globalIndex: number }[] = [];
LINES.forEach((line, lineIdx) => {
  line.split(" ").forEach((word) => {
    ALL_WORDS.push({ word, line: lineIdx, globalIndex: ALL_WORDS.length });
  });
});

const TOTAL_WORDS = ALL_WORDS.length;

// ── Tree entrance — spring: fast start, slow decelerate ─────────────────────
const TREE_SPRING = {
  type: "spring" as const,
  stiffness: 60,
  damping: 18,
  mass: 0.8,
};

export default function StorySection() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [hasEnteredOnce, setHasEnteredOnce] = useState(false);
  const [highlightedCount, setHighlightedCount] = useState(0);

  // ── Detect first entry for tree reveal ──────────────────────────────
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHasEnteredOnce(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Map scroll progress to number of highlighted words
  // Reserve 0-5% for entry, 5%-85% for word reveal, 85-100% for linger
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const wordProgress = Math.max(0, Math.min(1, (v - 0.05) / 0.8));
    const count = Math.round(wordProgress * TOTAL_WORDS);
    setHighlightedCount(count);
  });

  // Birds: converge toward top-center
  const leftBirdX = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 40] : [0, 200]);
  const leftBirdY = useTransform(scrollYProgress, [0, 1], isMobile ? [0, -50] : [0, -240]);
  const rightBirdX = useTransform(scrollYProgress, [0, 1], isMobile ? [0, -20] : [0, -100]);
  const rightBirdY = useTransform(scrollYProgress, [0, 1], isMobile ? [0, -30] : [0, -120]);

  return (
    <section
      id="its-personal"
      ref={containerRef}
      style={{ height: "650vh", position: "relative" }}
    >
      <div
        ref={stickyRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          backgroundColor: "#F8F2E4",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* ── Left tree ── */}
        <motion.div
          style={{
            position: "absolute",
            bottom: 0,
            left: "-2vw",
            width: isMobile ? "28vw" : "22vw",
            pointerEvents: "none",
          }}
        >
          <motion.img
            src="/left-tree.svg"
            alt=""
            loading="lazy"
            initial={prefersReducedMotion ? false : { x: "-120%" }}
            animate={hasEnteredOnce ? { x: "0%" } : undefined}
            transition={TREE_SPRING}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </motion.div>

        {/* ── Right tree ── */}
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: "-8vw",
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <motion.img
            src="/right-tree.svg"
            alt=""
            loading="lazy"
            initial={prefersReducedMotion ? false : { x: "120%" }}
            animate={hasEnteredOnce ? { x: "0%" } : undefined}
            transition={TREE_SPRING}
            style={{
              height: "100%",
              width: "auto",
              display: "block",
              objectFit: "cover",
              objectPosition: "left top",
            }}
          />
        </motion.div>

        {/* ── Left bird ── */}
        <motion.img
          src="/left-bird.svg"
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            top: isMobile ? "18%" : "30%",
            left: isMobile ? "10%" : "22%",
            width: isMobile ? "50px" : "140px",
            height: "auto",
            x: prefersReducedMotion ? 0 : leftBirdX,
            y: prefersReducedMotion ? 0 : leftBirdY,
            pointerEvents: "none",
            opacity: hasEnteredOnce ? 1 : 0,
            transition: "opacity 1s ease-out 0.6s",
          }}
        />

        {/* ── Right bird ── */}
        <motion.img
          src="/right-bird.svg"
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            top: isMobile ? "15%" : "24%",
            right: isMobile ? "12%" : "30%",
            width: isMobile ? "40px" : "110px",
            height: "auto",
            x: prefersReducedMotion ? 0 : rightBirdX,
            y: prefersReducedMotion ? 0 : rightBirdY,
            pointerEvents: "none",
            opacity: hasEnteredOnce ? 1 : 0,
            transition: "opacity 1s ease-out 0.9s",
          }}
        />

        {/* ── All text as single flowing paragraph, scroll-driven word highlight ── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: isMobile ? "88vw" : "1050px",
            textAlign: "center",
            padding: isMobile ? "0 16px" : "0 24px",
          }}
        >
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "clamp(22px, 3.5vw, 40px)" : "48px",
              fontWeight: 400,
              color: "#616D45",
              lineHeight: isMobile ? "140%" : "145%",
              letterSpacing: "-0.02em",
              margin: 0,
              textAlign: "center",
            }}
          >
            {ALL_WORDS.map((w, idx) => {
              const isHighlighted = idx < highlightedCount;
              return (
                <span
                  key={idx}
                  style={{
                    opacity: hasEnteredOnce ? (isHighlighted ? 1 : 0.18) : 0,
                    transition: "opacity 0.45s cubic-bezier(0.23, 1, 0.32, 1)",
                    willChange: "opacity",
                  }}
                >
                  {w.word}{idx < ALL_WORDS.length - 1 ? " " : ""}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
