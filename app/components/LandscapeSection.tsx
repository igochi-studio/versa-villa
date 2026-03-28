"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion, useScroll, useMotionValueEvent, AnimatePresence } from "motion/react";
import { ArrowRightIcon, Cross2Icon, InstagramLogoIcon } from "@radix-ui/react-icons";
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

// ── Premium radio group for qualification form ──────────────────────────────
function FormRadioGroup({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
      <legend
        style={{
          fontFamily: "'Alte Haas Grotesk', sans-serif",
          fontSize: "13px",
          fontWeight: 400,
          color: "#4A3C24",
          lineHeight: "150%",
          marginBottom: "10px",
          padding: 0,
        }}
      >
        {label}
      </legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: "13px",
                fontWeight: 400,
                color: selected ? "#F8F2E4" : "#4A3C24",
                backgroundColor: selected ? "#4A3C24" : "transparent",
                border: `1px solid ${selected ? "#4A3C24" : "rgba(74, 60, 36, 0.18)"}`,
                borderRadius: "2px",
                padding: "8px 16px",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                letterSpacing: "0.02em",
                lineHeight: "140%",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FormContinueButton({ enabled, onClick, onHover }: { enabled: boolean; onClick: () => void; onHover: () => void }) {
  return (
    <button
      onClick={() => enabled && onClick()}
      disabled={!enabled}
      className={enabled ? "landscape-cta-btn" : ""}
      onMouseEnter={() => enabled && onHover()}
      style={{
        marginTop: "36px", background: "transparent", cursor: enabled ? "pointer" : "default",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "12px",
        padding: "14px 32px", border: `1px solid ${enabled ? "rgba(74, 60, 36, 0.25)" : "rgba(74, 60, 36, 0.1)"}`,
        borderRadius: 0, position: "relative", overflow: "hidden",
        color: enabled ? "#4A3C24" : "rgba(74, 60, 36, 0.3)", width: "100%",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", opacity: enabled ? 1 : 0.5,
      }}
    >
      <span className={enabled ? "landscape-cta-btn-bg" : ""} style={{ position: "absolute", inset: 0, backgroundColor: "#4A3C24", transformOrigin: "bottom center", transform: "scaleY(0)", transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)", zIndex: 0 }} />
      <span className={enabled ? "landscape-cta-btn-text" : ""} style={{ fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "15px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.12em", position: "relative", zIndex: 1, color: "inherit", transition: "color 300ms ease" }}>CONTINUE</span>
      <span className={enabled ? "landscape-cta-btn-arrow" : ""} style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", color: enabled ? "#B8965A" : "rgba(184, 150, 90, 0.3)", transition: "color 300ms ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <ArrowRightIcon width={16} height={16} />
      </span>
    </button>
  );
}

function FormBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center",
        gap: "6px", padding: 0, marginTop: "16px", marginBottom: "16px", color: "#8C7B5E",
        fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "13px", letterSpacing: "0.05em", transition: "color 0.2s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#4A3C24"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#8C7B5E"; }}
    >
      <ArrowRightIcon width={12} height={12} style={{ transform: "rotate(180deg)" }} />
      BACK
    </button>
  );
}

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formStep, setFormStep] = useState(0); // 0, 1, 2 = three steps

  // Listen for custom event from hero CHECK ELIGIBILITY button
  useEffect(() => {
    const handler = () => setIsFormOpen(true);
    window.addEventListener("open-qualification-form", handler);
    return () => window.removeEventListener("open-qualification-form", handler);
  }, []);
  const [formData, setFormData] = useState({
    ownsProperty: "",
    fireImpact: "",
    situation: "",
    rebuildStage: "",
    fullName: "",
    email: "",
    phone: "",
    propertyLocation: "",
    wantsContact: "",
  });

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const canAdvanceStep0 = formData.ownsProperty && formData.fireImpact;
  const canAdvanceStep1 = formData.situation && formData.rebuildStage;

  const resetForm = useCallback(() => {
    setFormStep(0);
    setFormData({
      ownsProperty: "",
      fireImpact: "",
      situation: "",
      rebuildStage: "",
      fullName: "",
      email: "",
      phone: "",
      propertyLocation: "",
      wantsContact: "",
    });
  }, []);
  const [mounted, setMounted] = useState(false);
  // true = browser can play transparent WebM (Chrome/Firefox) → need multiply blend
  // false = Safari/iOS falls back to baked MP4 → blend mode must be off
  const [supportsWebM, setSupportsWebM] = useState(false);

  useEffect(() => {
    setMounted(true);
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
              setIsFormOpen(true);
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

      {/* Qualification Form — portaled to body to escape stacking contexts */}
      {mounted && createPortal(
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            key="form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              if (isSubmitted) return;
              playTick(3200, 0.035, 0.06);
              setIsFormOpen(false);
              resetForm();
            }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 100,
              display: "flex",
              alignItems: "stretch",
              justifyContent: "flex-end",
            }}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#F8F2E4",
                padding: isMobile ? "36px 24px 32px" : "52px 48px 44px",
                width: isMobile ? "100%" : "480px",
                maxWidth: "100%",
                position: "relative",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Close button */}
              {!isSubmitted && (
                <button
                  onClick={() => {
                    playTick(3200, 0.035, 0.06);
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  aria-label="Close"
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#4A3C24",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.5,
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
                >
                  <Cross2Icon width={18} height={18} />
                </button>
              )}

              {/* Step indicator */}
              {!isSubmitted && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  {[0, 1, 2].map((step) => (
                    <div
                      key={step}
                      style={{
                        flex: 1,
                        height: "2px",
                        backgroundColor: formStep >= step ? "#B8965A" : "rgba(74, 60, 36, 0.1)",
                        transition: "background-color 0.4s ease",
                        borderRadius: "1px",
                      }}
                    />
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  /* ── Success state ── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "20px",
                      padding: "32px 0",
                      textAlign: "center",
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.15 }}
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        border: "2px solid #B8965A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <motion.path
                          d="M5 11.5L9.5 16L17 6"
                          stroke="#B8965A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.35 }}
                        />
                      </svg>
                    </motion.div>

                    <motion.h3
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.3 }}
                      style={{
                        fontFamily: "var(--font-playfair), serif",
                        fontSize: isMobile ? "28px" : "32px",
                        fontWeight: 400,
                        color: "#4A3C24",
                        margin: 0,
                        lineHeight: "125%",
                      }}
                    >
                      We&apos;ll be in touch.
                    </motion.h3>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      style={{
                        fontFamily: "'Alte Haas Grotesk', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        color: "#8C7B5E",
                        margin: 0,
                        lineHeight: "160%",
                        maxWidth: "320px",
                      }}
                    >
                      Our team will review your details and reach out within a few days to discuss next steps.
                    </motion.p>
                  </motion.div>
                ) : formStep === 0 ? (
                  /* ── Step 1: Your situation ── */
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  >
                    <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: isMobile ? "26px" : "30px", fontWeight: 400, color: "#4A3C24", margin: "20px 0 8px", lineHeight: "130%" }}>
                      See if Versa Villa is right for you
                    </h3>
                    <p style={{ fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "14px", color: "#8C7B5E", margin: "0 0 36px", lineHeight: "155%" }}>
                      A few quick questions to help us understand your situation.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                      <FormRadioGroup label="Do you own a property in Pacific Palisades or Malibu?" name="ownsProperty" options={["Yes", "No"]} value={formData.ownsProperty} onChange={(v) => updateField("ownsProperty", v)} />
                      <FormRadioGroup label="Was your home impacted by a recent wildfire?" name="fireImpact" options={["Yes", "No"]} value={formData.fireImpact} onChange={(v) => updateField("fireImpact", v)} />
                    </div>

                    <FormContinueButton enabled={!!canAdvanceStep0} onClick={() => { playTick(3800, 0.04, 0.08); setFormStep(1); }} onHover={() => playTick(4000, 0.03, 0.05)} />
                  </motion.div>
                ) : formStep === 1 ? (
                  /* ── Step 2: Your plans ── */
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  >
                    <FormBackButton onClick={() => { playTick(3200, 0.035, 0.06); setFormStep(0); }} />

                    <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: isMobile ? "26px" : "30px", fontWeight: 400, color: "#4A3C24", margin: "0 0 8px", lineHeight: "130%" }}>
                      Tell us more about your plans
                    </h3>
                    <p style={{ fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "14px", color: "#8C7B5E", margin: "0 0 36px", lineHeight: "155%" }}>
                      This helps us tailor the conversation to where you are.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                      <FormRadioGroup label="What best describes your current situation?" name="situation" options={["Home lost or unlivable", "Home damaged", "Exploring rebuild options", "Just learning"]} value={formData.situation} onChange={(v) => updateField("situation", v)} />
                      <FormRadioGroup label="What stage are you in?" name="rebuildStage" options={["Ready to rebuild soon", "Planning within 6–12 months", "Exploring options"]} value={formData.rebuildStage} onChange={(v) => updateField("rebuildStage", v)} />
                    </div>

                    <FormContinueButton enabled={!!canAdvanceStep1} onClick={() => { playTick(3800, 0.04, 0.08); setFormStep(2); }} onHover={() => playTick(4000, 0.03, 0.05)} />
                  </motion.div>
                ) : (
                  /* ── Step 3: Your details ── */
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  >
                    <FormBackButton onClick={() => { playTick(3200, 0.035, 0.06); setFormStep(1); }} />

                    <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: isMobile ? "26px" : "30px", fontWeight: 400, color: "#4A3C24", margin: "0 0 8px", lineHeight: "130%" }}>
                      Let&apos;s talk about your property
                    </h3>
                    <p style={{ fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "14px", color: "#8C7B5E", margin: "0 0 32px", lineHeight: "155%" }}>
                      Share your details so our team can reach out.
                    </p>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        playTick(3800, 0.04, 0.08);
                        const fd = new FormData();
                        fd.append("access_key", "038eb825-64f5-4dd9-9a18-7ca04024aa11");
                        fd.append("subject", "New Versa Villa Property Inquiry");
                        fd.append("from_name", "Versa Villa Website");
                        fd.append("Full Name", formData.fullName);
                        fd.append("Email", formData.email);
                        fd.append("Phone", formData.phone);
                        fd.append("Property Location", formData.propertyLocation);
                        fd.append("Wants Team Contact", formData.wantsContact);
                        fd.append("Owns Property in Palisades/Malibu", formData.ownsProperty);
                        fd.append("Fire Impact", formData.fireImpact);
                        fd.append("Current Situation", formData.situation);
                        fd.append("Rebuild Stage", formData.rebuildStage);
                        try { await fetch("https://api.web3forms.com/submit", { method: "POST", body: fd }); } catch { /* silent */ }
                        setIsSubmitted(true);
                        setTimeout(() => { setIsFormOpen(false); setIsSubmitted(false); resetForm(); }, 4000);
                      }}
                      style={{ display: "flex", flexDirection: "column", gap: "22px" }}
                    >
                      {[
                        { label: "Full Name", name: "fullName", type: "text", autoComplete: "name", required: true },
                        { label: "Email", name: "email", type: "email", autoComplete: "email", required: true },
                        { label: "Phone", name: "phone", type: "tel", autoComplete: "tel", required: true },
                        { label: "Property Address or Area", name: "propertyLocation", type: "text", autoComplete: "street-address", required: false },
                      ].map((field) => (
                        <label key={field.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8C7B5E" }}>
                            {field.label}{!field.required && <span style={{ opacity: 0.5 }}> (optional)</span>}
                          </span>
                          <input
                            type={field.type} autoComplete={field.autoComplete} required={field.required}
                            value={formData[field.name as keyof typeof formData]}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            style={{ background: "transparent", border: "none", borderBottom: "1px solid #C4B8A0", padding: "10px 0", fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "16px", color: "#4A3C24", outline: "none", borderRadius: 0, transition: "border-color 200ms ease" }}
                            onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#B8965A"; }}
                            onBlur={(e) => { e.currentTarget.style.borderBottomColor = "#C4B8A0"; }}
                          />
                        </label>
                      ))}

                      <FormRadioGroup label="Would you like our team to evaluate if Versa Villa could be a fit?" name="wantsContact" options={["Yes, please reach out", "Not yet"]} value={formData.wantsContact} onChange={(v) => updateField("wantsContact", v)} />

                      <button type="submit" className="landscape-cta-btn" onMouseEnter={() => playTick(4000, 0.03, 0.05)} style={{ marginTop: "8px", background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "14px 32px", border: "1px solid rgba(74, 60, 36, 0.25)", borderRadius: 0, position: "relative", overflow: "hidden", color: "#4A3C24", alignSelf: "center", width: "100%", transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                        <span className="landscape-cta-btn-bg" style={{ position: "absolute", inset: 0, backgroundColor: "#4A3C24", transformOrigin: "bottom center", transform: "scaleY(0)", transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)", zIndex: 0 }} />
                        <span className="landscape-cta-btn-text" style={{ fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "15px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.12em", position: "relative", zIndex: 1, color: "inherit", transition: "color 300ms ease" }}>SUBMIT INQUIRY</span>
                        <span className="landscape-cta-btn-arrow" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", color: "#B8965A", transition: "color 300ms ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}><ArrowRightIcon width={16} height={16} /></span>
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body)}

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
