"use client";

export default function VisionSection() {
  return (
    <section
      style={{
        backgroundColor: "#F8F2E4",
        padding: "120px 60px",
        display: "flex",
        alignItems: "center",
        gap: "24px",
      }}
    >
      {/* Tree illustration — left column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tree-blowing.svg"
          alt="Wind-blown tree illustration"
          style={{
            width: "80%",
            display: "block",
          }}
        />
      </div>

      {/* Text — right column, fills full column width */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Alte Haas Grotesk', sans-serif",
            fontSize: "32px",
            fontWeight: 400,
            color: "#4A3C24",
            lineHeight: "110%",
            letterSpacing: "-0.64px",
            textAlign: "justify",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          Developed by <strong>ARYA Group</strong>, the vision is to rebuild
          communities at scale while maintaining architectural integrity and
          safety. The goal is not only to replace what was lost but to rebuild
          stronger neighborhoods for the future.
        </p>
      </div>
    </section>
  );
}
