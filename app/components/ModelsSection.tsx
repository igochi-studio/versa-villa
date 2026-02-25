"use client";

import { motion, useReducedMotion } from "motion/react";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — Models Section
 *
 * Trigger: viewport intersection (whileInView, once)
 *
 *  inView     intro text slides up 30px → 0, fades in
 *  +stagger   each card reveals per column:
 *               y 50→0, opacity 0→1, scale 0.96→1
 *               stagger 120ms between cards in same column
 *
 * Hover (per card, transform + opacity only):
 *    0ms      card lifts translateY -6px
 *             image zooms scale 1→1.03 (overflow:hidden)
 *             shadow fades in
 * ───────────────────────────────────────────────────────── */

// ── Entrance config ───────────────────────────────────────
const INTRO = {
  enterY:  30,      // px — text slides up from
  spring:  { type: "spring" as const, stiffness: 200, damping: 30 },
};

const CARD = {
  enterY:     50,     // px — card slides up from
  enterScale: 0.96,   // initial scale
  stagger:    0.12,   // seconds between cards in column
  spring:     { type: "spring" as const, stiffness: 260, damping: 28 },
};

// ── Hover config (transform-only, GPU-accelerated) ────────
const HOVER = {
  liftY:     -6,     // px
  imgScale:  1.03,   // image zoom
  spring:    { type: "spring" as const, stiffness: 400, damping: 25 },
};

// ── Data ──────────────────────────────────────────────────
interface Model {
  number: string;
  image: string;
  stories: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  style: string;
}

const LEFT_MODELS: Model[] = [
  { number: "001", image: "/villa-type-1.webp", stories: "2", bedrooms: "4", bathrooms: "5", area: "3,957", style: "MEDITERRANEAN" },
  { number: "003", image: "/villa-type-3.webp", stories: "3", bedrooms: "5", bathrooms: "6", area: "4,947", style: "MEDITERRANEAN" },
  { number: "005", image: "/villa-type-5.webp", stories: "3", bedrooms: "4", bathrooms: "6", area: "7,400", style: "MEDITERRANEAN" },
  { number: "007", image: "/villa-type-7.webp", stories: "1", bedrooms: "3", bathrooms: "4", area: "2,200", style: "MEDITERRANEAN" },
];

const RIGHT_MODELS: Model[] = [
  { number: "002", image: "/villa-type-2.webp", stories: "2", bedrooms: "4", bathrooms: "5", area: "4,147", style: "MODERN" },
  { number: "004", image: "/villa-type-4.webp", stories: "3", bedrooms: "5", bathrooms: "6", area: "4,947", style: "MODERN" },
  { number: "006", image: "/villa-type-6.webp", stories: "3", bedrooms: "4", bathrooms: "6", area: "7,400", style: "CAPE COD" },
  { number: "008", image: "/villa-type-8.webp", stories: "1", bedrooms: "3", bathrooms: "4", area: "2,200", style: "MODERN" },
];

// ── Card component ────────────────────────────────────────
function ModelCard({ model, index }: { model: Model; index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      style={{ marginBottom: "100px", willChange: "transform" }}
      initial={shouldReduceMotion ? false : {
        opacity: 0,
        y: CARD.enterY,
        scale: CARD.enterScale,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        ...CARD.spring,
        delay: index * CARD.stagger,
      }}
    >
      {/* Hover wrapper — lifts card, adds shadow (transform-only) */}
      <motion.div
        whileHover="hovered"
        initial="idle"
        style={{ cursor: "default" }}
      >
        {/* Header: number + area */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "baseline",
            marginBottom:   "12px",
            fontFamily:     "var(--font-inter), sans-serif",
          }}
        >
          <span
            style={{
              fontSize:      "20px",
              fontWeight:    700,
              color:         "#4A3C24",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            [{model.number}]
          </span>
          <span
            style={{
              fontSize:      "14px",
              fontWeight:    400,
              color:         "#4A3C24",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            GROSS AREA : APPROX. {model.area} SF
          </span>
        </div>

        {/* Image — zoom on hover via variant, clipped by overflow:hidden */}
        <motion.div
          variants={{
            idle:    { y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" },
            hovered: { y: HOVER.liftY, boxShadow: "0 16px 48px rgba(0,0,0,0.10)" },
          }}
          transition={HOVER.spring}
          style={{ overflow: "hidden", borderRadius: "4px" }}
        >
          <motion.img
            src={model.image}
            alt={`VersaVilla Model ${model.number}`}
            variants={{
              idle:    { scale: 1 },
              hovered: { scale: HOVER.imgScale },
            }}
            transition={HOVER.spring}
            style={{
              width:   "100%",
              display: "block",
            }}
          />
        </motion.div>

        {/* Footer: specs + style */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "baseline",
            marginTop:      "12px",
            fontFamily:     "var(--font-inter), sans-serif",
          }}
        >
          <span
            style={{
              fontSize:      "14px",
              fontWeight:    400,
              color:         "#4A3C24",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <strong>{model.stories} STORIES</strong> : {model.bedrooms} BEDROOMS, {model.bathrooms} BATHROOMS
          </span>
          <span
            style={{
              fontSize:      "20px",
              fontWeight:    700,
              color:         "#B8965A",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              whiteSpace:    "nowrap",
            }}
          >
            {model.style}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────────
export default function ModelsSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section style={{ backgroundColor: "#F7F5F0", padding: "80px 60px 0" }}>
      {/* Intro text — slides up on scroll */}
      <motion.div
        style={{
          display:        "flex",
          justifyContent: "flex-start",
          marginBottom:   "48px",
        }}
        initial={shouldReduceMotion ? false : { opacity: 0, y: INTRO.enterY }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={INTRO.spring}
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
            maxWidth:            "calc(50% - 12px)",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          VersaVilla extends beyond a single home. The initiative introduces{" "}
          <strong>8 distinct home models</strong>, offering multiple
          architectural styles, configurations, and sizes designed for different
          needs and lifestyles.
        </p>
      </motion.div>

      {/* Two-column grid — fixed 50/50, no layout animation */}
      <div
        style={{
          display: "flex",
          gap:     "24px",
        }}
      >
        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {LEFT_MODELS.map((model, i) => (
            <ModelCard key={model.number} model={model} index={i} />
          ))}
        </div>

        {/* Right column — offset for masonry effect */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: "200px" }}>
          {RIGHT_MODELS.map((model, i) => (
            <ModelCard key={model.number} model={model} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
