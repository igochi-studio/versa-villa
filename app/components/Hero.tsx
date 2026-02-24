"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const TREE_SPRING = {
  type: "spring" as const,
  stiffness: 140,
  damping: 100,
  mass: 2,
  delay: 2.7,
};

const CHAR_SPRING = {
  type: "spring" as const,
  stiffness: 140,
  damping: 100,
  mass: 2,
};

const LINES = ["Wildfires swept through", "Los Angeles,"];
const CHAR_STAGGER = 0.022;
const TEXT_START_DELAY = 2.7;

function CharReveal({ line, charOffset }: { line: string; charOffset: number }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <span aria-label={line}>
      {line.split("").map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          style={{ display: "inline-block" }}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            ...CHAR_SPRING,
            delay: TEXT_START_DELAY + (charOffset + i) * CHAR_STAGGER,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  // Background color transition: start with LoadingScreen's green, fade to cream after loading completes
  const [bgColor, setBgColor] = useState("#414833"); // Matches LoadingScreen green
  useEffect(() => {
    // Start transition exactly when LoadingScreen bgExit begins (t=1860ms),
    // so the Hero background fades to cream in sync with the curtain sliding up.
    const timer = setTimeout(() => setBgColor("#F7F5F0"), 1860);
    return () => clearTimeout(timer);
  }, []);

  // Measure viewport height once on mount so we can define the bird parallax range in pixels.
  // Birds animate from scrollY=0 to scrollY=viewportH (one full viewport of scroll).
  // Using global scrollY bypasses the sticky-element tracking bug in Framer Motion:
  // useScroll({ target: sticky-element }) stalls because the element never moves in the viewport.
  const [viewportH, setViewportH] = useState(800);
  useEffect(() => {
    const update = () => setViewportH(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { scrollY } = useScroll();

  // Parallax depth from pixel distance: left bird travels further = feels faster
  const leftBirdX  = useTransform(scrollY, [0, viewportH], [0,  410]);
  const leftBirdY  = useTransform(scrollY, [0, viewportH], [0, -100]);
  const rightBirdX = useTransform(scrollY, [0, viewportH], [0, -205]);
  const rightBirdY = useTransform(scrollY, [0, viewportH], [0, -215]);

  return (
    <motion.section
      className="relative overflow-hidden"
      style={{ height: "100vh", position: "sticky", top: 0, zIndex: 1 }}
      animate={{ backgroundColor: bgColor }}
      transition={{ duration: 0.72, ease: [0.86, 0, 0.07, 1] }}
    >

        {/* Versa Villa logo — top center */}
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{ top: "28px", transform: "translateX(-50%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/versa-villa-logo-dark.svg"
            alt="Versa Villa by Arya"
            style={{ width: "200px", height: "auto", display: "block" }}
          />
        </div>

        {/* Left tree — bottom-left, raised 4vh from bottom */}
        <motion.div
          className="absolute"
          style={{ bottom: "8vh", left: "-10px", willChange: "transform" }}
          initial={shouldReduceMotion ? false : { x: "-110%" }}
          animate={{ x: 0 }}
          transition={TREE_SPRING}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/left-tree.svg"
            alt=""
            style={{ height: "44vh", width: "auto", display: "block" }}
          />
        </motion.div>

        {/* Right tree — lowered to show top edge clearly */}
        <motion.div
          className="absolute"
          style={{ top: "30px", right: "-80px", willChange: "transform" }}
          initial={shouldReduceMotion ? false : { x: "110%" }}
          animate={{ x: 0 }}
          transition={TREE_SPRING}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/right-tree.svg"
            alt=""
            style={{ height: "94vh", width: "auto", display: "block" }}
          />
        </motion.div>

        {/* Left bird — parallax toward top-center */}
        <motion.div
          className="absolute"
          style={{
            top: "27%",
            left: "14%",
            x: leftBirdX,
            y: leftBirdY,
            willChange: "transform",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.7, duration: 0.9, ease: [0.165, 0.84, 0.44, 1] }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/left-bird.svg" alt="" style={{ width: "120px", height: "auto" }} />
        </motion.div>

        {/* Right bird — parallax toward top-center */}
        <motion.div
          className="absolute"
          style={{
            top: "37%",
            right: "22%",
            x: rightBirdX,
            y: rightBirdY,
            willChange: "transform",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 0.9, ease: [0.165, 0.84, 0.44, 1] }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/right-bird.svg" alt="" style={{ width: "108px", height: "auto" }} />
        </motion.div>

        {/* Hero text — true center */}
        <div
          className="absolute text-center pointer-events-none select-none"
          style={{
            top: "400px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "640px",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "64px",
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#4A3C24",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              fontSynthesis: "none",
            }}
          >
            {LINES.map((line, lineIndex) => {
              const charOffset = LINES.slice(0, lineIndex).reduce(
                (sum, l) => sum + l.length,
                0
              );
              return (
                <span key={lineIndex} style={{ display: "block", whiteSpace: "nowrap" }}>
                  <CharReveal line={line} charOffset={charOffset} />
                </span>
              );
            })}
          </h1>
        </div>

    </motion.section>
  );
}
