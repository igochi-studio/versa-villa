"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

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
  const isMobile = useIsMobile();
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((i) => (i + 1) % cyclingImages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* ── Panel 1 ── */}
      <section
        style={{
          backgroundColor: OLIVE,
          padding: isMobile ? "60px 24px" : "80px 48px 80px 120px",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
            width: "100%",
            maxHeight: isMobile ? "40vh" : "58vh",
            objectFit: "cover",
            display: "block",
            borderRadius: "4px",
          }}
        />

        <p
          style={{
            fontFamily: "'Alte Haas Grotesk', sans-serif",
            fontSize: isMobile ? "clamp(22px, 3vw, 28px)" : "32px",
            fontWeight: 400,
            color: "#F8F2E4",
            lineHeight: "120%",
            letterSpacing: "-0.56px",
            textAlign: "justify",
            maxWidth: isMobile ? "clamp(100%, 85vw, 580px)" : "640px",
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
      </section>

      {/* ── Panel 2 ── */}
      <section
        style={{
          backgroundColor: OLIVE,
          padding: isMobile ? "60px 24px" : "80px 60px",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? "48px" : "60px",
        }}
      >
        <p
          style={{
            fontFamily: "'Alte Haas Grotesk', sans-serif",
            fontSize: isMobile ? "clamp(22px, 3vw, 28px)" : "32px",
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

        {/* Quote + cycling image row */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "flex-end",
            justifyContent: "space-between",
            gap: isMobile ? "48px" : "60px",
          }}
        >
          <div style={{ maxWidth: "520px" }}>
            <p
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: isMobile ? "clamp(22px, 3vw, 28px)" : "32px",
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
                  fontSize: isMobile ? "clamp(22px, 3vw, 28px)" : "32px",
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
                fontSize: isMobile ? "clamp(20px, 2.8vw, 28px)" : "32px",
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

          {/* Cycling image */}
          <div style={{ flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cyclingImages[imageIndex]}
              alt="Construction progress"
              style={{
                maxWidth: isMobile ? "200px" : "280px",
                maxHeight: isMobile ? "250px" : "350px",
                width: "auto",
                height: "auto",
                display: "block",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
