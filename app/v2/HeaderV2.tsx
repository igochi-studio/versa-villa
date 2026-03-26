"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";

const NAV_ITEMS = [
  { label: "OUR STORY", href: "#destruction" },
  { label: "FIRE FEATURES", href: "#fire-features" },
  { label: "PROCESS ARCHIVE", href: "/process-archive" },
  { label: "GALLERY", href: "/gallery" },
  { label: "MODELS", href: "/future" },
];

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ── Haptic sound — matches original Header ──────────────────────────────────
let audioCtx: AudioContext | null = null;
function playTick(frequency = 4200, duration = 0.03, volume = 0.06) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch { /* silent */ }
}

// ── Nav link — retains original numbered style, gold underline, sound ───────
function NavLink({
  label,
  href,
  index,
  isMobile,
}: {
  label: string;
  href: string;
  index: number;
  isMobile: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const num = String(index + 1).padStart(2, "0");

  return (
    <a
      href={href}
      onClick={(e) => {
        playTick(3600, 0.04, 0.06);
        if (href.startsWith("#")) {
          e.preventDefault();
          const el = document.querySelector(href);
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top, behavior: "smooth" });
          }
        }
      }}
      onMouseEnter={() => {
        setHovered(true);
        playTick(4800, 0.025, 0.04);
      }}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: isMobile ? "6px" : "8px",
        textDecoration: "none",
        position: "relative",
        paddingBottom: "4px",
        cursor: "pointer",
      }}
    >
      {/* Number */}
      <span
        style={{
          fontFamily: "'Alte Haas Grotesk', sans-serif",
          fontSize: "11px",
          fontWeight: 400,
          letterSpacing: "0.08em",
          color: hovered ? "#B8965A" : "rgba(248, 242, 228, 0.5)",
          transition: "color 0.3s ease",
          userSelect: "none",
        }}
      >
        {num}
      </span>

      {/* Label — Playfair Display like the original */}
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? "14px" : "16px",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          color: hovered ? "#F8F2E4" : "rgba(248, 242, 228, 0.8)",
          transition: "color 0.3s ease",
        }}
      >
        {label}
      </span>

      {/* Gold hover underline — sweeps in from left */}
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "1px",
          backgroundColor: "#B8965A",
          width: hovered ? "100%" : "0%",
          opacity: hovered ? 1 : 0,
          transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
          transformOrigin: "left",
        }}
      />
    </a>
  );
}

export default function HeaderV2() {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [shown, setShown] = useState(true);
  const lastScrollY = useRef(0);
  const [moviePlaying, setMoviePlaying] = useState(false);

  // Scroll: show/hide + glass state
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 80);
        if (y < 80) setShown(true);
        else if (y > lastScrollY.current + 5) setShown(false);
        else if (y < lastScrollY.current - 5) setShown(true);
        lastScrollY.current = y;
        ticking = false;
      });
    };
    const onMouse = (e: MouseEvent) => { if (e.clientY < 60) setShown(true); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  // Movie state from Hero
  useEffect(() => {
    const handler = (e: Event) => setMoviePlaying((e as CustomEvent).detail.playing);
    window.addEventListener("versa-movie", handler);
    return () => window.removeEventListener("versa-movie", handler);
  }, []);

  if (moviePlaying) return null;

  return (
    <motion.nav
      initial={shouldReduceMotion ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: scrolled
          ? (isMobile ? "12px 20px" : "14px 48px")
          : (isMobile ? "20px 20px" : "24px 48px"),
        background: scrolled
          ? "rgba(10, 10, 10, 0.92)"
          : "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
        backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
        boxShadow: scrolled ? "0 1px 0 rgba(184, 150, 90, 0.15)" : "none",
        transition: "padding 0.4s ease, background 0.4s ease, box-shadow 0.4s ease, backdrop-filter 0.4s ease",
        pointerEvents: "auto",
      }}
    >
      {/* Logo */}
      <a href="/v2" style={{ textDecoration: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/versa-villa-logo.svg"
          alt="Versa Villa"
          style={{
            height: isMobile ? "30px" : "36px",
            width: "auto",
            display: "block",
          }}
        />
      </a>

      {/* Nav items — horizontal, preserving original serif + numbered style */}
      {!isMobile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
          }}
        >
          {NAV_ITEMS.map((item, i) => (
            <NavLink
              key={item.label}
              label={item.label}
              href={item.href}
              index={i}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </motion.nav>
  );
}
