"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ── Haptic sound ────────────────────────────────────────────────────────────
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
  } catch { /* silent */ }
}

// ── Press logos for marquee ─────────────────────────────────────────────────
const PRESS_LOGOS = [
  { src: "/wsj-wordmark.svg", alt: "Wall Street Journal", url: "https://www.wsj.com/real-estate/luxury-homes/fire-resistant-home-pacific-palisades-los-angeles-c66bff83", height: 32 },
  { src: "/pgsix-wordmark.svg", alt: "Page Six", url: "https://pagesix.com/2026/03/02/hollywood/inside-the-ambitious-project-to-make-truly-fireproof-homes-after-the-devastating-palisades-fires/", height: 30 },
  { src: "/latimes-wordmark.svg", alt: "LA Times", url: "https://www.latimes.com/environment/story/2026-03-02/can-fire-resistant-homes-be-sexy", height: 30 },
  { src: "/trd-wordmark.svg", alt: "The Real Deal", url: "https://therealdeal.com/la/2026/03/02/ardie-tavangarian-to-bring-fire-resistant-homes-norcal-florida/", height: 28 },
  { src: "/hs-wordmark.svg", alt: "Hey SoCal", url: "https://heysocal.com/2026/02/06/newsom-announces-funding-for-la-fire-survivors-to-access-pre-built-housing/", height: 28 },
];

const FEATURES = [
  {
    number: "01",
    title: "Off-the-Grid Protection",
    copy: "Your home is designed to protect itself without relying on outside systems. With independent detection and response built in, it remains prepared even when municipal water, power, or emergency response fail.",
    cue: "Protection",
    media: { src: "/detection system.webp", type: "image" as const },
  },
  {
    number: "02",
    title: "Built for Wildfire Reality",
    copy: "This is not a standard rebuild. Every element is designed to reduce risk at its core and withstand extreme wildfire conditions — not simply delay damage.",
    cue: "Wildfire",
    media: { src: "/glass.mov", type: "video" as const },
  },
  {
    number: "03",
    title: "Insurability, Built In",
    copy: "Designed with insurability in mind, giving you greater clarity on coverage and cost before construction begins — so you are not left exposed after you move in.",
    cue: "Insurance",
    media: { src: "/010_Bienvenida 1241_by mrbarcelo.webp", type: "image" as const },
  },
  {
    number: "04",
    title: "Six Months, Not Two Years",
    copy: "A faster, more controlled path back to your home. With a clear build timeline and streamlined execution, you avoid the delays and uncertainty of traditional construction.",
    cue: "Timeline",
    media: { src: "/steel.webp", type: "image" as const },
  },
  {
    number: "05",
    title: "Fully Managed, End to End",
    copy: "From design through delivery, every step is handled by one coordinated team. No fragmented vendors, no constant oversight — just a direct path back home.",
    cue: "Managed",
    media: { src: "/backup.webp", type: "image" as const },
  },
  {
    number: "06",
    title: "Peace of Mind",
    copy: "More than a rebuild, this is a home designed to restore confidence. A place you can live in, leave, and return to knowing it was built for greater safety, security, and peace of mind.",
    cue: "Peace",
    media: { src: "/envelope.webp", type: "image" as const },
  },
];

const SCROLL_HEIGHT = "700vh";
const THRESHOLDS = FEATURES.map((_, i) => i / FEATURES.length);

function getPhase(progress: number): number {
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (progress >= THRESHOLDS[i]) return i;
  }
  return 0;
}

/* ─── Paragraph blur fade-in variants ─── */
const blockVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_OUT_EXPO, filter: { duration: 0.6, ease: EASE_OUT_EXPO } },
  },
  exit: {
    opacity: 0, y: -8, filter: "blur(4px)",
    transition: { duration: 0.25, ease: EASE_OUT_EXPO },
  },
};

const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export default function FeaturesV2() {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const marqueeHoveredRef = useRef(false);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion ? reducedVariants : blockVariants;

  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = getPhase(v);
    setActiveIndex((prev) => (next !== prev ? next : prev));
  });

  // Marquee animation
  useEffect(() => {
    const track = marqueeTrackRef.current;
    if (!track) return;
    const halfWidth = track.scrollWidth / 2;
    const duration = halfWidth * 20;
    const anim = track.animate(
      [{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(-${halfWidth}px,0,0)` }],
      { duration, iterations: Infinity, easing: "linear" },
    );
    let rateRef = 1;
    let rafId = 0;
    const tick = () => {
      const target = marqueeHoveredRef.current ? 0.2 : 1;
      rateRef += (target - rateRef) * 0.04;
      anim.playbackRate = rateRef;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafId); anim.cancel(); };
  }, []);

  const marqueeLogos = [...PRESS_LOGOS, ...PRESS_LOGOS, ...PRESS_LOGOS, ...PRESS_LOGOS];

  const handleIndicatorEnter = useCallback((i: number) => {
    playTick(4200, 0.025, 0.04);
    setHoveredIndex(i);
  }, []);
  const handleIndicatorLeave = useCallback(() => setHoveredIndex(null), []);
  const handleIndicatorClick = useCallback((i: number) => {
    playTick(3800, 0.04, 0.08);
    setActiveIndex(i);
    setHoveredIndex(null);
    // Scroll to the corresponding position in the tall container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const containerTop = rect.top + window.scrollY;
      const containerHeight = containerRef.current.scrollHeight;
      const targetScroll = containerTop + (i / FEATURES.length) * containerHeight + 1;
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  }, []);

  const feature = FEATURES[activeIndex];

  return (
    <div id="fire-features" ref={containerRef} style={{ height: SCROLL_HEIGHT, position: "relative" }}>
      <section
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "#F8F2E4",
          height: "100vh",
          minHeight: isMobile ? "600px" : "700px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          paddingTop: isMobile ? "56px" : "68px",
        }}
      >
        {/* ── Marquee bar ── */}
        <div
          style={{
            flexShrink: 0,
            borderBottom: "1px solid rgba(184, 150, 90, 0.1)",
            padding: isMobile ? "16px 0 18px" : "20px 0 22px",
            overflow: "hidden",
          }}
        >
          <p
            style={{
              textAlign: "center",
              fontFamily: "'Alte Haas Grotesk', sans-serif",
              fontSize: "11px",
              fontWeight: 400,
              letterSpacing: "5px",
              textTransform: "uppercase",
              color: "rgba(74, 60, 36, 0.4)",
              margin: 0,
              marginBottom: isMobile ? "14px" : "18px",
            }}
          >
            AS SEEN ON
          </p>
          <div
            onMouseEnter={() => { marqueeHoveredRef.current = true; playTick(4800, 0.025, 0.04); }}
            onMouseLeave={() => { marqueeHoveredRef.current = false; }}
            style={{ overflow: "hidden", cursor: "default" }}
          >
            <div
              ref={marqueeTrackRef}
              style={{ display: "flex", alignItems: "center", gap: isMobile ? "48px" : "72px", willChange: "transform" }}
            >
              {marqueeLogos.map((logo, i) => (
                <a
                  key={`${logo.alt}-${i}`}
                  href={logo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playTick(3600, 0.04, 0.06)}
                  onMouseEnter={() => playTick(5200, 0.02, 0.03)}
                  className="as-seen-logo"
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px 16px",
                    opacity: 0.35,
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    style={{
                      height: `${isMobile ? Math.round(logo.height * 0.8) : logo.height}px`,
                      width: "auto",
                      display: "block",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Main two-column layout */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            padding: isMobile ? "72px 24px 0" : "0",
            minHeight: 0,
          }}
        >
          {/* LEFT COLUMN — text */}
          <div
            style={{
              flex: isMobile ? "none" : "0 0 45%",
              display: "flex",
              flexDirection: "column",
              justifyContent: isMobile ? "center" : "center",
              paddingLeft: isMobile ? 0 : "60px",
              paddingRight: isMobile ? 0 : "60px",
              minHeight: isMobile ? "45%" : undefined,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`feature-${activeIndex}`}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}
              >
                {/* Number */}
                <motion.div
                  variants={variants}
                  style={{ willChange: "filter, opacity, transform" }}
                >
                  <span style={{ fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "18px", fontWeight: 700, color: "#B8965A", letterSpacing: "2px" }}>
                    [{feature.number}]
                  </span>
                </motion.div>

                {/* Title */}
                <motion.p
                  variants={variants}
                  style={{
                    margin: 0, fontFamily: "'Playfair Display', serif",
                    fontSize: isMobile ? "clamp(32px, 5vw, 48px)" : "56px",
                    fontWeight: 400, color: "#4A3C24", lineHeight: "110%", letterSpacing: "-0.02em",
                    willChange: "filter, opacity, transform",
                  }}
                >
                  {feature.title}
                </motion.p>

                {/* Copy */}
                <motion.p
                  variants={variants}
                  style={{
                    margin: 0, maxWidth: isMobile ? "100%" : "480px",
                    fontFamily: "'Alte Haas Grotesk', sans-serif",
                    fontSize: isMobile ? "clamp(16px, 2vw, 20px)" : "22px",
                    fontWeight: 400, color: "#4A3C24", lineHeight: "160%",
                    willChange: "filter, opacity, transform",
                  }}
                >
                  {feature.copy}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN — media */}
          <div
            style={{
              flex: isMobile ? "1" : "0 0 55%",
              display: "flex", alignItems: "stretch", justifyContent: "center",
              position: "relative", overflow: "hidden",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`media-${activeIndex}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                style={{
                  width: "100%", height: isMobile ? undefined : "100%",
                  position: "relative", overflow: "hidden",
                  borderRadius: isMobile ? "8px" : "0px",
                }}
              >
                {feature.media.type === "video" ? (
                  <video
                    key={feature.media.src}
                    src={feature.media.src}
                    autoPlay muted loop playsInline
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={feature.media.src}
                    alt={feature.title}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom indicator lines */}
        <div style={{ padding: isMobile ? "0 24px 32px" : "0 60px 48px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: isMobile ? "4px" : "6px", width: isMobile ? "100%" : "45%" }}>
            {FEATURES.map((f, i) => {
              const isActive = i === activeIndex;
              const isHovered = i === hoveredIndex;
              const isPast = i < activeIndex;
              return (
                <div
                  key={i}
                  style={{ flex: 1, cursor: "pointer", position: "relative", paddingTop: "28px" }}
                  onMouseEnter={() => handleIndicatorEnter(i)}
                  onMouseLeave={handleIndicatorLeave}
                  onClick={() => handleIndicatorClick(i)}
                >
                  {!isMobile && (
                    <span
                      style={{
                        fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "11px", fontWeight: 500,
                        color: isActive ? "#B8965A" : isHovered ? "#4A3C24" : "rgba(74, 60, 36, 0.4)",
                        letterSpacing: "1.5px", textTransform: "uppercase",
                        whiteSpace: "nowrap", position: "absolute", top: 0, left: 0, pointerEvents: "none",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {f.cue}
                    </span>
                  )}
                  <div
                    style={{
                      width: "100%", height: isActive || isHovered ? "3px" : "2px",
                      backgroundColor: "rgba(74, 60, 36, 0.1)", borderRadius: "1.5px",
                      overflow: "hidden", position: "relative", transition: "height 0.3s ease",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 0, left: 0, height: "100%", borderRadius: "1.5px",
                      width: isActive || isPast ? "100%" : "0%",
                      backgroundColor: isActive ? "#B8965A" : isPast ? "rgba(74, 60, 36, 0.35)" : "transparent",
                      transition: "width 0.4s cubic-bezier(0.16,1,0.3,1), background-color 0.3s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ width: isMobile ? "100%" : "45%", marginTop: "12px" }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={activeIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                style={{ fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "14px", fontWeight: 500, color: "#4A3C24", opacity: 0.4 }}
              >
                {String(activeIndex + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <style>{`
          .as-seen-logo:hover {
            opacity: 0.7 !important;
            transform: scale(1.05);
          }
        `}</style>
      </section>
    </div>
  );
}
