"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, useInView, AnimatePresence } from "motion/react";
import { ArrowRightIcon, Cross2Icon } from "@radix-ui/react-icons";
import Header from "../components/Header";
import { useIsMobile } from "../hooks/useIsMobile";

/* ─── Haptic sound ─── */
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
    // Audio not available
  }
}

/* ─── Constants ─── */
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

interface Model {
  number: string;
  image: string;
  stories: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  style: string;
}

const MODELS: Model[] = [
  { number: "001", image: "/villa-type-1.webp", stories: "2", bedrooms: "4", bathrooms: "5", area: "3,957", style: "MEDITERRANEAN" },
  { number: "002", image: "/villa-type-2.webp", stories: "2", bedrooms: "4", bathrooms: "5", area: "4,147", style: "MODERN" },
  { number: "003", image: "/villa-type-3.webp", stories: "3", bedrooms: "5", bathrooms: "6", area: "4,947", style: "MEDITERRANEAN" },
  { number: "004", image: "/villa-type-4.webp", stories: "3", bedrooms: "5", bathrooms: "6", area: "4,947", style: "MODERN" },
  { number: "005", image: "/villa-type-5.webp", stories: "3", bedrooms: "4", bathrooms: "6", area: "7,400", style: "MEDITERRANEAN" },
  { number: "006", image: "/villa-type-6.webp", stories: "3", bedrooms: "4", bathrooms: "6", area: "7,400", style: "CAPE COD" },
  { number: "007", image: "/villa-type-7.webp", stories: "1", bedrooms: "3", bathrooms: "4", area: "2,200", style: "MEDITERRANEAN" },
  { number: "008", image: "/villa-type-8.webp", stories: "1", bedrooms: "3", bathrooms: "4", area: "2,200", style: "MODERN" },
];

/* ─── Single model block ─── */
function ModelBlock({ model, isMobile }: { model: Model; isMobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
      style={{ marginBottom: isMobile ? "60px" : "120px" }}
    >
      {/* Image */}
      <div style={{ overflow: "hidden", borderRadius: "4px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={model.image}
          alt={`VersaVilla Model ${model.number}`}
          style={{
            width: "100%",
            display: "block",
          }}
        />
      </div>

      {/* Description bar */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "baseline",
          gap: isMobile ? "6px" : "0",
          padding: "16px 0",
          borderBottom: "1px solid rgba(74, 60, 36, 0.1)",
          fontFamily: "'Alte Haas Grotesk', sans-serif",
          fontSize: isMobile ? "13px" : "18px",
          color: "#4A3C24",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ fontWeight: 400 }}>
          {model.stories} STORIES : {model.bedrooms} BEDROOMS, {model.bathrooms} BATHROOMS
        </span>
        <span style={{ fontWeight: 700, color: "#B8965A" }}>
          {model.style}
        </span>
        <span style={{ fontWeight: 400 }}>
          GROSS AREA : APPROX. {model.area} SF
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Page ─── */
export default function FuturePage() {
  const isMobile = useIsMobile();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.3 });
  const shouldReduceMotion = useReducedMotion();

  return (
    <main style={{ backgroundColor: "#F8F2E4", minHeight: "100vh" }}>
      <Header />

      {/* Models list */}
      <section style={{ padding: isMobile ? "80px 20px 0" : "120px 60px 0" }}>
        {MODELS.map((model) => (
          <ModelBlock key={model.number} model={model} isMobile={isMobile} />
        ))}
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        style={{
          padding: isMobile ? "60px 20px 80px" : "80px 60px 120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <motion.h2
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: isMobile ? "32px" : "48px",
            fontWeight: 400,
            color: "#4A3C24",
            textAlign: "center",
            lineHeight: "120%",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Join our family.
        </motion.h2>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, ease: EASE_OUT_QUINT, delay: 0.2 }}
        >
          <button
            onClick={() => {
              playTick(3800, 0.04, 0.08);
              setIsFormOpen(true);
            }}
            onMouseEnter={() => playTick(4000, 0.03, 0.05)}
            className="future-cta-btn"
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
            <span
              className="future-cta-btn-bg"
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
              className="future-cta-btn-text"
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: "24px",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                position: "relative",
                zIndex: 1,
                color: "inherit",
                transition: "color 150ms ease",
              }}
            >
              GET IN TOUCH
            </span>
            <span
              className="future-cta-btn-arrow"
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
      </section>

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
                        fontFamily: "var(--font-playfair), 'Playfair Display', serif",
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
                        fontFamily: "var(--font-playfair), 'Playfair Display', serif",
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
                          style={{ display: "flex", flexDirection: "column", gap: "6px" }}
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
                        className="future-cta-btn"
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
                          className="future-cta-btn-bg"
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
                          className="future-cta-btn-text"
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
                          className="future-cta-btn-arrow"
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

      {/* Hover styles */}
      <style>{`
        .future-cta-btn:hover {
          color: #F8F2E4;
        }
        .future-cta-btn:hover .future-cta-btn-bg {
          transform: scaleY(1);
        }
        .future-cta-btn:hover .future-cta-btn-arrow {
          color: #F8F2E4;
          transform: translateX(4px);
        }
        .future-cta-btn:active {
          transform: scale(0.97);
          transition: transform 80ms ease;
        }
      `}</style>
    </main>
  );
}
