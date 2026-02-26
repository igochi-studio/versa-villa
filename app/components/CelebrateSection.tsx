"use client";

import { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, motion } from "motion/react";

const OLIVE = "#616D45";

const cyclingImages = [
  "/community-1.webp",
  "/community-2.webp",
  "/community-3.webp",
  "/community-4.webp",
  "/community-5.webp",
  "/community-6.webp",
  "/community-7.webp",
];

export default function CelebrateSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const containerX = useTransform(
    scrollYProgress,
    [0, 0.15, 0.5, 0.55, 1],
    ["0vw", "0vw", "-100vw", "-100vw", "-100vw"]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((i) => (i + 1) % cyclingImages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ height: "300vh", position: "relative" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            x: containerX,
            display: "flex",
            width: "200vw",
            height: "100%",
          }}
        >
          {/* ── Panel 1 ── */}
          <div
            style={{
              width: "100vw",
              height: "100%",
              backgroundColor: OLIVE,
              padding: "80px 48px 40px 120px",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            {/* Tag line — small gap before image */}
            <p
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: "18px",
                fontWeight: 500,
                color: "#F8F2E4",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                margin: "0 0 40px 0",
              }}
            >
              [CELEBRATE WITH OUR FAMILY]
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/villa-dawn.webp"
              alt="VersaVilla evening view"
              style={{
                width: "90%",
                maxHeight: "58vh",
                objectFit: "cover",
                display: "block",
                borderRadius: "4px",
              }}
            />

            <p
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: "32px",
                fontWeight: 400,
                color: "#F8F2E4",
                lineHeight: "120%",
                letterSpacing: "-0.56px",
                textAlign: "justify",
                maxWidth: "640px",
                marginTop: "28px",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              VersaVilla stands as a moment of return. Not a structure but a
              response and a reflection of what was lost and what can still be
              rebuilt. It is a place where resilience is built into every detail.
              Where design responds to reality. Where a community begins to find
              its way back.
            </p>
          </div>

          {/* ── Panel 2 ── */}
          <div
            style={{
              width: "100vw",
              height: "100%",
              backgroundColor: OLIVE,
              padding: "80px 60px",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {/* Top left text */}
            <p
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: "32px",
                fontWeight: 400,
                color: "#F8F2E4",
                lineHeight: "120%",
                letterSpacing: "-0.56px",
                textAlign: "justify",
                maxWidth: "520px",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              This is our shared step toward renewal, and a vision for what the
              future of Pacific Palisades can become.
            </p>

            {/* Center quote — absolutely positioned */}
            <div
              style={{
                position: "absolute",
                top: "485px",
                left: "50%",
                transform: "translateX(-50%)",
                maxWidth: "520px",
              }}
            >
              <p
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#F8F2E4",
                  lineHeight: "120%",
                  letterSpacing: "-0.64px",
                  textAlign: "justify",
                  margin: 0,
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: "32px",
                    fontStyle: "italic",
                    fontWeight: 400,
                    lineHeight: "110%",
                    letterSpacing: "-0.8px",
                  }}
                >
                  &ldquo;T
                </span>
                ogether, we must remain strong, support one another, and rebuild.
              </p>
              <p
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#F8F2E4",
                  lineHeight: "110%",
                  letterSpacing: "-0.64px",
                  marginTop: "1.2em",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                ~ Ardie Tavangarian
              </p>
            </div>

            {/* Bottom right cycling image — natural dimensions */}
            <div
              style={{
                position: "absolute",
                bottom: "140px",
                right: "60px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cyclingImages[imageIndex]}
                alt="Construction progress"
                style={{
                  maxWidth: "280px",
                  maxHeight: "350px",
                  width: "auto",
                  height: "auto",
                  display: "block",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
