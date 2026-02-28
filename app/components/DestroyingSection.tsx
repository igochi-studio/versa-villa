"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";
import StorySection from "./StorySection";

// ── Cursors — SVG data-URLs ──────────────────────────────────────────────────
const EXPAND_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='19' fill='rgba(0,0,0,0.35)' stroke='rgba(255,255,255,0.6)' stroke-width='1.5'/%3E%3Cpath d='M15 15L12 12M15 15V12M15 15H12M25 25L28 28M25 25V28M25 25H28' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") 20 20, pointer";

const CLOSE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='19' fill='rgba(0,0,0,0.4)' stroke='rgba(255,255,255,0.6)' stroke-width='1.5'/%3E%3Cpath d='M14 14L26 26M26 14L14 26' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E\") 20 20, pointer";

// ── Community photos config ──────────────────────────────────────────────────
const COMMUNITY_PHOTOS = [
  "community-1",
  "community-2",
  "community-3",
  "community-4",
  "community-5",
  "community-6",
  "community-7",
];

const GAP = 24;
const BASE_RATE = 1;
const HOVER_RATE = 0.25;
const RATE_LERP = 0.035;        // heavy, weighted deceleration

// ── Compositor-driven marquee via Web Animations API ─────────────────────────
// The actual pixel movement runs on the compositor thread (off main thread).
// A lightweight RAF only lerps `playbackRate` for the weighted hover feel.
function useMarquee(
  trackRef: React.RefObject<HTMLDivElement | null>,
  hoveredRef: React.MutableRefObject<boolean>,
) {
  const animRef = useRef<Animation | null>(null);
  const rateRef = useRef(BASE_RATE);
  const rafRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Measure once; half = one full set of images
    const halfWidth = track.scrollWidth / 2;
    // Duration for one full cycle — controls base speed
    const duration = halfWidth * 18;

    // WAAPI: runs entirely on compositor, buttery 60/120fps
    const anim = track.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: `translate3d(-${halfWidth}px, 0, 0)` },
      ],
      { duration, iterations: Infinity, easing: "linear" },
    );
    animRef.current = anim;
    rateRef.current = BASE_RATE;

    // Lightweight RAF — only adjusts playbackRate, never touches DOM layout
    const tick = () => {
      const target = hoveredRef.current ? HOVER_RATE : BASE_RATE;
      rateRef.current += (target - rateRef.current) * RATE_LERP;
      anim.playbackRate = rateRef.current;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      anim.cancel();
    };
  }, [trackRef, hoveredRef]);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * DESTROYING SECTION — Content Panels (after burn)
 *
 * Burn transition now lives in DestroyingCosmos (same sticky container).
 * This component only renders the content panels that follow.
 * ─────────────────────────────────────────────────────────────────────────── */

// ── Community marquee ────────────────────────────────────────────────────────
function CommunityMarquee({ isMobile }: { isMobile: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useMarquee(trackRef, hoveredRef);

  const handleExpand = useCallback((src: string) => {
    setLightboxSrc(src);
    hoveredRef.current = true; // pause while lightbox open
  }, []);

  const handleClose = useCallback(() => {
    setLightboxSrc(null);
    hoveredRef.current = false;
  }, []);

  // Duplicate photos for seamless loop
  const photos = [...COMMUNITY_PHOTOS, ...COMMUNITY_PHOTOS];

  return (
    <>
      <div
        style={{
          overflow: "hidden",
          marginLeft: isMobile ? "-24px" : "-80px",
          marginRight: isMobile ? "-24px" : "-80px",
        }}
        onMouseEnter={() => { hoveredRef.current = true; }}
        onMouseLeave={() => { if (!lightboxSrc) hoveredRef.current = false; }}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            gap: `${GAP}px`,
            alignItems: "center",
            willChange: "transform",
          }}
        >
          {photos.map((photo, i) => (
            <div
              key={`${photo}-${i}`}
              className="marquee-card"
              style={{
                width: isMobile ? "55vw" : "22vw",
                height: isMobile ? "35vh" : "38vh",
                flexShrink: 0,
                overflow: "hidden",
                borderRadius: "4px",
                cursor: EXPAND_CURSOR,
              }}
              onClick={() => handleExpand(`/${photo}.webp`)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/${photo}.webp`}
                alt=""
                className="marquee-card-img"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            onClick={handleClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              backgroundColor: "rgba(0, 0, 0, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: CLOSE_CURSOR,
              padding: isMobile ? "20px" : "60px",
            }}
          >
            <motion.img
              src={lightboxSrc}
              alt=""
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              style={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                borderRadius: "6px",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .marquee-card-img {
          transition: transform 700ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .marquee-card:hover .marquee-card-img {
          transform: scale(1.04);
        }
      `}</style>
    </>
  );
}

// ── Questions data ──────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    question: "How can homes better withstand future disasters?",
    // Minimal house + shield outline
    structural: [
      "M20 58L40 40L60 58",   // roof
      "M26 54V72H54V54",       // walls
      "M36 62H44V72H36Z",     // door
    ],
    accent: [
      "M40 18C40 18 58 26 58 46C58 58 40 68 40 68C40 68 22 58 22 46C22 26 40 18 40 18Z", // shield
    ],
  },
  {
    question: "How can rebuilding happen faster after loss?",
    // House with upward arrow
    structural: [
      "M20 58L40 40L60 58",   // roof
      "M26 54V72H54V54",       // walls
      "M36 62H44V72H36Z",     // door
    ],
    accent: [
      "M40 34V14",             // arrow shaft
      "M32 22L40 14L48 22",   // arrow head
    ],
  },
  {
    question: "How can families live with greater long-term security?",
    // House with single protective ring
    structural: [
      "M24 52L40 38L56 52",   // roof
      "M28 49V64H52V49",       // walls
      "M36 56H44V64H36Z",     // door
    ],
    accent: [
      "M40 12A30 30 0 1 1 39.99 12", // circle ring
    ],
  },
];

const EASE_OUT_QUINT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const COLUMN_STAGGER = 1500; // ms between each column reveal

// ── SVG draw-on illustration (brush stroke / hand-drawn texture) ─────────────
function DrawOnIllustration({
  structural,
  accent,
  size,
  active,
  filterId,
}: {
  structural: string[];
  accent: string[];
  size: number;
  active: boolean;
  filterId: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hand-drawn roughness filter */}
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.04"
            numOctaves={3}
            seed={7}
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale={1.8}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        {structural.map((d, i) => (
          <motion.path
            key={`s-${i}`}
            d={d}
            stroke="#4A3C24"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{
              pathLength: { duration: 0.8, ease: EASE_OUT_QUINT },
              opacity: { duration: 0.15 },
            }}
          />
        ))}
        {accent.map((d, i) => (
          <motion.path
            key={`a-${i}`}
            d={d}
            stroke="#B8965A"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{
              pathLength: { duration: 1.0, ease: EASE_OUT_QUINT, delay: 0.4 },
              opacity: { duration: 0.15, delay: 0.4 },
            }}
          />
        ))}
      </g>
    </svg>
  );
}

// ── Word blur-reveal variants ───────────────────────────────────────────────
const wordVariants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: EASE_OUT_QUINT,
      delay: 0.5 + i * 0.08,
      filter: { duration: 0.9, ease: EASE_OUT_QUINT, delay: 0.5 + i * 0.08 },
    },
  }),
};

// ── Staggered 3-column questions ────────────────────────────────────────────
function QuestionsGrid({ isMobile, revealedCount }: { isMobile: boolean; revealedCount: number }) {
  const svgSize = isMobile ? 56 : 72;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "36px" : "0",
        padding: isMobile ? "80px 24px 0" : "0 80px",
        width: "100%",
      }}
    >
      {QUESTIONS.map((q, colIndex) => {
        const isRevealed = colIndex < revealedCount;
        const words = q.question.split(" ");

        return (
          <motion.div
            key={colIndex}
            initial={{ opacity: 0, y: 40 }}
            animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
            style={{
              flex: "1 1 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "20px",
              padding: isMobile ? "0" : "0 40px 0 0",
              ...(isMobile || colIndex === QUESTIONS.length - 1
                ? {}
                : {
                    borderRight: "1px solid rgba(184, 150, 90, 0.15)",
                    marginRight: "40px",
                  }),
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isRevealed ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, ease: EASE_OUT_QUINT }}
            >
              <DrawOnIllustration
                structural={q.structural}
                accent={q.accent}
                size={svgSize}
                active={isRevealed}
                filterId={`brush-${colIndex}`}
              />
            </motion.div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-start",
                gap: isMobile ? "0 6px" : "0 8px",
                maxWidth: isMobile ? "280px" : "320px",
              }}
            >
              {words.map((word, i) => (
                <motion.span
                  key={`${colIndex}-${i}`}
                  custom={i}
                  variants={wordVariants}
                  initial="hidden"
                  animate={isRevealed ? "visible" : "hidden"}
                  style={{
                    display: "inline-block",
                    willChange: "filter, opacity, transform",
                    fontFamily: "'Alte Haas Grotesk', sans-serif",
                    fontSize: isMobile ? "22px" : "32px",
                    fontStyle: "normal",
                    fontWeight: 400,
                    color: "#4A3C24",
                    lineHeight: "130%",
                    letterSpacing: "-0.02em",
                    textAlign: "left",
                    WebkitFontSmoothing: "antialiased",
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Scroll-locked questions section ──────────────────────────────────────────
function QuestionsScrollSection({ isMobile }: { isMobile: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [revealedCount, setRevealedCount] = useState(0);
  const [inView, setInView] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Detect when the sticky section is in view
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-reveal questions one after another when in view
  useEffect(() => {
    if (!inView) return;
    if (revealedCount >= 3) return;

    // First one reveals immediately, then stagger every 1.2s
    const delay = revealedCount === 0 ? 300 : 1200;
    const timer = setTimeout(() => {
      setRevealedCount((c) => Math.min(c + 1, 3));
    }, delay);
    return () => clearTimeout(timer);
  }, [inView, revealedCount]);

  return (
    <div ref={containerRef} style={{ height: "300vh", position: "relative" }}>
      <div
        ref={stickyRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          backgroundColor: "#F8F2E4",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Questions — vertically centered */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <QuestionsGrid isMobile={isMobile} revealedCount={revealedCount} />
        </div>

        {/* Community photos marquee — anchored to bottom */}
        <div style={{ padding: isMobile ? "0 24px 0" : "0 80px 0" }}>
          <CommunityMarquee isMobile={isMobile} />
        </div>
      </div>
    </div>
  );
}

// ── Villa Reveal — full-bleed image → card split with text ──────────────────

const VILLA_IMAGES = [
  "/villa-image-0.webp",
  "/villa-image-1.webp",
  "/villa-image-2.webp",
  "/villa-image-3.webp",
  "/villa-image-4.webp",
  "/villa-image-5.webp",
];
const VILLA_CYCLE_MS = 4000;
const EASE_QUINT: [number, number, number, number] = [0.23, 1, 0.32, 1];

function VillaReveal({ isMobile }: { isMobile: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [textVisible, setTextVisible] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  // Phase 0→0.5: full-bleed image scrolls up as card
  // Phase 0.5→1: image shrinks to right, text reveals on left
  // Use left% to position the image — left:0 = full-bleed, left:40% = right-aligned
  const imageLeft = useTransform(
    scrollYProgress,
    isMobile ? [0, 1] : [0, 0.4, 0.7, 1],
    isMobile ? ["0%", "0%"] : ["0%", "0%", "45%", "45%"],
  );
  const imageRight = useTransform(
    scrollYProgress,
    isMobile ? [0, 1] : [0, 0.4, 0.7, 1],
    isMobile ? ["0px", "0px"] : ["0px", "0px", "0px", "0px"],
  );
  const imageHeight = useTransform(
    scrollYProgress,
    isMobile ? [0, 0.3, 0.5, 1] : [0, 0.4, 0.7, 1],
    isMobile ? ["100vh", "100vh", "50vh", "50vh"] : ["100vh", "100vh", "100vh", "100vh"],
  );
  const imageTop = useTransform(
    scrollYProgress,
    isMobile ? [0, 1] : [0, 0.4, 0.7, 1],
    isMobile ? ["0px", "0px"] : ["0px", "0px", "0px", "0px"],
  );
  const imageBorderRadius = useTransform(
    scrollYProgress,
    isMobile ? [0, 1] : [0, 0.4, 0.7, 1],
    isMobile ? ["0px", "0px"] : ["0px", "0px", "0px", "0px"],
  );
  const textOpacity = useTransform(
    scrollYProgress,
    isMobile ? [0, 0.5, 0.65] : [0, 0.45, 0.6],
    [0, 0, 1],
  );
  const textY = useTransform(
    scrollYProgress,
    isMobile ? [0, 0.5, 0.65] : [0, 0.45, 0.6],
    ["40px", "40px", "0px"],
  );

  // Track when text should be visible for blur-reveal trigger
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const threshold = isMobile ? 0.6 : 0.55;
      setTextVisible(v >= threshold);
    });
    return unsub;
  }, [scrollYProgress, isMobile]);

  // Auto-cycle images
  useEffect(() => {
    if (!textVisible) return;
    const interval = setInterval(() => {
      setImgIndex((prev) => (prev + 1) % VILLA_IMAGES.length);
    }, VILLA_CYCLE_MS);
    return () => clearInterval(interval);
  }, [textVisible]);

  return (
    <div
      ref={containerRef}
      style={{ height: isMobile ? "350vh" : "400vh", position: "relative" }}
    >
      {/* #ambition anchor moved to StorySection */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "#F8F2E4",
        }}
      >
        {/* Text — left side (desktop) or below (mobile) */}
        {!isMobile && (
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "45%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 60px 0 60px",
              zIndex: 1,
              opacity: textOpacity,
              y: textY,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <span
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#B8965A",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                The Vision
              </span>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "48px",
                  fontWeight: 400,
                  color: "#616D45",
                  lineHeight: "110%",
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                Developed by<br />ARYA Group,
              </h3>
              <div
                style={{
                  width: "40px",
                  height: "1px",
                  backgroundColor: "rgba(184, 150, 90, 0.4)",
                }}
              />
              <p
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: "20px",
                  fontWeight: 400,
                  color: "#4A3C24",
                  lineHeight: "160%",
                  margin: 0,
                  maxWidth: "420px",
                }}
              >
                VersaVilla is a first-of-its-kind residence that combines luxury
                architecture with advanced resilience, completed in under 6 months.
                More than a structure, it is a response to what was lost and a promise
                that communities can rebuild stronger, faster, and better than before.
              </p>
              {/* Image indicator dots */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginTop: "12px",
                }}
              >
                {VILLA_IMAGES.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setImgIndex(i)}
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: i === imgIndex ? "#B8965A" : "transparent",
                      border: `2px solid ${i === imgIndex ? "#B8965A" : "rgba(74, 60, 36, 0.25)"}`,
                      transition: "all 0.4s ease",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Image column — starts full-bleed, morphs to right card + thumbnails */}
        <motion.div
          style={{
            position: "absolute",
            top: imageTop,
            left: imageLeft,
            right: imageRight,
            height: imageHeight,
            overflow: "hidden",
            borderRadius: imageBorderRadius,
          }}
        >
          {VILLA_IMAGES.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`Versa Villa ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding={i === 0 ? "sync" : "async"}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                opacity: i === imgIndex ? 1 : 0,
                transition: "opacity 0.8s ease-in-out",
              }}
            />
          ))}
          {/* Gradient vignette at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "30%",
              background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.2))",
              pointerEvents: "none",
            }}
          />
        </motion.div>

        {/* Mobile: image top half, text bottom half — no overlap */}
        {isMobile && (
          <>
            {/* Cream background fills below image */}
            <motion.div
              style={{
                position: "absolute",
                top: "50vh",
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#F8F2E4",
                zIndex: 1,
                opacity: textOpacity,
              }}
            />
            <motion.div
              style={{
                position: "absolute",
                top: "50vh",
                left: 0,
                right: 0,
                padding: "20px 24px 32px",
                zIndex: 2,
                opacity: textOpacity,
                y: textY,
              }}
            >
              <span
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: "11px",
                  fontWeight: 400,
                  color: "#B8965A",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                The Vision
              </span>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "28px",
                  fontWeight: 400,
                  color: "#616D45",
                  lineHeight: "120%",
                  letterSpacing: "-0.02em",
                  margin: "0 0 12px",
                }}
              >
                Developed by ARYA Group,
              </h3>
              <div
                style={{
                  width: "32px",
                  height: "1px",
                  backgroundColor: "rgba(184, 150, 90, 0.4)",
                  marginBottom: "12px",
                }}
              />
              <p
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: "15px",
                  fontWeight: 400,
                  color: "#4A3C24",
                  lineHeight: "155%",
                  margin: 0,
                }}
              >
                VersaVilla is a first-of-its-kind residence that combines luxury
                architecture with advanced resilience, completed in under 6 months.
                More than a structure, it is a response to what was lost and a promise
                that communities can rebuild stronger, faster, and better than before.
              </p>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DestroyingSection() {
  const isMobile = useIsMobile();

  return (
    <>
      {/* ── Panel: Story ── */}
      <StorySection />

      {/* Slides OVER the StorySection's sticky content like a card */}
      <div style={{ position: "relative", zIndex: 2, marginTop: "-100vh" }}>
        {/* ── Panel: The Change — scroll-locked question reveal ── */}
        <QuestionsScrollSection isMobile={isMobile} />

        {/* ── Villa Reveal: full-bleed → card split ── */}
        <VillaReveal isMobile={isMobile} />
      </div>
    </>
  );
}
