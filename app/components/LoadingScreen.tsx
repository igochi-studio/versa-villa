"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ease-out-quart: for entrances — jumps into place, settles naturally
const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;
// ease-in-out-quint: for the bg curtain — slow start, fast mid, slow land
const EASE_IN_OUT_QUINT = [0.86, 0, 0.07, 1] as const;

type Phase = "in" | "hold" | "textExit" | "bgExit" | "done";

function LineReveal({ children, delay }: { children: string; delay: number }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    // paddingBottom gives descenders (g, y, 5) room below the clip edge
    <div style={{ overflow: "hidden", paddingBottom: "0.2em", marginBottom: "-0.2em" }}>
      <motion.span
        style={{
          display: "block",
          fontSize: "56px",
          fontWeight: 400,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          fontSynthesis: "none",
        }}
        className="font-serif text-[#F7F5F0]"
        initial={{ y: shouldReduceMotion ? 0 : "108%" }}
        animate={{ y: 0 }}
        transition={{
          duration: 0.6,
          ease: EASE_OUT_QUART,
          delay,
        }}
      >
        {children}
      </motion.span>
    </div>
  );
}

export default function LoadingScreen() {
  const [phase, setPhase] = useState<Phase>("in");
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      const t = setTimeout(() => setPhase("done"), 800);
      return () => clearTimeout(t);
    }

    // t=0:       text lines start revealing (staggered 0.1s / 0.3s)
    // t=0.9s:    fully revealed, hold
    // t=1.55s:   text fades + drifts up (0.38s)
    // t=1.85s:   text gone → bg curtain lifts (0.72s)
    // t=2.65s:   done
    const t1 = setTimeout(() => setPhase("hold"),     900);
    const t2 = setTimeout(() => setPhase("textExit"), 1550);
    const t3 = setTimeout(() => setPhase("bgExit"),   1860);
    const t4 = setTimeout(() => setPhase("done"),     2650);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [shouldReduceMotion]);

  if (phase === "done") return null;

  const isTextExiting = phase === "textExit" || phase === "bgExit";

  return (
    // Outer: the green curtain — slides up during bgExit
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[400px]"
      style={{ backgroundColor: "#414833", overflow: "hidden" }}
      animate={phase === "bgExit" ? { y: "-100%" } : { y: "0%" }}
      transition={
        phase === "bgExit"
          ? { duration: 0.72, ease: EASE_IN_OUT_QUINT }
          : { duration: 0 }
      }
    >
      {/* Inner: the text group — fades + floats up before the curtain lifts */}
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
        <LineReveal delay={0.1}>January</LineReveal>
        <LineReveal delay={0.28}>2025</LineReveal>
      </motion.div>
    </motion.div>
  );
}
