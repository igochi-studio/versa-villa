"use client";

const FEATURES = [
  { src: "/sy-1.png", label: null },
  { src: "/sy-2.png", label: "FIRE\nPROTECTIVE\nCURTAIN" },
  { src: "/sy-3.png", label: "EXTERIOR\nWATER\nSPRINKLERS" },
  { src: "/sy-4.png", label: "ATLEAST\n4-HOUR\nFIRE RATED\nWALL" },
];

export default function SystemSection() {
  return (
    <section
      style={{
        backgroundColor: "#F7F5F0",
        position:        "relative",
      }}
    >
      {/* ── [THE SYSTEM] label — top right ── */}
      <div
        style={{
          padding:       "60px 60px 0 0",
          textAlign:     "right",
        }}
      >
        <span
          style={{
            fontFamily:    "var(--font-inter), sans-serif",
            fontSize:      "24px",
            fontWeight:    600,
            color:         "#B8965A",
            letterSpacing: "3.84px",
            textTransform: "uppercase",
          }}
        >
          [THE SYSTEM]
        </span>
      </div>

      {/* ── Main content: left features + right render ── */}
      <div
        style={{
          display:       "flex",
          flexDirection: "row",
          alignItems:    "stretch",
          padding:       "40px 40px 0 60px",
          gap:           "0px",
        }}
      >
        {/* Left column: feature items — stretch to match image height */}
        <div
          style={{
            flex:            "0 0 280px",
            display:         "flex",
            flexDirection:   "column",
            justifyContent:  "space-between",
          }}
        >
          {FEATURES.map((item, i) => (
            <div
              key={i}
              style={{
                display:      "flex",
                flexDirection: "row",
                alignItems:   "center",
                gap:          "16px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.label?.replace(/\n/g, " ") || "Building feature"}
                style={{
                  width:     i === 0 ? "140px" : i === 2 ? "120px" : "110px",
                  height:    "auto",
                  display:   "block",
                  flexShrink: 0,
                }}
              />
              {item.label && (
                <span
                  style={{
                    fontFamily:    "var(--font-inter), sans-serif",
                    fontSize:      "16px",
                    fontWeight:    500,
                    color:         "#4A3C24",
                    lineHeight:    "110%",
                    letterSpacing: "-0.32px",
                    whiteSpace:    "pre-line",
                  }}
                >
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Right: large 3D render */}
        <div style={{ flex: "1 1 auto" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sy-5.png"
            alt="VersaVilla fire protection system render"
            style={{
              width:     "100%",
              height:    "auto",
              display:   "block",
            }}
          />
        </div>
      </div>

      {/* ── View Process Archive link ── */}
      <div
        style={{
          padding:   "60px 40px 80px 0",
          textAlign: "right",
        }}
      >
        <a
          href="#"
          style={{
            fontFamily:      "var(--font-inter), sans-serif",
            fontSize:        "44px",
            fontWeight:      400,
            color:           "#414833",
            textDecoration:  "none",
            display:         "inline-flex",
            alignItems:      "center",
            gap:             "16px",
            borderBottom:    "2px solid #B8965A",
            paddingBottom:   "8px",
          }}
        >
          View Process Archive
          <span style={{ color: "#B8965A", fontSize: "44px" }}>→</span>
        </a>
      </div>
    </section>
  );
}
