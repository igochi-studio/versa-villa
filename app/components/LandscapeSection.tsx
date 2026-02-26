"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useInView } from "motion/react";

const TREE_SPRING = {
  type: "spring" as const,
  stiffness: 140,
  damping: 100,
  mass: 2,
};

const CHAR_SPRING = {
  type: "spring" as const,
  stiffness: 140,
  damping: 100,
  mass: 2,
};

const LINES = ["Come celebrate with our", "family and join our story."];
const CHAR_STAGGER = 0.022;
const ANIM_DELAY = 0.3;

function CharReveal({
  line,
  charOffset,
  inView,
}: {
  line: string;
  charOffset: number;
  inView: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <span aria-label={line}>
      {line.split("").map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          style={{ display: "inline-block" }}
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, y: 10, filter: "blur(12px)" }
          }
          animate={
            inView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : undefined
          }
          transition={{
            ...CHAR_SPRING,
            delay: ANIM_DELAY + (charOffset + i) * CHAR_STAGGER,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

export default function LandscapeSection() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#F8F2E4",
      }}
    >
      {/* Logo — top center, fades in + drops down like Hero */}
      <div
        style={{
          position: "absolute",
          top: "28px",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -30 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ ...TREE_SPRING, delay: 0.1 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/versa-villa-logo-dark.svg"
            alt="Versa Villa by Arya"
            style={{ width: "200px", height: "auto", display: "block" }}
          />
        </motion.div>
      </div>

      {/* Center text — char-by-char reveal matching Hero */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 2,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "56px",
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "#4A3C24",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
        >
          {LINES.map((line, lineIndex) => {
            const charOffset = LINES.slice(0, lineIndex).reduce(
              (sum, l) => sum + l.length,
              0
            );
            return (
              <span
                key={lineIndex}
                style={{ display: "block", whiteSpace: "nowrap" }}
              >
                <CharReveal
                  line={line}
                  charOffset={charOffset}
                  inView={inView}
                />
              </span>
            );
          })}
        </h2>
      </div>

      {/* Landscape SVG — slides up from bottom like Hero trees */}
      <motion.div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          zIndex: 1,
        }}
        initial={shouldReduceMotion ? false : { y: "40%" }}
        animate={inView ? { y: 0 } : undefined}
        transition={{ ...TREE_SPRING, delay: ANIM_DELAY }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landscape.svg"
          alt="Pacific Palisades landscape illustration"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </motion.div>
    </section>
  );
}
