"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
} from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const TREE_SPRING = {
  type: "spring" as const,
  stiffness: 60,
  damping: 40,
  mass: 2.5,
};

const REVEAL_SPRING = {
  type: "spring" as const,
  stiffness: 50,
  damping: 22,
  mass: 1.8,
};

// ── Animated counter hook ───────────────────────────────────────────────────
function useCountUp(end: number, inView: boolean, duration = 2000, delay = 0) {
  const [value, setValue] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion) {
      setValue(end);
      return;
    }

    let startTime: number | null = null;
    let rafId: number;

    const delayTimer = setTimeout(() => {
      const tick = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * end));
        if (progress < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      cancelAnimationFrame(rafId);
    };
  }, [inView, end, duration, delay, prefersReducedMotion]);

  return value;
}

export default function ContextV2() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const inView = useInView(textRef, { once: true, margin: "-80px" });

  // Scroll-driven parallax for birds
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const leftBirdY = useSpring(
    useTransform(scrollYProgress, [0, 1], [80, -80]),
    { stiffness: 25, damping: 12, mass: 2.5 }
  );
  const leftBirdX = useSpring(
    useTransform(scrollYProgress, [0, 1], [-25, 40]),
    { stiffness: 25, damping: 12, mass: 2.5 }
  );
  const rightBirdY = useSpring(
    useTransform(scrollYProgress, [0, 1], [70, -90]),
    { stiffness: 20, damping: 10, mass: 3 }
  );
  const rightBirdX = useSpring(
    useTransform(scrollYProgress, [0, 1], [20, -20]),
    { stiffness: 20, damping: 10, mass: 3 }
  );

  // Count-up values
  const structureCount = useCountUp(12000, inView, 2200, 400);
  const homeCount = useCountUp(5600, inView, 2000, 600);

  const formatNumber = useCallback(
    (n: number) => n.toLocaleString("en-US"),
    []
  );

  return (
    <div
      id="context"
      ref={sectionRef}
      style={{ height: "300vh", position: "relative" }}
    >
    <section
      style={{
        backgroundColor: "#F8F2E4",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Sticky inner */}
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "80px 0" : "160px 0",
        }}
      >
        {/* ── Decorative elements — desktop only ── */}
        {!isMobile && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src="/left-tree.svg"
              alt=""
              loading="lazy"
              initial={prefersReducedMotion ? false : { x: "-100%", opacity: 0 }}
              animate={inView ? { x: "0%", opacity: 1 } : undefined}
              transition={{ ...TREE_SPRING, delay: 0.3 }}
              style={{
                position: "absolute",
                bottom: "22%",
                left: "-2%",
                width: "14vw",
                height: "auto",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src="/right-tree.svg"
              alt=""
              loading="lazy"
              initial={prefersReducedMotion ? false : { x: "80%", opacity: 0 }}
              animate={inView ? { x: "0%", opacity: 1 } : undefined}
              transition={{ ...TREE_SPRING, delay: 0.15 }}
              style={{
                position: "absolute",
                top: "6%",
                right: "-4%",
                height: "68%",
                width: "auto",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src="/left-bird.svg"
              alt=""
              loading="lazy"
              style={{
                position: "absolute",
                top: "14%",
                left: "28%",
                width: "84px",
                height: "auto",
                pointerEvents: "none",
                opacity: inView ? 1 : 0,
                transition: "opacity 1.2s ease-out 0.5s",
                zIndex: 3,
                y: leftBirdY,
                x: leftBirdX,
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src="/right-bird.svg"
              alt=""
              loading="lazy"
              style={{
                position: "absolute",
                top: "30%",
                right: "28%",
                width: "64px",
                height: "auto",
                pointerEvents: "none",
                opacity: inView ? 1 : 0,
                transition: "opacity 1.2s ease-out 0.9s",
                zIndex: 3,
                y: rightBirdY,
                x: rightBirdX,
              }}
            />
          </>
        )}

        {/* ── Center text content ── */}
        <div
          ref={textRef}
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            padding: isMobile ? "0 24px" : "0 60px",
            maxWidth: "720px",
            width: "100%",
          }}
        >
          {/* Main heading — 3 lines, natural wrap */}
          <motion.h2
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 40, filter: "blur(8px)" }
            }
            animate={
              inView
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : undefined
            }
            transition={{ ...REVEAL_SPRING, delay: 0.1 }}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "clamp(24px, 5vw, 32px)" : "42px",
              fontWeight: 400,
              color: "#4A3C24",
              lineHeight: "140%",
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: isMobile ? "48px" : "60px",
            }}
          >
            The Palisades and Eaton fires
            <br />
            destroyed over{" "}
            <span
              style={{
                color: "#B8965A",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatNumber(structureCount)}
            </span>{" "}
            structures
            <br />
            across Los Angeles County.
          </motion.h2>

          {/* Stats row */}
          <motion.div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "center",
              alignItems: "center",
              gap: isMobile ? "28px" : "80px",
              marginBottom: isMobile ? "32px" : "44px",
            }}
            initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
            animate={
              inView
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : undefined
            }
            transition={{ ...REVEAL_SPRING, delay: 0.35 }}
          >
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isMobile ? "30px" : "44px",
                  fontWeight: 400,
                  color: "#B8965A",
                  display: "block",
                  lineHeight: "110%",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatNumber(homeCount)}
              </span>
              <span
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: isMobile ? "10px" : "12px",
                  fontWeight: 400,
                  color: "#4A3C24",
                  opacity: 0.45,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  marginTop: "10px",
                  display: "block",
                }}
              >
                Homes lost in Palisades
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isMobile ? "30px" : "44px",
                  fontWeight: 400,
                  color: "#B8965A",
                  display: "block",
                  lineHeight: "110%",
                }}
              >
                $30–40B
              </span>
              <span
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: isMobile ? "10px" : "12px",
                  fontWeight: 400,
                  color: "#4A3C24",
                  opacity: 0.45,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  marginTop: "10px",
                  display: "block",
                }}
              >
                Estimated losses
              </span>
            </div>
          </motion.div>

          {/* Gold divider — centered */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={inView ? { scaleX: 1, opacity: 1 } : undefined}
            transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.55 }}
            style={{
              width: "80px",
              height: "1.5px",
              backgroundColor: "#B8965A",
              margin: "0 auto",
              marginBottom: isMobile ? "28px" : "36px",
            }}
          />

          {/* Closing statement — 2 lines */}
          <motion.p
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={
              inView
                ? { opacity: 0.65, y: 0, filter: "blur(0px)" }
                : undefined
            }
            transition={{ ...REVEAL_SPRING, delay: 0.65 }}
            style={{
              fontFamily: "'Alte Haas Grotesk', sans-serif",
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: 400,
              color: "#4A3C24",
              lineHeight: "170%",
              margin: "0 auto",
              maxWidth: "600px",
            }}
          >
            Rebuilding the traditional way could take close to a decade. Versa
            Villa brings that down to months, with homes built to withstand
            future fires.
          </motion.p>
        </div>
      </div>
    </section>
    </div>
  );
}
