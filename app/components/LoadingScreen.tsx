"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";

// ease-out-quart: for entrances — jumps into place, settles naturally
const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;
// ease-in-out-quint: for the bg curtain — slow start, fast mid, slow land
const EASE_IN_OUT_QUINT = [0.86, 0, 0.07, 1] as const;

type Phase = "in" | "hold" | "textExit" | "bgExit" | "done";

export default function LoadingScreen() {
  const [phase, setPhase] = useState<Phase>("in");
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Lock scroll during the loading animation so impatient scrolling
  // doesn't skip past the Hero while the curtain is still playing.
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (phase === "done") {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
  }, [phase]);

  useEffect(() => {
    if (shouldReduceMotion) {
      const t = setTimeout(() => setPhase("done"), 800);
      return () => clearTimeout(t);
    }

    const t1 = setTimeout(() => setPhase("hold"),     900);
    const t2 = setTimeout(() => setPhase("textExit"), 1550);
    const t3 = setTimeout(() => setPhase("bgExit"),   1860);
    const t4 = setTimeout(() => setPhase("done"),     2650);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [shouldReduceMotion]);

  if (phase === "done") return null;

  const isTextExiting = phase === "textExit" || phase === "bgExit";

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex ${isMobile ? "items-center" : "items-start pt-[400px]"} justify-center`}
      style={{ backgroundColor: "#616D45", overflow: "hidden" }}
      animate={phase === "bgExit" ? { y: "-100%" } : { y: "0%" }}
      transition={
        phase === "bgExit"
          ? { duration: 0.72, ease: EASE_IN_OUT_QUINT }
          : { duration: 0 }
      }
    >
      <motion.div
        className="flex flex-col items-center text-center select-none"
        animate={
          isTextExiting
            ? { opacity: 0, y: -18 }
            : { opacity: 1, y: 0 }
        }
        transition={
          isTextExiting
            ? { duration: 0.38, ease: EASE_OUT_QUART }
            : { duration: 0 }
        }
      >
        <div style={{ overflow: "hidden", paddingBottom: "0.2em", marginBottom: "-0.2em" }}>
          <motion.div
            initial={{ y: shouldReduceMotion ? 0 : "108%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.6,
              ease: EASE_OUT_QUART,
              delay: 0.1,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tree-blowing.svg"
              alt=""
              style={{
                height: isMobile ? "80px" : "120px",
                width: "auto",
                display: "block",
                filter: "brightness(0) invert(0.95) sepia(0.1) saturate(0.3)",
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
