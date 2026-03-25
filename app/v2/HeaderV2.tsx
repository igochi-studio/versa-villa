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
const SCROLL_THRESHOLD = 80;

function useHeaderVisibility() {
  const [shown, setShown] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const onScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y < SCROLL_THRESHOLD) setShown(true);
      else if (y > lastScrollY.current + 5) setShown(false);
      else if (y < lastScrollY.current - 5) setShown(true);
      lastScrollY.current = y;
      ticking.current = false;
    });
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (e.clientY < 60) setShown(true);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [onScroll, onMouseMove]);

  return shown;
}

function useHeaderTheme(headerRef: React.RefObject<HTMLElement | null>) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      const header = headerRef.current;
      const el = document.elementFromPoint(window.innerWidth / 2, 90);
      if (el && header && !header.contains(el)) {
        if (el.tagName === "VIDEO" || el.tagName === "CANVAS") {
          setIsDark(true);
        } else {
          const bg = getComputedStyle(el).backgroundColor;
          const match = bg?.match(/\d+/g);
          if (match) {
            const [r, g, b] = match.map(Number);
            setIsDark((0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45);
          }
        }
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [headerRef]);

  return isDark;
}

export default function HeaderV2() {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const headerRef = useRef<HTMLElement>(null);
  const shown = useHeaderVisibility();
  const isDark = useHeaderTheme(headerRef);
  const [moviePlaying, setMoviePlaying] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => setMoviePlaying((e as CustomEvent).detail.playing);
    window.addEventListener("versa-movie", handler);
    return () => window.removeEventListener("versa-movie", handler);
  }, []);

  if (moviePlaying) return null;

  const textColor = isDark ? "#F8F2E4" : "#4A3C24";
  const mutedColor = isDark ? "rgba(248, 242, 228, 0.6)" : "rgba(74, 60, 36, 0.5)";

  return (
    <motion.header
      ref={headerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "16px 20px" : "24px 40px",
        pointerEvents: shown ? "auto" : "none",
        backdropFilter: "blur(12px) saturate(1.4)",
        WebkitBackdropFilter: "blur(12px) saturate(1.4)",
        backgroundColor: isDark ? "rgba(0,0,0,0.15)" : "rgba(248,242,228,0.6)",
        borderBottom: isDark
          ? "1px solid rgba(248,242,228,0.08)"
          : "1px solid rgba(74,60,36,0.06)",
        transition: "background-color 0.4s ease, border-color 0.4s ease",
      }}
      initial={shouldReduceMotion ? false : { y: -20, opacity: 0 }}
      animate={{
        y: shown ? 0 : -100,
        opacity: shown ? 1 : 0,
      }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
    >
      {/* Logo */}
      <a href="/v2" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isDark ? "/logo-light.svg" : "/logo-dark.svg"}
          alt="Versa Villa"
          style={{ height: isMobile ? "28px" : "36px", width: "auto", transition: "filter 0.4s ease" }}
        />
      </a>

      {/* Nav items — always visible, horizontal */}
      {!isMobile && (
        <nav style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (item.href.startsWith("#")) {
                  e.preventDefault();
                  const el = document.querySelector(item.href);
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                }
              }}
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: "13px",
                fontWeight: 400,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: mutedColor,
                textDecoration: "none",
                transition: "color 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = textColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = mutedColor; }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </motion.header>
  );
}
