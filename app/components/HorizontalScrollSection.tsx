"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — Horizontal Scroll
 *
 * scrollYProgress 0→1 over 400vh of vertical scroll.
 * 3 panels slide left; content within each panel has
 * parallax offsets and opacity fades for depth.
 *
 *  0.00→0.13  P1 holds — quote visible, scale 1→0.95
 *  0.13→0.40  Slide P1→P2 — quote lags left (parallax), fades out
 *  0.30→0.42  P2 [HELL] label fades in + drifts up
 *  0.40→0.47  P2 holds — video playing
 *  0.47→0.73  Slide P2→P3 — P3 text parallax from right
 *  0.55→0.70  P3 caption + body text fade in
 *  0.55→0.90  P3 illustration drifts up subtly
 *  0.73→1.00  P3 holds — illustration visible
 * ───────────────────────────────────────────────────────── */

// ── Scroll keyframes ──────────────────────────────────────────────────────
const SCROLL = {
  p1HoldEnd:     0.13,   // P1 stops holding, slide begins
  slideP1P2End:  0.40,   // P1→P2 slide completes
  p2HoldEnd:     0.47,   // P2 stops holding, slide begins
  slideP2P3End:  0.73,   // P2→P3 slide completes
};

// ── Panel 1 config ────────────────────────────────────────────────────────
const P1 = {
  scaleFrom:      1,       // resting scale
  scaleTo:        0.95,    // contracted as slide begins
  quoteParallaxX: -40,     // px — quote lags left during exit
};

// ── Panel 2 config ────────────────────────────────────────────────────────
const P2 = {
  labelDriftY: 8,          // px — [HELL] label drifts up from
};

// ── Panel 3 config ────────────────────────────────────────────────────────
const P3 = {
  textParallaxX:  50,      // px — text enters from right
  illustrationY:  20,      // px — illustration drifts up from
};

// ── Cursors — show current audio state (click to toggle) ──────────────────
const CURSOR_SOUND_ON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='23' fill='rgba(255,255,255,0.15)' stroke='white' stroke-width='1.5'/%3E%3Cpath d='M12 19h6l7-6v22l-7-6h-6z' fill='white'/%3E%3Cpath d='M31 18c1.5 1.5 2.5 3.5 2.5 6s-1 4.5-2.5 6' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3Cpath d='M34 14c3 3 4.5 7 4.5 10s-1.5 7-4.5 10' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\") 24 24, pointer";

const CURSOR_SOUND_OFF =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='23' fill='rgba(255,255,255,0.15)' stroke='white' stroke-width='1.5'/%3E%3Cpath d='M12 19h6l7-6v22l-7-6h-6z' fill='white'/%3E%3Cline x1='31' y1='18' x2='41' y2='30' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='41' y1='18' x2='31' y2='30' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E\") 24 24, pointer";

export default function HorizontalScrollSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // ── Horizontal slide ────────────────────────────────────────────────────
  const containerX = useTransform(
    scrollYProgress,
    [0, SCROLL.p1HoldEnd, SCROLL.slideP1P2End, SCROLL.p2HoldEnd, SCROLL.slideP2P3End, 1],
    ["0vw", "0vw", "-100vw", "-100vw", "-200vw", "-200vw"]
  );

  // ── Panel 1: scale + quote parallax ─────────────────────────────────────
  const panel1Scale  = useTransform(scrollYProgress, [0, 0.10], [P1.scaleFrom, P1.scaleTo]);
  const p1QuoteX     = useTransform(scrollYProgress, [SCROLL.p1HoldEnd, SCROLL.slideP1P2End], [0, P1.quoteParallaxX]);
  const p1QuoteOp    = useTransform(scrollYProgress, [SCROLL.p1HoldEnd, 0.30], [1, 0]);

  // ── Panel 2: label entrance ─────────────────────────────────────────────
  const p2LabelOp    = useTransform(scrollYProgress, [0.30, 0.42], [0, 1]);
  const p2LabelY     = useTransform(scrollYProgress, [0.30, 0.42], [P2.labelDriftY, 0]);

  // ── Panel 3: text parallax + illustration drift ─────────────────────────
  const p3TextX      = useTransform(scrollYProgress, [SCROLL.p2HoldEnd, SCROLL.slideP2P3End], [P3.textParallaxX, 0]);
  const p3TextOp     = useTransform(scrollYProgress, [0.55, 0.70], [0, 1]);
  const p3IllustY    = useTransform(scrollYProgress, [0.55, 0.90], [P3.illustrationY, -10]);

  // ── Video: autoplay with sound when Panel 2 comes into view ────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    return scrollYProgress.on("change", (v) => {
      // Panel 2 is ~50% in view at scrollYProgress ~0.5
      if (v > 0.3 && v < 0.55 && video.paused) {
        video.currentTime = 0;
        video.muted = false;
        video
          .play()
          .then(() => setIsMuted(false))
          .catch(() => {
            // Browser blocked unmuted autoplay — fall back to muted
            video.muted = true;
            video.play().then(() => setIsMuted(true)).catch(() => {});
          });
      }
      // Pause when scrolling away from Panel 2
      if ((v < 0.1 || v > 0.7) && !video.paused) {
        video.pause();
        if (v < 0.1) video.currentTime = 0;
      }
    });
  }, [scrollYProgress]);

  const handleVideoClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ height: "400vh", position: "relative", zIndex: 2 }}
    >
      {/* Sticky viewport — overflow:hidden is what prevents panel overlap */}
      <div
        style={{
          position:        "sticky",
          top:             0,
          height:          "100vh",
          overflow:        "hidden",
          backgroundColor: "#000",
        }}
      >
        {/* Flex container — 300vw wide, slides left via x transform */}
        <motion.div
          style={{
            display:       "flex",
            flexDirection: "row",
            width:         "300vw",
            height:        "100vh",
            x:             containerX,
          }}
        >

          {/* ── Panel 1: After image + quote + logo ── */}
          <motion.div
            style={{
              width:           "100vw",
              height:          "100vh",
              flexShrink:      0,
              position:        "relative",
              scale:           panel1Scale,
              transformOrigin: "center center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/palisades-after.webp"
              alt=""
              style={{
                position:      "absolute",
                inset:         0,
                width:         "100%",
                height:        "100%",
                objectFit:     "cover",
                filter:        "brightness(0.4)",
                pointerEvents: "none",
              }}
            />

            {/* Versa Villa logo — top center */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/versa-villa-logo.svg"
              alt="Versa Villa"
              style={{
                position:      "absolute",
                top:           "40px",
                left:          "50%",
                transform:     "translateX(-50%)",
                height:        "48px",
                width:         "auto",
                zIndex:        10,
                pointerEvents: "none",
              }}
            />

            {/* Quote — bottom left, parallax lag on exit */}
            <motion.div
              style={{
                position:      "absolute",
                left:          "140px",
                bottom:        "120px",
                zIndex:        10,
                pointerEvents: "none",
                width:         "min(601px, 82vw)",
                x:             p1QuoteX,
                opacity:       p1QuoteOp,
              }}
            >
              <p
                style={{
                  fontFamily:          "var(--font-inter), sans-serif",
                  fontSize:            "32px",
                  fontWeight:          400,
                  color:               "#F7F5F0",
                  lineHeight:          "120%",
                  letterSpacing:       "-0.64px",
                  textAlign:           "justify",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                <span
                  style={{
                    fontFamily:    "var(--font-playfair), serif",
                    fontSize:      "40px",
                    fontStyle:     "italic",
                    fontWeight:    400,
                    lineHeight:    "110%",
                    letterSpacing: "-0.8px",
                  }}
                >
                  &ldquo;T
                </span>
                his tragedy marks one of the most heartbreaking days of our career. Witnessing incredible buildings, cherished memories, and vibrant lives reduced to ashes is beyond devastating.&rdquo;
              </p>
              <p
                style={{
                  fontFamily:          "var(--font-playfair), serif",
                  fontSize:            "32px",
                  fontWeight:          400,
                  color:               "#F7F5F0",
                  lineHeight:          "110%",
                  letterSpacing:       "-0.64px",
                  marginTop:           "1.2em",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                ~ Ardie Tavangarian
              </p>
            </motion.div>
          </motion.div>

          {/* ── Panel 2: Video ── */}
          <div
            style={{
              width:           "100vw",
              height:          "100vh",
              flexShrink:      0,
              position:        "relative",
              backgroundColor: "#000",
              cursor:          isMuted ? CURSOR_SOUND_OFF : CURSOR_SOUND_ON,
            }}
            onClick={handleVideoClick}
          >
            <video
              ref={videoRef}
              loop
              playsInline
              preload="auto"
              style={{
                position:  "absolute",
                inset:     0,
                width:     "100%",
                height:    "100%",
                objectFit: "cover",
                display:   "block",
              }}
            >
              <source src="/versa-villa-intro-movie.mp4" type="video/mp4" />
            </video>

            {/* [HELL] chapter label — drifts up as panel enters */}
            <motion.div
              style={{
                position:      "absolute",
                top:           "40px",
                left:          "40px",
                zIndex:        10,
                pointerEvents: "none",
                opacity:       p2LabelOp,
                y:             p2LabelY,
              }}
            >
              <span
                style={{
                  fontFamily:    "var(--font-inter), sans-serif",
                  fontSize:      "14px",
                  fontWeight:    400,
                  color:         "#fff",
                  letterSpacing: "0.08em",
                }}
              >
                [HELL]
              </span>
            </motion.div>
          </div>

          {/* ── Panel 3: It's Personal ── */}
          <div
            style={{
              width:           "100vw",
              height:          "100vh",
              flexShrink:      0,
              position:        "relative",
              backgroundColor: "#F7F5F0",
              display:         "flex",
              flexDirection:   "column",
            }}
          >
            {/* Top content area — parallax entrance from right */}
            <motion.div
              style={{
                display:       "flex",
                flexDirection: "row",
                padding:       "60px 80px 0 80px",
                gap:           "80px",
                flex:          "0 0 auto",
                x:             p3TextX,
                opacity:       p3TextOp,
              }}
            >
              {/* Caption */}
              <div style={{ flex: "0 0 auto", paddingTop: "8px" }}>
                <span
                  style={{
                    fontFamily:    "var(--font-inter), sans-serif",
                    fontSize:      "14px",
                    fontWeight:    600,
                    color:         "#B8965A",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    whiteSpace:    "nowrap",
                  }}
                >
                  [IT&apos;S PERSONAL]
                </span>
              </div>

              {/* Body text */}
              <div style={{ maxWidth: "540px" }}>
                <p
                  style={{
                    fontFamily:          "var(--font-inter), sans-serif",
                    fontSize:            "32px",
                    fontWeight:          400,
                    color:               "#1a1a1a",
                    lineHeight:          "110%",
                    letterSpacing:       "-0.02em",
                    textAlign:           "justify",
                    WebkitFontSmoothing: "antialiased",
                  }}
                >
                  For more than 3 decades, Ardie Tavangarian and his team helped shape Pacific Palisades, designing and building homes throughout the neighborhood.{" "}
                  <span
                    style={{
                      fontFamily: "var(--font-playfair), serif",
                      fontStyle:  "italic",
                      fontWeight: 400,
                    }}
                  >
                    When the fires destroyed his own home,
                  </span>{" "}
                  the place where he raised his children, the loss became deeply personal. In the aftermath came reflection, and a clear conviction: rebuilding should not simply replace what was lost. It should create something stronger, more resilient, and worthy of the community&apos;s trust.
                </p>
              </div>
            </motion.div>

            {/* Palisades illustration — fills remaining space, drifts up */}
            <motion.div
              style={{
                flex:     "1 1 auto",
                position: "relative",
                overflow: "hidden",
                y:        p3IllustY,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/palisades.svg"
                alt="Pacific Palisades coastline illustration"
                style={{
                  position:  "absolute",
                  bottom:    0,
                  left:      0,
                  width:     "100%",
                  height:    "auto",
                  maxHeight: "100%",
                  objectFit: "contain",
                  objectPosition: "bottom left",
                }}
              />
            </motion.div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
