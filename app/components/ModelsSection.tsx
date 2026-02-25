"use client";

import { useRef, useState, useCallback } from "react";

interface Model {
  number: string;
  image: string;
  stories: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  style: string;
}

const leftModels: Model[] = [
  { number: "001", image: "/villa-type-1.webp", stories: "2", bedrooms: "4", bathrooms: "5", area: "3,957", style: "MEDITERRANEAN" },
  { number: "003", image: "/villa-type-3.webp", stories: "3", bedrooms: "5", bathrooms: "6", area: "4,947", style: "MEDITERRANEAN" },
  { number: "005", image: "/villa-type-5.webp", stories: "3", bedrooms: "4", bathrooms: "6", area: "7,400", style: "MEDITERRANEAN" },
  { number: "007", image: "/villa-type-7.webp", stories: "1", bedrooms: "3", bathrooms: "4", area: "2,200", style: "MEDITERRANEAN" },
];

const rightModels: Model[] = [
  { number: "002", image: "/villa-type-2.webp", stories: "2", bedrooms: "4", bathrooms: "5", area: "4,147", style: "MODERN" },
  { number: "004", image: "/villa-type-4.webp", stories: "3", bedrooms: "5", bathrooms: "6", area: "4,947", style: "MODERN" },
  { number: "006", image: "/villa-type-6.webp", stories: "3", bedrooms: "4", bathrooms: "6", area: "7,400", style: "CAPE COD" },
  { number: "008", image: "/villa-type-8.webp", stories: "1", bedrooms: "3", bathrooms: "4", area: "2,200", style: "MODERN" },
];

function ModelCard({ model, expanded }: { model: Model; expanded: boolean }) {
  return (
    <div style={{ marginBottom: "120px", overflow: "hidden" }}>
      <div
        style={{
          display: "grid",
          gridTemplateRows: expanded ? "1fr" : "0fr",
          transition: "grid-template-rows 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "12px",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#4A3C24",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              [{model.number}]
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "#4A3C24",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              GROSS AREA : APPROX. {model.area} SF
            </span>
          </div>
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={model.image}
        alt={`VersaVilla Model ${model.number}`}
        style={{
          width: "100%",
          display: "block",
          borderRadius: "4px",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateRows: expanded ? "1fr" : "0fr",
          transition: "grid-template-rows 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginTop: "12px",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "#4A3C24",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <strong>{model.stories} STORIES</strong> : {model.bedrooms} BEDROOMS, {model.bathrooms} BATHROOMS
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#B8965A",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              {model.style}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModelsSection() {
  const [hovered, setHovered] = useState<"left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const side = x < rect.width / 2 ? "left" : "right";
    if (side !== hovered) setHovered(side);
  }, [hovered]);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
  }, []);

  const leftExpanded = hovered !== "right";
  const rightExpanded = hovered !== "left";

  return (
    <section style={{ backgroundColor: "#F7F5F0", padding: "80px 60px 0" }}>
      {/* Intro text — left-aligned */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          marginBottom: "48px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "32px",
            fontWeight: 400,
            color: "#4A3C24",
            lineHeight: "110%",
            letterSpacing: "-0.64px",
            textAlign: "justify",
            maxWidth: "calc(50% - 12px)",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          VersaVilla extends beyond a single home. The initiative introduces{" "}
          <strong>8 distinct home models</strong>, offering multiple
          architectural styles, configurations, and sizes designed for different
          needs and lifestyles.
        </p>
      </div>

      {/* Two-column container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          display: "flex",
          gap: "24px",
        }}
      >
        {/* Left column */}
        <div
          style={{
            flex: hovered === "left" ? 65 : hovered === "right" ? 35 : 50,
            minWidth: 0,
            transition: "flex 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {leftModels.map((model) => (
            <ModelCard key={model.number} model={model} expanded={leftExpanded} />
          ))}
        </div>

        {/* Right column */}
        <div
          style={{
            flex: hovered === "right" ? 65 : hovered === "left" ? 35 : 50,
            minWidth: 0,
            transition: "flex 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div style={{ paddingTop: "200px" }} />
          {rightModels.map((model) => (
            <ModelCard key={model.number} model={model} expanded={rightExpanded} />
          ))}
        </div>
      </div>
    </section>
  );
}
