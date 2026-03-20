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
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ── Story sentences ──────────────────────────────────────────────────────────
const SENTENCES = [
  "After decades shaping Pacific Palisades, the fires took Ardie\u2019s own home too.",
  "Rebuilding wasn\u2019t about replacing what was lost anymore.",
  "It was about creating something stronger.",
];

const TOTAL_SENTENCES = SENTENCES.length;

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
  const [revealedSentences, setRevealedSentences] = useState(0);

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

  // Map scroll progress to sentence reveals — one sentence per scroll step
  // 3 sentences across the scroll: ~0.15, ~0.45, ~0.75
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v >= 0.70) setRevealedSentences(3);
    else if (v >= 0.40) setRevealedSentences(2);
    else if (v >= 0.15) setRevealedSentences(1);
    else setRevealedSentences(0);
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
      style={{ height: "400vh", position: "relative" }}
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

        {/* ── Sentence-by-sentence scroll reveal (single flowing paragraph) ── */}
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
            {SENTENCES.map((sentence, idx) => {
              const isRevealed = idx < revealedSentences;
              return (
                <span
                  key={idx}
                  style={{
                    opacity: hasEnteredOnce ? (isRevealed ? 1 : 0.12) : 0,
                    filter: hasEnteredOnce ? (isRevealed ? "blur(0px)" : "blur(4px)") : "blur(6px)",
                    transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    willChange: "opacity, filter",
                  }}
                >
                  {sentence}{idx < SENTENCES.length - 1 ? " " : ""}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
