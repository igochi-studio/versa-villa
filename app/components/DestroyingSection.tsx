"use client";

import { useRef, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import StorySection from "./StorySection";

/* ─────────────────────────────────────────────────────────────────────────────
 * DESTROYING SECTION — Content Panels (after burn)
 *
 * Burn transition now lives in DestroyingCosmos (same sticky container).
 * This component only renders the content panels that follow.
 * ─────────────────────────────────────────────────────────────────────────── */

export default function DestroyingSection() {
  const isMobile = useIsMobile();
  const flowerRef = useRef<HTMLVideoElement>(null);

  // ── Flower video autoplay when visible ─────────────────────────────────
  useEffect(() => {
    const flower = flowerRef.current;
    if (!flower) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && flower.paused) {
          flower.muted = true;
          flower.play().catch(() => {});
        } else if (!entry.isIntersecting && !flower.paused) {
          flower.pause();
          flower.currentTime = 0;
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(flower);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ── Panel: Story ── */}
      <StorySection />

      {/* ── Panel: The Change ── */}
      <section
        style={{
          backgroundColor: "#F8F2E4",
          padding: isMobile ? "60px 24px" : "80px 80px",
        }}
      >
        {/* Disaster text + label */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "20px" : "48px",
            marginBottom: isMobile ? "40px" : "60px",
          }}
        >
          <div style={{ flex: "0 0 auto", width: isMobile ? "100%" : "20%" }}>
            <span
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "#B8965A",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              [THE CHANGE]
            </span>
          </div>

          <div style={{ flex: "1 1 auto" }}>
            <p
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: isMobile ? "22px" : "32px",
                fontWeight: 400,
                color: "#1a1a1a",
                lineHeight: "110%",
                letterSpacing: "-0.02em",
                textAlign: "justify",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              The disaster revealed fundamental questions about how homes should be built going forward.
            </p>
          </div>
        </div>

        {/* Questions */}
        <div
          style={{
            maxWidth: isMobile ? "100%" : "600px",
            marginLeft: "auto",
            marginRight: isMobile ? "auto" : "80px",
            marginBottom: isMobile ? "40px" : "60px",
          }}
        >
          {[
            "How can homes better withstand future disasters?",
            "How can rebuilding happen faster after loss?",
            "How can families live with greater long-term security?",
          ].map((q, i) => (
            <p
              key={i}
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: isMobile ? "20px" : "32px",
                fontWeight: 400,
                color: "#1a1a1a",
                lineHeight: "110%",
                letterSpacing: "-0.02em",
                paddingBottom: "12px",
                marginBottom: "12px",
                borderBottom: "1px solid #B8965A",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              {q}
            </p>
          ))}
        </div>

        {/* Community photos — horizontal scroll row */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: isMobile ? "12px" : "24px",
            alignItems: "flex-end",
            overflowX: "auto",
            paddingBottom: "20px",
          }}
        >
          {[
            { src: "community-1", width: isMobile ? "50vw" : "20vw", height: isMobile ? "30vh" : "38vh" },
            { src: "community-2", width: isMobile ? "50vw" : "20vw", height: isMobile ? "38vh" : "52vh" },
            { src: "community-3", width: isMobile ? "50vw" : "20vw", height: isMobile ? "28vh" : "36vh" },
            { src: "community-4", width: isMobile ? "55vw" : "24vw", height: isMobile ? "34vh" : "44vh" },
            { src: "community-5", width: isMobile ? "55vw" : "24vw", height: isMobile ? "42vh" : "62vh" },
            { src: "community-6", width: isMobile ? "50vw" : "20vw", height: isMobile ? "36vh" : "50vh" },
            { src: "community-7", width: isMobile ? "52vw" : "22vw", height: isMobile ? "32vh" : "42vh" },
          ].map((photo) => (
            <div
              key={photo.src}
              style={{
                width: photo.width,
                height: photo.height,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/${photo.src}.webp`}
                alt=""
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
      </section>

      {/* ── Panel: The Answer ── */}
      <section
        style={{
          backgroundColor: "#F8F2E4",
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: isMobile ? "60px 24px 0" : "80px 80px 0",
        }}
      >
        {/* [THE ANSWER] caption — top left */}
        <div
          style={{
            alignSelf: "flex-start",
            marginBottom: "40px",
          }}
        >
          <span
            style={{
              fontFamily: "'Alte Haas Grotesk', sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#B8965A",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            [THE ANSWER]
          </span>
        </div>

        {/* Quote — centered */}
        <div
          style={{
            width: isMobile ? "100%" : "min(540px, 70vw)",
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontFamily: "'Alte Haas Grotesk', sans-serif",
              fontSize: isMobile ? "22px" : "32px",
              fontWeight: 400,
              color: "#4A3C24",
              lineHeight: "110%",
              letterSpacing: "-0.02em",
              textAlign: "justify",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: isMobile ? "22px" : "32px",
                fontStyle: "italic",
                fontWeight: 400,
                lineHeight: "110%",
                letterSpacing: "-0.8px",
              }}
            >
              &ldquo;T
            </span>
            he Pacific Palisades fire is a sobering reminder of how fragile everything we work so hard to create can be.
          </p>
          <p
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: isMobile ? "20px" : "32px",
              fontWeight: 400,
              color: "#4A3C24",
              lineHeight: "110%",
              letterSpacing: "-0.64px",
              marginTop: "1.2em",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            ~ Ardie Tavangarian
          </p>
        </div>

        {/* Flower animation — bottom center */}
        <div style={{ flex: "1 1 auto", display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%" }}>
          <video
            ref={flowerRef}
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            style={{
              width: isMobile ? "80vw" : "45vw",
              height: "auto",
              maxHeight: "48vh",
              objectFit: "contain",
            }}
          >
            <source src="/flower-animation-transparent.webm" type="video/webm" />
          </video>
        </div>
      </section>
    </>
  );
}
