"use client";

export default function ConstructionSection() {
  return (
    <section
      style={{
        backgroundColor: "#F8F2E4",
        padding: "80px 60px",
      }}
    >
      {/* Text — right-aligned */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "48px",
        }}
      >
        <p
          style={{
            fontFamily: "'Alte Haas Grotesk', sans-serif",
            fontSize: "32px",
            fontWeight: 400,
            color: "#4A3C24",
            lineHeight: "110%",
            letterSpacing: "-0.64px",
            textAlign: "justify",
            maxWidth: "520px",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          Completed in less than <strong>6 months</strong>, the project
          represents how recovery can be accelerated without compromising
          quality or design. It stands as proof of what rebuilding can become.
        </p>
      </div>

      {/* Construction image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/villa-construction.webp"
        alt="VersaVilla under construction"
        style={{
          width: "100%",
          display: "block",
          borderRadius: "4px",
        }}
      />
    </section>
  );
}
