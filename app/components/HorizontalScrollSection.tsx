"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useTransform } from "motion/react";

// ── Cursors — show current audio state (click to toggle) ──────────────────
// Sound ON  → speaker with waves (click will mute)
const CURSOR_SOUND_ON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='23' fill='rgba(255,255,255,0.15)' stroke='white' stroke-width='1.5'/%3E%3Cpath d='M12 19h6l7-6v22l-7-6h-6z' fill='white'/%3E%3Cpath d='M31 18c1.5 1.5 2.5 3.5 2.5 6s-1 4.5-2.5 6' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3Cpath d='M34 14c3 3 4.5 7 4.5 10s-1.5 7-4.5 10' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\") 24 24, pointer";

// Sound OFF → speaker with X (click will unmute)
const CURSOR_SOUND_OFF =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='23' fill='rgba(255,255,255,0.15)' stroke='white' stroke-width='1.5'/%3E%3Cpath d='M12 19h6l7-6v22l-7-6h-6z' fill='white'/%3E%3Cline x1='31' y1='18' x2='41' y2='30' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='41' y1='18' x2='31' y2='30' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E\") 24 24, pointer";

export default function HorizontalScrollSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false); // sound on by default

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // ── Horizontal slide ────────────────────────────────────────────────────
  // 3 panels: hold P1, slide→P2, hold P2, slide→P3, hold P3
  const containerX = useTransform(
    scrollYProgress,
    [0, 0.13, 0.4, 0.47, 0.73, 1],
    ["0vw", "0vw", "-100vw", "-100vw", "-200vw", "-200vw"]
  );

  // ── Panel 1 contracts slightly as scroll begins ─────────────────────────
  const panel1Scale = useTransform(
    scrollYProgress,
    [0, 0.1],
    [1, 0.95]
  );

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

            {/* Quote — bottom left */}
            <div
              style={{
                position:      "absolute",
                left:          "140px",
                bottom:        "120px",
                zIndex:        10,
                pointerEvents: "none",
                width:         "min(601px, 82vw)",
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
            </div>
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

            {/* [HELL] chapter label */}
            <div
              style={{
                position:      "absolute",
                top:           "40px",
                left:          "40px",
                zIndex:        10,
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontFamily:    "var(--font-inter), sans-serif",
                  fontSize:      "14px",
                  fontWeight:    400,
                  color:         "#fff",
                  letterSpacing: "0.08em",
                  opacity:       0.9,
                }}
              >
                [HELL]
              </span>
            </div>
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
            {/* Top content area */}
            <div
              style={{
                display:       "flex",
                flexDirection: "row",
                padding:       "60px 80px 0 80px",
                gap:           "80px",
                flex:          "0 0 auto",
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
            </div>

            {/* Palisades illustration — fills remaining space */}
            <div
              style={{
                flex:     "1 1 auto",
                position: "relative",
                overflow: "hidden",
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
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
