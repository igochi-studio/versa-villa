"use client";

import { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

const OLIVE = "#414833";

const cyclingImages = [
  "/c-1.png",
  "/c-2.png",
  "/c-3.png",
  "/c-4.png",
  "/c-5.png",
  "/c-6.png",
  "/c-7.png",
];

export default function CelebrateSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Horizontal slide: hold panel 1, slide to panel 2, hold panel 2
  const containerX = useTransform(
    scrollYProgress,
    [0, 0.15, 0.5, 0.55, 1],
    ["0vw", "0vw", "-100vw", "-100vw", "-100vw"]
  );

  // Cycle images every 1.5s
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
              padding: "48px 60px",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            {/* Tag line */}
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "#F7F5F0",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: "24px",
              }}
            >
              [CELEBRATE WITH OUR FAMILY]
            </p>

            {/* Main image — constrained to ~55vh so text fits below */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/versa villa dawn.png"
              alt="VersaVilla evening view"
              style={{
                width: "80%",
                maxHeight: "55vh",
                objectFit: "cover",
                display: "block",
                borderRadius: "4px",
              }}
            />

            {/* Body text below image */}
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "32px",
                fontWeight: 400,
                color: "#F7F5F0",
                lineHeight: "110%",
                letterSpacing: "-0.64px",
                textAlign: "justify",
                maxWidth: "698px",
                marginTop: "32px",
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
              padding: "48px 60px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {/* Top left text */}
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "32px",
                fontWeight: 400,
                color: "#F7F5F0",
                lineHeight: "110%",
                letterSpacing: "-0.64px",
                textAlign: "justify",
                maxWidth: "520px",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              This is our shared step toward renewal, and a vision for what the
              future of Pacific Palisades can become.
            </p>

            {/* Center quote */}
            <div
              style={{
                alignSelf: "center",
                maxWidth: "520px",
              }}
            >
              <p
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "28px",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "#F7F5F0",
                  lineHeight: "130%",
                  textAlign: "justify",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                &ldquo;<span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "36px", fontStyle: "italic" }}>T</span>ogether,
                we must remain strong, support one another, and rebuild.
              </p>
              <p
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "20px",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "#F7F5F0",
                  marginTop: "16px",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                ~ Ardie Tavangarian
              </p>
            </div>

            {/* Bottom right cycling image */}
            <div
              style={{
                alignSelf: "flex-end",
                width: "280px",
                height: "280px",
                borderRadius: "4px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cyclingImages[imageIndex]}
                alt="Construction progress"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
