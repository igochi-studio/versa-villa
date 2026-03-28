"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";

const VILLA_IMAGES = [
  "/villa-image-0.webp",
  "/villa-image-1.webp",
  "/villa-image-2.webp",
  "/villa-image-3.webp",
  "/villa-image-4.webp",
  "/villa-image-5.webp",
];
const VILLA_CYCLE_MS = 4000;

export default function VisionV2() {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [textVisible, setTextVisible] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  // Desktop: full-bleed → slide right → long hold → re-expand to full-bleed
  const imageLeft = useTransform(
    scrollYProgress,
    isMobile ? [0, 1] : [0, 0.2, 0.35, 0.8, 0.95, 1],
    isMobile ? ["0%", "0%"] : ["0%", "0%", "42%", "42%", "0%", "0%"]
  );
  const imageHeight = useTransform(
    scrollYProgress,
    isMobile ? [0, 0.3, 0.5, 1] : [0, 1],
    isMobile ? ["100vh", "100vh", "50vh", "50vh"] : ["100vh", "100vh"]
  );

  // Text fades in as image slides right, fades out as image re-expands
  const textOpacity = useTransform(
    scrollYProgress,
    isMobile ? [0, 0.3, 0.4, 1] : [0, 0.28, 0.4, 0.8, 0.92],
    isMobile ? [0, 0, 1, 1] : [0, 0, 1, 1, 0]
  );
  const textY = useTransform(
    scrollYProgress,
    isMobile ? [0, 0.3, 0.4] : [0, 0.28, 0.4],
    ["50px", "50px", "0px"]
  );
  const textBlur = useTransform(
    scrollYProgress,
    isMobile ? [0, 0.3, 0.45] : [0, 0.28, 0.45, 0.8, 0.92],
    isMobile
      ? ["blur(8px)", "blur(8px)", "blur(0px)"]
      : ["blur(8px)", "blur(8px)", "blur(0px)", "blur(0px)", "blur(6px)"]
  );

  // Track when text is visible — jump to team photo (index 1) on reveal
  useEffect(() => {
    let hasJumped = false;
    const unsub = scrollYProgress.on("change", (v) => {
      const threshold = isMobile ? 0.5 : 0.4;
      const visible = v >= threshold;
      setTextVisible(visible);
      if (visible && !hasJumped) {
        hasJumped = true;
        setImgIndex(1);
      }
    });
    return unsub;
  }, [scrollYProgress, isMobile]);

  // Auto-cycle images once text is visible
  useEffect(() => {
    if (!textVisible) return;
    const interval = setInterval(() => {
      setImgIndex((prev) => (prev + 1) % VILLA_IMAGES.length);
    }, VILLA_CYCLE_MS);
    return () => clearInterval(interval);
  }, [textVisible]);

  return (
    <div
      id="vision"
      ref={containerRef}
      style={{
        height: isMobile ? "350vh" : "500vh",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "#F8F2E4",
        }}
      >
        {/* ── Text — left side (desktop) ── */}
        {!isMobile && (
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "42%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 80px 0 60px",
              zIndex: 1,
              opacity: textOpacity,
              y: textY,
              filter: textBlur,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: "11px",
                  fontWeight: 400,
                  color: "#616D45",
                  letterSpacing: "5px",
                  textTransform: "uppercase",
                }}
              >
                THE VISION
              </span>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "48px",
                  fontWeight: 400,
                  color: "#4A3C24",
                  lineHeight: "115%",
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                Developed by
                <br />
                ARYA Group,
              </h3>
              <div
                style={{
                  width: "48px",
                  height: "2px",
                  backgroundColor: "rgba(184, 150, 90, 0.5)",
                }}
              />
              <p
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: "18px",
                  fontWeight: 400,
                  color: "#4A3C24",
                  lineHeight: "170%",
                  margin: 0,
                  maxWidth: "400px",
                  opacity: 0.7,
                }}
              >
                VersaVilla is a first-of-its-kind residence that combines luxury
                architecture with advanced resilience, completed in under 6
                months. More than a structure, it is a response to what was lost
                and a promise that communities can rebuild stronger, faster, and
                better than before.
              </p>
              {/* Pagination dots */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginTop: "8px",
                }}
              >
                {VILLA_IMAGES.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setImgIndex(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setImgIndex(i);
                    }}
                    style={{
                      width: i === imgIndex ? "10px" : "7px",
                      height: i === imgIndex ? "10px" : "7px",
                      borderRadius: "50%",
                      backgroundColor:
                        i === imgIndex ? "#B8965A" : "transparent",
                      border: `1.5px solid ${i === imgIndex ? "#B8965A" : "rgba(74, 60, 36, 0.25)"}`,
                      transition:
                        "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Image — starts full-bleed, slides to right ── */}
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: imageLeft,
            right: 0,
            height: imageHeight,
            overflow: "hidden",
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
                transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          ))}
          {/* Bottom vignette */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "25%",
              background:
                "linear-gradient(to bottom, transparent, rgba(0,0,0,0.15))",
              pointerEvents: "none",
            }}
          />
        </motion.div>

        {/* ── Mobile: text below image ── */}
        {isMobile && (
          <>
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
                padding: "24px 24px 32px",
                zIndex: 2,
                opacity: textOpacity,
                y: textY,
                filter: textBlur,
              }}
            >
              <span
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: "10px",
                  fontWeight: 400,
                  color: "#616D45",
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "14px",
                }}
              >
                THE VISION
              </span>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "28px",
                  fontWeight: 400,
                  color: "#4A3C24",
                  lineHeight: "120%",
                  letterSpacing: "-0.02em",
                  margin: "0 0 14px",
                }}
              >
                Developed by ARYA Group,
              </h3>
              <div
                style={{
                  width: "36px",
                  height: "1.5px",
                  backgroundColor: "rgba(184, 150, 90, 0.5)",
                  marginBottom: "14px",
                }}
              />
              <p
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: "15px",
                  fontWeight: 400,
                  color: "#4A3C24",
                  lineHeight: "165%",
                  margin: 0,
                  opacity: 0.7,
                }}
              >
                VersaVilla is a first-of-its-kind residence that combines luxury
                architecture with advanced resilience, completed in under 6
                months. More than a structure, it is a response to what was lost
                and a promise that communities can rebuild stronger, faster, and
                better than before.
              </p>
              {/* Mobile dots */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "20px",
                }}
              >
                {VILLA_IMAGES.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setImgIndex(i)}
                    style={{
                      width: i === imgIndex ? "9px" : "6px",
                      height: i === imgIndex ? "9px" : "6px",
                      borderRadius: "50%",
                      backgroundColor:
                        i === imgIndex ? "#B8965A" : "transparent",
                      border: `1.5px solid ${i === imgIndex ? "#B8965A" : "rgba(74, 60, 36, 0.25)"}`,
                      transition:
                        "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
