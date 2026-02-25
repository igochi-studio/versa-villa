"use client";

export default function AmbitionSection() {
  return (
    <section>
      {/* ── Full-width villa image with [VERSAVILLA] label ── */}
      <div
        style={{
          position: "relative",
          width:    "100%",
          height:   "100vh",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/villa-evening.webp"
          alt="VersaVilla at sunset"
          style={{
            position:       "absolute",
            inset:          0,
            width:          "100%",
            height:         "100%",
            objectFit:      "cover",
            objectPosition: "center center",
            display:        "block",
          }}
        />

        {/* [VERSAVILLA] label — centered */}
        <div
          style={{
            position:      "absolute",
            top:           "60px",
            left:          "50%",
            transform:     "translateX(-50%)",
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
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            [VERSAVILLA]
          </span>
        </div>
      </div>

      {/* ── Ambition text + illustration ── */}
      <div
        style={{
          backgroundColor: "#F7F5F0",
          padding:         "100px 80px 140px 100px",
          display:         "flex",
          flexDirection:   "row",
          justifyContent:  "space-between",
          alignItems:      "flex-end",
          position:        "relative",
          overflow:        "hidden",
          minHeight:       "54vh",
        }}
      >
        {/* Left: label + body */}
        <div style={{ maxWidth: "520px" }}>
          {/* [AMBITION] label */}
          <span
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontSize:      "14px",
              fontWeight:    600,
              color:         "#B8965A",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              display:       "block",
              marginBottom:  "40px",
            }}
          >
            [AMBITION]
          </span>

          {/* Body text */}
          <p
            style={{
              fontFamily:          "var(--font-inter), sans-serif",
              fontSize:            "28px",
              fontWeight:          400,
              color:               "#1a1a1a",
              lineHeight:          "130%",
              letterSpacing:       "-0.02em",
              textAlign:           "justify",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            VersaVilla was created from the vision of moving from reactive rebuilding to proactive design, creating housing prepared for the realities of modern living. A vision for future-ready homes began to take shape.
          </p>
        </div>

        {/* Right: ambition illustration */}
        <div
          style={{
            flex:      "0 0 auto",
            width:     "clamp(280px, 35vw, 500px)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ambition.svg"
            alt="Architectural sketch"
            style={{
              width:   "100%",
              height:  "auto",
              display: "block",
            }}
          />
        </div>
      </div>
    </section>
  );
}
