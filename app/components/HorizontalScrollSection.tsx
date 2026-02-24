"use client";

import { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

// Each panel is 100vw wide. Add more panels here as content is built out.
const PANELS = [
  { id: "panel-1", label: "Panel 1" },
  { id: "panel-2", label: "Panel 2" },
  { id: "panel-3", label: "Panel 3" },
  { id: "panel-4", label: "Panel 4" },
];

const PANEL_COUNT = PANELS.length;

export default function HorizontalScrollSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Section height = (number of panels) × 100vh so each panel gets one
  // full viewport-height of vertical scroll distance.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Map 0→1 scroll to 0 → -(total width - 1 viewport)
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0vw", `${-(PANEL_COUNT - 1) * 100}vw`],
  );

  return (
    <section
      ref={sectionRef}
      style={{ height: `${PANEL_COUNT * 100}vh` }}
    >
      {/* Sticky viewport that pins while we "scroll" horizontally */}
      <div
        style={{
          position:   "sticky",
          top:        0,
          height:     "100vh",
          overflow:   "hidden",
        }}
      >
        <motion.div
          style={{
            display:    "flex",
            flexDirection: "row",
            width:      `${PANEL_COUNT * 100}vw`,
            height:     "100%",
            x,
          }}
        >
          {PANELS.map((panel) => (
            <div
              key={panel.id}
              style={{
                width:           "100vw",
                height:          "100%",
                flexShrink:      0,
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                background:      "#F7F5F0",
              }}
            >
              {/* placeholder — content will be added per panel */}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
