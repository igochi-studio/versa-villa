"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";

// ── Easing ──────────────────────────────────────────────────────────────────
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as [number, number, number, number];

// ── Story phases ────────────────────────────────────────────────────────────
const PHRASES = [
  "After decades shaping Pacific Palisades,",
  "the fires took Ardie\u2019s own home too.",
  "Rebuilding wasn\u2019t about replacing what was lost anymore.",
  "It was about creating something stronger.",
];

const THRESHOLDS = [0, 0.15, 0.38, 0.62];

function getPhase(progress: number): number {
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (progress >= THRESHOLDS[i]) return i;
  }
  return 0;
}

// ── Word animation variants (matches Hero blur reveal) ──────────────────────
// custom value: [wordIndex, isFirstReveal]
const wordVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(6px)",
  },
  visible: ([i, isFirst]: [number, boolean]) => {
    // First reveal: add 0.5s base delay so trees enter first
    const base = isFirst ? 0.5 : 0;
    return {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.9,
        ease: EASE_OUT_QUINT,
        delay: base + i * 0.12,
        filter: {
          duration: 1.1,
          ease: EASE_OUT_QUINT,
          delay: base + i * 0.12,
        },
      },
    };
  },
  exit: ([i]: [number, boolean]) => ({
    opacity: 0,
    y: -12,
    filter: "blur(6px)",
    transition: {
      delay: i * 0.03,
      duration: 0.5,
      ease: EASE_OUT_QUINT,
    },
  }),
};

const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

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
  const [activePhase, setActivePhase] = useState(0);
  const [inView, setInView] = useState(false);
  const hasRevealedOnce = useRef(false);

  // ── Detect when section enters viewport ───────────────────────────────
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
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

  // ── Track active phase ──────────────────────────────────────────────────
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = getPhase(v);
    setActivePhase((prev) => (prev !== next ? next : prev));
  });

  // Birds: converge toward top-center. Left bird moves MORE.
  const leftBirdX = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0, 100] : [0, 200]
  );
  const leftBirdY = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0, -120] : [0, -240]
  );
  const rightBirdX = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0, -50] : [0, -100]
  );
  const rightBirdY = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0, -60] : [0, -120]
  );

  const words = PHRASES[activePhase].split(" ");
  const variants = prefersReducedMotion ? reducedMotionVariants : wordVariants;
  const isFirstReveal = !hasRevealedOnce.current;
  if (inView) hasRevealedOnce.current = true;

  return (
    <section
      id="its-personal"
      ref={containerRef}
      style={{ height: "500vh", position: "relative" }}
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
        {/* ── Left tree — bottom-anchored, entrance from left ── */}
        <motion.div
          style={{
            position: "absolute",
            bottom: 0,
            left: "-2vw",
            width: isMobile ? "40vw" : "30vw",
            pointerEvents: "none",
          }}
        >
          <motion.img
            src="/left-tree.svg"
            alt=""
            loading="lazy"
            initial={prefersReducedMotion ? false : { x: "-120%" }}
            animate={inView ? { x: "0%" } : undefined}
            transition={TREE_SPRING}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </motion.div>

        {/* ── Right tree — clipped so it doesn't overlap header/nav zone ── */}
        <motion.div
          style={{
            position: "absolute",
            top: "15vh",
            bottom: 0,
            right: 0,
            display: "flex",
            alignItems: "stretch",
            pointerEvents: "none",
          }}
        >
          <motion.img
            src="/right-tree.svg"
            alt=""
            loading="lazy"
            initial={prefersReducedMotion ? false : { x: "120%" }}
            animate={inView ? { x: "0%" } : undefined}
            transition={TREE_SPRING}
            style={{
              height: "100%",
              width: "auto",
              display: "block",
            }}
          />
        </motion.div>

        {/* ── Left bird — starts left of center, moves MORE toward center-top ── */}
        <motion.img
          src="/left-bird.svg"
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            top: "30%",
            left: "22%",
            width: isMobile ? "80px" : "140px",
            height: "auto",
            x: prefersReducedMotion ? 0 : leftBirdX,
            y: prefersReducedMotion ? 0 : leftBirdY,
            pointerEvents: "none",
            opacity: inView ? 1 : 0,
            transition: "opacity 1s ease-out 0.6s",
          }}
        />

        {/* ── Right bird — near right tree, moves less ── */}
        <motion.img
          src="/right-bird.svg"
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            top: "24%",
            right: "30%",
            width: isMobile ? "65px" : "110px",
            height: "auto",
            x: prefersReducedMotion ? 0 : rightBirdX,
            y: prefersReducedMotion ? 0 : rightBirdY,
            pointerEvents: "none",
            opacity: inView ? 1 : 0,
            transition: "opacity 1s ease-out 0.9s",
          }}
        />

        {/* ── Centered text — max 2 lines per phrase ── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: isMobile ? "85vw" : "580px",
            textAlign: "center",
            padding: "0 20px",
          }}
        >
          <AnimatePresence mode="wait">
            {inView && (
              <motion.p
                key={activePhase}
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isMobile ? "28px" : "48px",
                  fontWeight: 400,
                  color: "#616D45",
                  lineHeight: "120%",
                  letterSpacing: "-0.02em",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: isMobile ? "0 8px" : "0 12px",
                }}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {words.map((word, i) => (
                  <motion.span
                    key={`${activePhase}-${i}`}
                    custom={[i, isFirstReveal] as [number, boolean]}
                    variants={variants}
                    style={{
                      display: "inline-block",
                      willChange: "filter, opacity, transform",
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
