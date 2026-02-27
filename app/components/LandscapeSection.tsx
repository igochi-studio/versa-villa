"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, useInView, AnimatePresence } from "motion/react";
import { ArrowRightIcon, Cross2Icon, InstagramLogoIcon, TwitterLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import { useIsMobile } from "../hooks/useIsMobile";

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

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
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
            style={{ width: isMobile ? "140px" : "200px", height: "auto", display: "block" }}
          />
        </motion.div>
      </div>

      {/* Center text — char-by-char reveal matching Hero */}
      <div
        style={{
          position: "absolute",
          top: isMobile ? "22%" : "28%",
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
            fontSize: isMobile ? "32px" : "56px",
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
                initial={shouldReduceMotion ? false : { filter: "blur(8px)" }}
                animate={inView ? { filter: "blur(0px)" } : undefined}
                transition={{
                  duration: lineDur,
                  ease: EASE_OUT_QUINT,
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
          transition={{ duration: 0.8, ease: EASE_OUT_QUINT, delay: CTA_DELAY }}
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
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "4px 6px",
              borderBottom: "1.5px solid #B8965A",
              borderRadius: 0,
              position: "relative",
              overflow: "hidden",
              color: "#4A3C24",
              transition: "color 150ms ease",
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
                transition: "transform 180ms ease",
                zIndex: 0,
              }}
            />

            <span
              className="landscape-cta-btn-text"
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: isMobile ? "18px" : "24px",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                position: "relative",
                zIndex: 1,
                color: "inherit",
                transition: "color 150ms ease",
              }}
            >
              JOIN OUR FAMILY
            </span>

            <span
              className="landscape-cta-btn-arrow"
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                color: "#B8965A",
                transition: "color 150ms ease, transform 150ms ease",
              }}
            >
              <ArrowRightIcon width={22} height={22} />
            </span>
          </button>
        </motion.div>
      </div>

      {/* Flower animation — rises from bottom, full-width presence */}
      <motion.div
        style={{
          position: "absolute",
          bottom: "36px",
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
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
          style={{
            width: isMobile ? "95vw" : "85vw",
            maxWidth: "1200px",
            height: "auto",
            maxHeight: isMobile ? "35vh" : "50vh",
            objectFit: "contain",
          }}
        >
          <source src="/flower-animation-transparent.webm" type="video/webm" />
          <source src="/flower-animation.mp4" type="video/mp4" />
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
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "16px 20px" : "20px 40px",
        }}
      >
        {/* Social icons — bottom left */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {[
            { Icon: InstagramLogoIcon, href: "#" },
            { Icon: TwitterLogoIcon, href: "#" },
            { Icon: LinkedInLogoIcon, href: "#" },
          ].map(({ Icon, href }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#4A3C24",
                opacity: 0.6,
                transition: "opacity 150ms ease",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
            >
              <Icon width={18} height={18} />
            </a>
          ))}
        </div>

        {/* Copyright — bottom center */}
        <span
          style={{
            fontFamily: "'Alte Haas Grotesk', sans-serif",
            fontSize: isMobile ? "10px" : "12px",
            color: "#4A3C24",
            opacity: 0.6,
            letterSpacing: "0.05em",
          }}
        >
          &copy; VersaVilla 2026
        </span>

        {/* Site credit — bottom right */}
        <span
          style={{
            fontFamily: "'Alte Haas Grotesk', sans-serif",
            fontSize: isMobile ? "10px" : "12px",
            color: "#4A3C24",
            opacity: 0.6,
            letterSpacing: "0.05em",
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

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            key="form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              if (isSubmitted) return;
              playTick(3200, 0.035, 0.06);
              setIsFormOpen(false);
            }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.55)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: EASE_OUT_QUINT }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#F8F2E4",
                borderRadius: "4px",
                padding: isMobile ? "32px 24px 28px" : "48px 40px 40px",
                width: "100%",
                maxWidth: isMobile ? "92vw" : "440px",
                position: "relative",
                boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
              }}
            >
              {/* Close button */}
              {!isSubmitted && (
                <button
                  onClick={() => {
                    playTick(3200, 0.035, 0.06);
                    setIsFormOpen(false);
                  }}
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
                  }}
                >
                  <Cross2Icon width={20} height={20} />
                </button>
              )}

              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "20px",
                      padding: "24px 0",
                      textAlign: "center",
                    }}
                  >
                    {/* Checkmark */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, ease: EASE_OUT_QUINT, delay: 0.15 }}
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
                          transition={{ duration: 0.5, ease: EASE_OUT_QUINT, delay: 0.35 }}
                        />
                      </svg>
                    </motion.div>

                    <motion.h3
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE_OUT_QUINT, delay: 0.3 }}
                      style={{
                        fontFamily: "var(--font-playfair), serif",
                        fontSize: "32px",
                        fontWeight: 400,
                        color: "#4A3C24",
                        margin: 0,
                        lineHeight: "120%",
                      }}
                    >
                      Welcome to the family.
                    </motion.h3>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      style={{
                        fontFamily: "'Alte Haas Grotesk', sans-serif",
                        fontSize: "16px",
                        fontWeight: 400,
                        color: "#8C7B5E",
                        margin: 0,
                        lineHeight: "155%",
                        maxWidth: "300px",
                      }}
                    >
                      We&apos;ll be in touch soon. Something special is on its way.
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h3
                      style={{
                        fontFamily: "var(--font-playfair), serif",
                        fontSize: "32px",
                        fontWeight: 400,
                        color: "#4A3C24",
                        marginBottom: "32px",
                        textAlign: "center",
                      }}
                    >
                      Join Our Family
                    </h3>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        playTick(3800, 0.04, 0.08);
                        setIsSubmitted(true);
                        setTimeout(() => {
                          setIsFormOpen(false);
                          setIsSubmitted(false);
                        }, 3500);
                      }}
                      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
                    >
                      {[
                        { label: "Name", type: "text", name: "name", autoComplete: "name" },
                        { label: "Email", type: "email", name: "email", autoComplete: "email" },
                        { label: "Phone", type: "tel", name: "phone", autoComplete: "tel" },
                      ].map((field) => (
                        <label
                          key={field.name}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Alte Haas Grotesk', sans-serif",
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              color: "#8C7B5E",
                            }}
                          >
                            {field.label}
                          </span>
                          <input
                            type={field.type}
                            name={field.name}
                            autoComplete={field.autoComplete}
                            required
                            style={{
                              background: "transparent",
                              border: "none",
                              borderBottom: "1px solid #C4B8A0",
                              padding: "8px 0",
                              fontFamily: "'Alte Haas Grotesk', sans-serif",
                              fontSize: "16px",
                              color: "#4A3C24",
                              outline: "none",
                              borderRadius: 0,
                              transition: "border-color 150ms ease",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderBottomColor = "#B8965A";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderBottomColor = "#C4B8A0";
                            }}
                          />
                        </label>
                      ))}

                      <button
                        type="submit"
                        className="landscape-cta-btn"
                        onMouseEnter={() => playTick(4000, 0.03, 0.05)}
                        style={{
                          marginTop: "8px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                          padding: "8px 6px",
                          borderBottom: "1.5px solid #B8965A",
                          borderRadius: 0,
                          position: "relative",
                          overflow: "hidden",
                          color: "#4A3C24",
                          alignSelf: "center",
                          transition: "color 150ms ease",
                        }}
                      >
                        <span
                          className="landscape-cta-btn-bg"
                          style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: "#4A3C24",
                            transformOrigin: "bottom center",
                            transform: "scaleY(0)",
                            transition: "transform 180ms ease",
                            zIndex: 0,
                          }}
                        />
                        <span
                          className="landscape-cta-btn-text"
                          style={{
                            fontFamily: "'Alte Haas Grotesk', sans-serif",
                            fontSize: "16px",
                            fontWeight: 400,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            position: "relative",
                            zIndex: 1,
                            color: "inherit",
                            transition: "color 150ms ease",
                          }}
                        >
                          SUBMIT
                        </span>
                        <span
                          className="landscape-cta-btn-arrow"
                          style={{
                            position: "relative",
                            zIndex: 1,
                            display: "flex",
                            alignItems: "center",
                            color: "#B8965A",
                            transition: "color 150ms ease, transform 150ms ease",
                          }}
                        >
                          <ArrowRightIcon width={18} height={18} />
                        </span>
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
  );
}
