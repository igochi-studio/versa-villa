"use client";

const FEATURES = [
  { src: "/system-1.webp", label: null },
  { src: "/system-2.webp", label: "FIRE\nPROTECTIVE\nCURTAIN" },
  { src: "/system-3.webp", label: "EXTERIOR\nWATER\nSPRINKLERS" },
  { src: "/system-4.webp", label: "ATLEAST\n4-HOUR\nFIRE RATED\nWALL" },
];

export default function SystemSection() {
  return (
    <section
      style={{
        backgroundColor: "#F8F2E4",
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
            fontFamily:    "'Alte Haas Grotesk', sans-serif",
            fontSize:      "18px",
            fontWeight:    700,
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
                    fontFamily:    "'Alte Haas Grotesk', sans-serif",
                    fontSize:      "18px",
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
            src="/system-5.webp"
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
            fontFamily:      "'Alte Haas Grotesk', sans-serif",
            fontSize:        "32px",
            fontWeight:      400,
            color:           "#616D45",
            textDecoration:  "none",
            display:         "inline-flex",
            alignItems:      "center",
            gap:             "16px",
            borderBottom:    "2px solid #B8965A",
            paddingBottom:   "8px",
          }}
        >
          View Process Archive
          <span style={{ color: "#B8965A", fontSize: "32px" }}>→</span>
        </a>
      </div>
    </section>
  );
}
