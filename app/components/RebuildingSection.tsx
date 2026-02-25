"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const IMAGES = [
  "/003_Bienvenida 1241_by mrbarcelo 5.png",
  "/003_Bienvenida 1241_by mrbarcelo 6.png",
  "/003_Bienvenida 1241_by mrbarcelo 7.png",
  "/003_Bienvenida 1241_by mrbarcelo 8.png",
  "/003_Bienvenida 1241_by mrbarcelo 9.png",
];

const AUTO_INTERVAL = 4000;

export default function RebuildingSection() {
  // offset controls which image is the hero.
  // hero = IMAGES[offset % 5]
  // thumbnails = next 4 in order: (offset+1)%5, (offset+2)%5, (offset+3)%5, (offset+4)%5
  const [offset, setOffset] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const heroIndex = offset % IMAGES.length;
  const thumbIndices = [1, 2, 3, 4].map((n) => (offset + n) % IMAGES.length);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOffset((prev) => prev + 1);
    }, AUTO_INTERVAL);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const handleThumbClick = (thumbPosition: number) => {
    // thumbPosition 0–3 → advance by (thumbPosition + 1) steps
    setOffset((prev) => prev + thumbPosition + 1);
    resetTimer();
  };

  return (
    <section
      style={{
        backgroundColor: "#F7F5F0",
        padding:         "80px 60px 80px 60px",
      }}
    >
      {/* ── Top row: body text left + [REBUILDING] label right ── */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-start",
          marginBottom:   "48px",
        }}
      >
        <p
          style={{
            fontFamily:          "var(--font-inter), sans-serif",
            fontSize:            "32px",
            fontWeight:          400,
            color:               "#4A3C24",
            lineHeight:          "110%",
            letterSpacing:       "-0.64px",
            textAlign:           "justify",
            maxWidth:            "520px",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          The first VersaVilla residence demonstrates a new approach to rebuilding by combining luxury architecture with advanced resilience. The answer required moving
        </p>

        <span
          style={{
            fontFamily:    "var(--font-inter), sans-serif",
            fontSize:      "24px",
            fontWeight:    600,
            color:         "#B8965A",
            letterSpacing: "3.84px",
            textTransform: "uppercase",
            flexShrink:    0,
          }}
        >
          [REBUILDING]
        </span>
      </div>

      {/* ── Hero image ── */}
      <div
        style={{
          position:     "relative",
          width:        "100%",
          aspectRatio:  "16 / 10",
          overflow:     "hidden",
          borderRadius: "4px",
        }}
      >
        {IMAGES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`VersaVilla view ${i + 1}`}
            style={{
              position:   "absolute",
              inset:      0,
              width:      "100%",
              height:     "100%",
              objectFit:  "cover",
              display:    "block",
              opacity:    i === heroIndex ? 1 : 0,
              transition: "opacity 0.6s ease-in-out",
            }}
          />
        ))}
      </div>

      {/* ── Thumbnail strip — 4 images, natural aspect ratio ── */}
      <div
        style={{
          display:        "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap:            "10px",
          marginTop:      "10px",
        }}
      >
        {thumbIndices.map((imgIndex, thumbPos) => (
          <div
            key={`thumb-${imgIndex}`}
            onClick={() => handleThumbClick(thumbPos)}
            style={{
              overflow:     "hidden",
              borderRadius: "4px",
              cursor:       "pointer",
              aspectRatio:  "4 / 3",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMAGES[imgIndex]}
              alt={`Thumbnail ${imgIndex + 1}`}
              style={{
                width:      "100%",
                height:     "100%",
                objectFit:  "cover",
                display:    "block",
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
