"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion, useScroll, useMotionValueEvent } from "motion/react";
import { ArrowRightIcon, InstagramLogoIcon } from "@radix-ui/react-icons";
import { useIsMobile } from "../hooks/useIsMobile";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const TREE_SPRING = {
  type: "spring" as const,
  stiffness: 200,
  damping: 80,
  mass: 2,
};

const CHAR_SPRING = {
  type: "spring" as const,
  stiffness: 200,
  damping: 80,
  mass: 2,
};

const LINES = ["Come Home to", "Pacific Palisades"];
const CHAR_STAGGER = 0.012;
const ANIM_DELAY = 0.15;

// Total chars across all lines — used to time the CTA after text finishes
const TOTAL_CHARS = LINES.reduce((sum, l) => sum + l.length, 0);
const CTA_DELAY = ANIM_DELAY + TOTAL_CHARS * CHAR_STAGGER + 0.15;

// ── Haptic sound — subtle tick via Web Audio API ────────────────────────────
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
          style={{ display: "inline-block", willChange: "transform, opacity" }}
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, y: 10 }
          }
          animate={
            inView
              ? { opacity: 1, y: 0 }
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
  const isMobile = useIsMobile();
  const outerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const flowerVideoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  // Scroll-driven reveal — triggers at ~30% scroll through the 200vh wrapper
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start end", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v >= 0.3 && !inView) setInView(true);
  });
  // true = browser can play transparent WebM (Chrome/Firefox) → need multiply blend
  // false = Safari/iOS falls back to baked MP4 → blend mode must be off
  const [supportsWebM, setSupportsWebM] = useState(false);

  useEffect(() => {
    const v = document.createElement("video");
    setSupportsWebM(v.canPlayType('video/webm; codecs="vp8"') !== "");
  }, []);

  // iOS Safari needs explicit .play() for autoplay
  useEffect(() => {
    const video = flowerVideoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <div ref={outerRef} style={{ height: "200vh", position: "relative" }}>
    <section
      ref={sectionRef}
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#F8F2E4",
      }}
    >
      {/* Center text — char-by-char reveal matching Hero */}
      <div
        style={{
          position: "absolute",
          top: isMobile ? "15%" : "28%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 2,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: isMobile ? "clamp(32px, 5vw, 48px)" : "56px",
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "#4A3C24",
            textAlign: "center",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
        >
          {LINES.map((line, lineIndex) => {
            const charOffset = LINES.slice(0, lineIndex).reduce(
              (sum, l) => sum + l.length,
              0
            );
            // Blur lives on the line wrapper (2 paint ops) instead of
            // per-character (~50 paint ops). Clears as the last char lands.
            const lineStart = ANIM_DELAY + charOffset * CHAR_STAGGER;
            const lineDur = line.length * CHAR_STAGGER + 0.4;
            return (
              <motion.span
                key={lineIndex}
                style={{
                  display: "block",
                  whiteSpace: isMobile ? "normal" : "nowrap",
                  willChange: "filter",
                }}
                initial={shouldReduceMotion ? false : { filter: "blur(5px)" }}
                animate={inView ? { filter: "blur(0px)" } : undefined}
                transition={{
                  duration: lineDur * 0.25,
                  ease: EASE_OUT_EXPO,
                  delay: lineStart,
                }}
              >
                <CharReveal
                  line={line}
                  charOffset={charOffset}
                  inView={inView}
                />
              </motion.span>
            );
          })}
        </h2>

        {/* JOIN OUR FAMILY CTA */}
        <motion.div
          style={{ marginTop: "28px", display: "inline-block", pointerEvents: "auto" }}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14, filter: "blur(4px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: CTA_DELAY }}
        >
          <button
            onClick={() => {
              playTick(3800, 0.04, 0.08);
              window.dispatchEvent(new CustomEvent("open-qualification-form"));
            }}
            onMouseEnter={() => playTick(4000, 0.03, 0.05)}
            className="landscape-cta-btn"
            style={{
              background: "transparent",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: isMobile ? "12px" : "16px",
              padding: isMobile ? "14px 28px" : "16px 36px",
              border: "1px solid rgba(74, 60, 36, 0.2)",
              borderRadius: 0,
              position: "relative",
              overflow: "hidden",
              color: "#4A3C24",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Background fill — scales up from bottom on hover */}
            <span
              className="landscape-cta-btn-bg"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "#4A3C24",
                transformOrigin: "bottom center",
                transform: "scaleY(0)",
                transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                zIndex: 0,
              }}
            />

            <span
              className="landscape-cta-btn-text"
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: isMobile ? "clamp(14px, 2.5vw, 16px)" : "18px",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                position: "relative",
                zIndex: 1,
                color: "inherit",
                transition: "color 300ms ease",
              }}
            >
              EXPLORE YOUR OPTIONS
            </span>

            <span
              className="landscape-cta-btn-arrow"
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                color: "#B8965A",
                transition: "color 300ms ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <ArrowRightIcon width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} />
            </span>
          </button>
        </motion.div>
      </div>

      {/* Flower animation — rises from bottom, full-width presence */}
      <motion.div
        style={{
          position: "absolute",
          bottom: isMobile ? "40px" : "20px",
          left: 0,
          right: 0,
          zIndex: 1,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
        initial={shouldReduceMotion ? false : { y: "25%", opacity: 0 }}
        animate={inView ? { y: 0, opacity: 1 } : undefined}
        transition={{ ...TREE_SPRING, delay: ANIM_DELAY }}
      >
        <video
          ref={flowerVideoRef}
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
          style={{
            width: isMobile ? "250vw" : "45vw",
            maxWidth: "none",
            height: "auto",
            maxHeight: "none",
            objectFit: "contain",
            mixBlendMode: supportsWebM ? "multiply" : "normal",
          }}
        >
          <source src="/flower-animation-transparent.webm" type="video/webm" />
          <source src="/flower-animation-baked.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Footer bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 3,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "10px 16px" : "20px 40px",
        }}
      >
        {/* Instagram — bottom left */}
        <a
          href="https://www.instagram.com/versa.villa/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            color: "#4A3C24",
            opacity: 0.6,
            transition: "opacity 150ms ease",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
        >
          <InstagramLogoIcon width={isMobile ? 14 : 18} height={isMobile ? 14 : 18} />
          <span
            style={{
              fontFamily: "'Alte Haas Grotesk', sans-serif",
              fontSize: isMobile ? "11px" : "14px",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            @versa.villa
          </span>
        </a>

        {/* Copyright — center */}
        <span
          style={{
            fontFamily: "'Alte Haas Grotesk', sans-serif",
            fontSize: isMobile ? "10px" : "14px",
            color: "#4A3C24",
            opacity: 0.6,
            letterSpacing: "0.03em",
          }}
        >
          &copy; VersaVilla 2026
        </span>

        {/* Site credit — bottom right */}
        <span
          style={{
            fontFamily: "'Alte Haas Grotesk', sans-serif",
            fontSize: isMobile ? "10px" : "14px",
            color: "#4A3C24",
            opacity: 0.6,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          SITE BY{" "}
          <a
            href="https://www.igochi.studio/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "inherit",
              textDecoration: "none",
              borderBottom: "1px solid currentColor",
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            IGOCHI STUDIO
          </a>
        </span>
      </div>

      {/* Hover styles for CTA buttons */}
      <style>{`
        .landscape-cta-btn:hover {
          color: #F8F2E4;
        }
        .landscape-cta-btn:hover .landscape-cta-btn-bg {
          transform: scaleY(1);
        }
        .landscape-cta-btn:hover .landscape-cta-btn-arrow {
          color: #F8F2E4;
          transform: translateX(4px);
        }
        .landscape-cta-btn:active {
          transform: scale(0.97);
          transition: transform 80ms ease;
        }
      `}</style>
    </section>
    </div>
  );
}
