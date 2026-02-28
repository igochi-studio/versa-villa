"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { InstagramLogoIcon } from "@radix-ui/react-icons";
import { useIsMobile } from "../hooks/useIsMobile";

const NAV_MAIN = [
  { label: "OUR STORY", href: "#destruction" },
  { label: "FIRE FEATURES", href: "#fire-features" },
];

const NAV_MORE = [
  { label: "PROCESS ARCHIVE", href: "/process-archive" },
  { label: "GALLERY", href: "/gallery" },
  { label: "MODELS", href: "/future" },
];

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

const LOAD_OFFSET = 2.0;
const SCROLL_THRESHOLD = 80;
const MOUSE_REVEAL_ZONE = 60;

// ── Haptic sound ────────────────────────────────────────────────────────────
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
  } catch {
    // Silent fallback
  }
}

// Deep tick for menu open/close
function playDeepTick() {
  playTick(2400, 0.06, 0.08);
  setTimeout(() => playTick(3200, 0.04, 0.05), 30);
}

// ── Scroll hide/show ────────────────────────────────────────────────────────
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
    if (e.clientY < MOUSE_REVEAL_ZONE) setShown(true);
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

// ── Dark/light detection ────────────────────────────────────────────────────
function useHeaderTheme(headerRef: React.RefObject<HTMLElement | null>) {
  const [isDark, setIsDark] = useState(true);
  const rafRef = useRef(0);

  useEffect(() => {
    const check = () => {
      const sampleY = 90;
      const header = headerRef.current;

      const isDarkAtPoint = (x: number): boolean => {
        const elements = document.elementsFromPoint(x, sampleY);
        for (const el of elements) {
          if (header && header.contains(el)) continue;
          if (el.tagName === "VIDEO" || el.tagName === "CANVAS") return true;
          if (el.tagName === "IMG") {
            const imgStyle = getComputedStyle(el);
            if (imgStyle.filter && imgStyle.filter.includes("brightness")) return true;
            const rect = el.getBoundingClientRect();
            if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.5) return true;
          }
          const style = getComputedStyle(el);
          if (style.backgroundImage && style.backgroundImage !== "none") return true;
          const bg = style.backgroundColor;
          if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
            const match = bg.match(/\d+/g);
            if (match) {
              const [r, g, b] = match.map(Number);
              return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
            }
          }
        }
        return false;
      };

      setIsDark(isDarkAtPoint(100) || isDarkAtPoint(window.innerWidth - 100));
      rafRef.current = requestAnimationFrame(check);
    };

    rafRef.current = requestAnimationFrame(check);
    return () => cancelAnimationFrame(rafRef.current);
  }, [headerRef]);

  return isDark;
}

// ── Movie state from Hero ───────────────────────────────────────────────────
function useMovieState() {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => setPlaying((e as CustomEvent).detail.playing);
    window.addEventListener("versa-movie", handler);
    return () => window.removeEventListener("versa-movie", handler);
  }, []);
  return playing;
}

// ── Magnetic hover for trigger ──────────────────────────────────────────────
function useMagneticHover(ref: React.RefObject<HTMLButtonElement | null>, strength = 0.3) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      setOffset({ x: dx, y: dy });
    };

    const onLeave = () => setOffset({ x: 0, y: 0 });

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref, strength]);

  return offset;
}

// ── Nav Menu Item ───────────────────────────────────────────────────────────
function NavMenuItem({
  label,
  href,
  index,
  isDark,
  isMobile,
  onNavigate,
}: {
  label: string;
  href: string;
  index: number;
  isDark: boolean;
  isMobile: boolean;
  onNavigate: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const num = String(index + 1).padStart(2, "0");

  const textColor = isDark ? "#F8F2E4" : "#4A3C24";
  const mutedColor = isDark ? "rgba(248, 242, 228, 0.35)" : "rgba(74, 60, 36, 0.3)";
  const goldColor = "#B8965A";
  const dividerColor = isDark ? "rgba(184, 150, 90, 0.15)" : "rgba(184, 150, 90, 0.2)";

  return (
    <motion.a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (href.startsWith("#") && href !== "#") {
          // If we're on the homepage, smooth scroll; otherwise navigate to /{hash}
          if (window.location.pathname === "/") {
            const el = document.querySelector(href);
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY;
              window.scrollTo({ top, behavior: "smooth" });
            }
          } else {
            window.location.href = "/" + href;
          }
        } else if (href.startsWith("/")) {
          window.location.href = href;
        }
        playTick(3600, 0.04, 0.06);
        onNavigate();
      }}
      onMouseEnter={() => {
        setHovered(true);
        playTick(4800, 0.025, 0.04);
      }}
      onMouseLeave={() => setHovered(false)}
      initial={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 30, filter: "blur(8px)" }
      }
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: -10, filter: "blur(4px)" }
      }
      transition={{
        duration: 0.7,
        ease: EASE_OUT_QUINT,
        delay: 0.15 + index * 0.08,
      }}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: isMobile ? "16px" : "20px",
        position: "relative",
        padding: isMobile ? "22px 0" : "26px 0",
        textDecoration: "none",
        cursor: "pointer",
        borderBottom: `1px solid ${dividerColor}`,
        transform: hovered ? "translateX(8px)" : "translateX(0px)",
        transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      {/* Number */}
      <span
        style={{
          fontFamily: "'Alte Haas Grotesk', sans-serif",
          fontSize: isMobile ? "12px" : "13px",
          fontWeight: 400,
          letterSpacing: "0.08em",
          color: hovered ? goldColor : mutedColor,
          transition: "color 0.4s ease",
          minWidth: isMobile ? "24px" : "28px",
          userSelect: "none",
        }}
      >
        {num}
      </span>

      {/* Label */}
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? "26px" : "28px",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          color: textColor,
          opacity: hovered ? 1 : 0.8,
          transition: "opacity 0.3s ease, color 0.4s ease",
        }}
      >
        {label}
      </span>

      {/* Gold hover underline — sweeps in from left */}
      <motion.span
        style={{
          position: "absolute",
          bottom: -1,
          left: 0,
          height: "1px",
          backgroundColor: goldColor,
          transformOrigin: "left",
        }}
        animate={{
          width: hovered ? "100%" : "0%",
          opacity: hovered ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: EASE_OUT_QUINT }}
      />
    </motion.a>
  );
}

// ── Trigger Button ──────────────────────────────────────────────────────────
function MenuTrigger({
  isOpen,
  isDark,
  isMobile,
  onClick,
}: {
  isOpen: boolean;
  isDark: boolean;
  isMobile: boolean;
  onClick: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const btnRef = useRef<HTMLButtonElement>(null);
  const magnetic = useMagneticHover(btnRef, 0.25);
  const size = isMobile ? 44 : 56;
  const barColor = isDark ? "#F8F2E4" : "#4A3C24";

  // Warm glow colors
  const glowColor = isDark
    ? "radial-gradient(circle, rgba(184, 150, 90, 0.25) 0%, rgba(184, 150, 90, 0.08) 50%, transparent 70%)"
    : "radial-gradient(circle, rgba(184, 150, 90, 0.12) 0%, rgba(184, 150, 90, 0.04) 50%, transparent 70%)";

  const glassBg = isDark
    ? "rgba(248, 242, 228, 0.15)"
    : "rgba(248, 242, 228, 0.55)";

  const glassBorder = isDark
    ? "1px solid rgba(248, 242, 228, 0.2)"
    : "1px solid rgba(74, 60, 36, 0.12)";

  return (
    <motion.div
      style={{ position: "relative", zIndex: 52 }}
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE_OUT_QUINT, delay: 0.2 }}
    >
      {/* Warm radial glow behind button */}
      <motion.div
        style={{
          position: "absolute",
          inset: isMobile ? -20 : -28,
          background: glowColor,
          borderRadius: "50%",
          pointerEvents: "none",
        }}
        animate={{
          scale: isOpen ? 1.3 : 1,
          opacity: isOpen ? 0.6 : 1,
        }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
      />

      <motion.button
        ref={btnRef}
        onClick={() => {
          playDeepTick();
          onClick();
        }}
        onMouseEnter={() => playTick(5200, 0.02, 0.03)}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        animate={{
          x: magnetic.x,
          y: magnetic.y,
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: glassBorder,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: isOpen ? "0px" : "4.5px",
          background: glassBg,
          backdropFilter: "blur(24px) saturate(1.6)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          boxShadow: isDark
            ? "0 2px 12px rgba(0, 0, 0, 0.3)"
            : "0 2px 12px rgba(74, 60, 36, 0.12)",
          position: "relative",
          transition: "background 0.4s ease, border 0.4s ease, gap 0.3s ease",
        }}
      >
        {/* Three bars → X morphing */}
        <motion.span
          animate={
            isOpen
              ? { rotate: 45, y: 0, width: 16, backgroundColor: barColor }
              : { rotate: 0, y: 0, width: 18, backgroundColor: barColor }
          }
          transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
          style={{
            display: "block",
            height: 1.5,
            borderRadius: 1,
            transformOrigin: "center",
          }}
        />
        <motion.span
          animate={
            isOpen
              ? { opacity: 0, width: 0, backgroundColor: barColor }
              : { opacity: 1, width: 12, backgroundColor: barColor }
          }
          transition={{ duration: 0.3, ease: EASE_OUT_QUINT }}
          style={{
            display: "block",
            height: 1.5,
            borderRadius: 1,
          }}
        />
        <motion.span
          animate={
            isOpen
              ? { rotate: -45, y: 0, width: 16, backgroundColor: barColor }
              : { rotate: 0, y: 0, width: 18, backgroundColor: barColor }
          }
          transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
          style={{
            display: "block",
            height: 1.5,
            borderRadius: 1,
            transformOrigin: "center",
          }}
        />
      </motion.button>
    </motion.div>
  );
}

// ── Main Header ─────────────────────────────────────────────────────────────
export default function Header() {
  const shouldReduceMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerShown = useHeaderVisibility();
  const isDark = useHeaderTheme(headerRef);
  const moviePlaying = useMovieState();
  const isMobile = useIsMobile();

  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let done = false;
    const minTimer = new Promise<void>((r) => setTimeout(r, LOAD_OFFSET * 1000));
    Promise.all([minTimer, document.fonts.ready]).then(() => {
      if (!done) setLoaded(true);
    });
    return () => {
      done = true;
    };
  }, []);

  // Close menu when header hides
  useEffect(() => {
    if (!headerShown) setMenuOpen(false);
  }, [headerShown]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Focus trap
  useEffect(() => {
    if (!menuOpen || !panelRef.current) return;
    const panel = panelRef.current;
    const focusables = panel.querySelectorAll<HTMLElement>("a, button");
    if (focusables.length > 0) focusables[0].focus();

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onTab);
    return () => window.removeEventListener("keydown", onTab);
  }, [menuOpen]);

  const handleNavigate = useCallback(() => {
    setTimeout(() => setMenuOpen(false), 200);
  }, []);

  if (!loaded) return null;

  const isVisible = !moviePlaying;
  const padding = isMobile ? "24px" : "80px";

  // Panel glass — fully opaque on mobile for readability
  const panelBg = isMobile
    ? (isDark ? "rgb(20, 18, 15)" : "rgb(248, 242, 228)")
    : (isDark ? "rgba(20, 18, 15, 0.75)" : "rgba(248, 242, 228, 0.82)");
  const panelBorder = isDark
    ? "1px solid rgba(184, 150, 90, 0.12)"
    : "1px solid rgba(184, 150, 90, 0.15)";
  const panelShadow = isDark
    ? "0 24px 80px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(248, 242, 228, 0.06)"
    : "0 24px 80px rgba(74, 60, 36, 0.08), 0 4px 16px rgba(74, 60, 36, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)";

  return (
    <header
      ref={headerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        pointerEvents: isVisible ? "auto" : "none",
        opacity: moviePlaying ? 0 : 1,
        transform: isVisible ? "translateY(0)" : "translateY(-100%)",
        transition: moviePlaying
          ? "opacity 300ms ease, transform 300ms ease"
          : "transform 400ms cubic-bezier(0.23, 1, 0.32, 1), opacity 400ms ease",
        willChange: "transform, opacity",
      }}
    >
      {/* Logo */}
      <motion.div
        initial={
          shouldReduceMotion ? false : { opacity: 0, y: -10, filter: "blur(4px)" }
        }
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
        onClick={() => {
          if (window.location.pathname === "/") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            window.location.href = "/";
          }
        }}
        style={{ cursor: "pointer" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isDark ? "/versa-villa-logo.svg" : "/versa-villa-logo-dark.svg"}
          alt="Versa Villa by Arya"
          style={{ height: isMobile ? "36px" : "52px", width: "auto", display: "block" }}
        />
      </motion.div>

      {/* Navigation */}
      <div style={{ position: "relative" }}>
        <MenuTrigger
          isOpen={menuOpen}
          isDark={isDark}
          isMobile={isMobile}
          onClick={() => setMenuOpen((v) => !v)}
        />

        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Click-outside scrim */}
              <motion.div
                key="nav-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setMenuOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 50,
                  backgroundColor: isMobile
                    ? isDark
                      ? "rgba(0, 0, 0, 0.6)"
                      : "rgba(74, 60, 36, 0.2)"
                    : "transparent",
                  backdropFilter: isMobile ? "blur(4px)" : "none",
                  WebkitBackdropFilter: isMobile ? "blur(4px)" : "none",
                }}
              />

              {/* Panel */}
              <motion.nav
                key="nav-panel"
                ref={panelRef}
                role="dialog"
                aria-label="Navigation menu"
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: 0.88,
                        y: -16,
                        filter: "blur(12px)",
                      }
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: 0.94,
                        y: -8,
                        filter: "blur(6px)",
                      }
                }
                transition={{
                  duration: 0.55,
                  ease: EASE_OUT_QUINT,
                }}
                style={{
                  position: isMobile ? "fixed" : "absolute",
                  ...(isMobile
                    ? { inset: 0 }
                    : {
                        top: "calc(100% + 16px)",
                        right: -12,
                        width: 440,
                      }),
                  zIndex: 51,
                  background: panelBg,
                  backdropFilter: "blur(48px) saturate(1.8)",
                  WebkitBackdropFilter: "blur(48px) saturate(1.8)",
                  borderRadius: isMobile ? 0 : 24,
                  border: isMobile ? "none" : panelBorder,
                  boxShadow: isMobile ? "none" : panelShadow,
                  padding: isMobile ? "100px 32px 32px" : "36px 44px 40px",
                  transformOrigin: "top right",
                  overflow: isMobile ? "auto" : "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition:
                    "background 0.4s ease, box-shadow 0.4s ease, border 0.4s ease",
                }}
              >
                {/* Top shimmer line */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "10%",
                    right: "10%",
                    height: "1px",
                    background:
                      "linear-gradient(90deg, transparent, rgba(184,150,90,0.35), rgba(248,242,228,0.12), rgba(184,150,90,0.35), transparent)",
                    borderRadius: "1px",
                  }}
                />

                {/* "NAVIGATE" label at top */}
                <motion.span
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE_OUT_QUINT, delay: 0.08 }}
                  style={{
                    fontFamily: "'Alte Haas Grotesk', sans-serif",
                    fontSize: "11px",
                    fontWeight: 400,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: isDark
                      ? "rgba(184, 150, 90, 0.5)"
                      : "rgba(184, 150, 90, 0.7)",
                    marginBottom: isMobile ? "32px" : "28px",
                    transition: "color 0.4s ease",
                  }}
                >
                  NAVIGATE
                </motion.span>

                {/* Mobile close */}
                {isMobile && (
                  <div style={{ position: "absolute", top: 24, right: 24 }}>
                    <MenuTrigger
                      isOpen={true}
                      isDark={isDark}
                      isMobile={true}
                      onClick={() => setMenuOpen(false)}
                    />
                  </div>
                )}

                {/* Main nav items */}
                {NAV_MAIN.map((item, i) => (
                  <NavMenuItem
                    key={item.label}
                    label={item.label}
                    href={item.href}
                    index={i}
                    isDark={isDark}
                    isMobile={isMobile}
                    onNavigate={handleNavigate}
                  />
                ))}

                {/* MORE INFORMATION subsection */}
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.6, ease: EASE_OUT_QUINT, delay: 0.3 }}
                  style={{
                    marginTop: isMobile ? "24px" : "28px",
                    border: `1px solid ${isDark ? "rgba(184, 150, 90, 0.2)" : "rgba(184, 150, 90, 0.25)"}`,
                    borderRadius: "12px",
                    padding: isMobile ? "20px" : "24px",
                    transition: "border-color 0.4s ease",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Alte Haas Grotesk', sans-serif",
                      fontSize: "12px",
                      fontWeight: 400,
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      color: "#B8965A",
                      opacity: 0.7,
                      display: "block",
                      marginBottom: isMobile ? "8px" : "12px",
                    }}
                  >
                    MORE INFORMATION
                  </span>
                  {NAV_MORE.map((item, i) => (
                    <NavMenuItem
                      key={item.label}
                      label={item.label}
                      href={item.href}
                      index={i + NAV_MAIN.length}
                      isDark={isDark}
                      isMobile={isMobile}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </motion.div>

                {/* Bottom gold accent line */}
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: EASE_OUT_QUINT,
                    delay: 0.4,
                  }}
                  style={{
                    height: "1px",
                    background:
                      "linear-gradient(90deg, rgba(184, 150, 90, 0.4), rgba(184, 150, 90, 0.1))",
                    marginTop: isMobile ? "28px" : "24px",
                    transformOrigin: "left",
                  }}
                />

                {/* Instagram */}
                <motion.a
                  href="https://www.instagram.com/versa.villa/"
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE_OUT_QUINT, delay: 0.45 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    marginTop: isMobile ? "16px" : "14px",
                    textDecoration: "none",
                    color: isDark ? "rgba(248, 242, 228, 0.5)" : "rgba(74, 60, 36, 0.45)",
                    transition: "color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#B8965A";
                    playTick(4800, 0.02, 0.03);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isDark
                      ? "rgba(248, 242, 228, 0.5)"
                      : "rgba(74, 60, 36, 0.45)";
                  }}
                >
                  <InstagramLogoIcon width={isMobile ? 18 : 16} height={isMobile ? 18 : 16} />
                  <span
                    style={{
                      fontFamily: "'Alte Haas Grotesk', sans-serif",
                      fontSize: isMobile ? "16px" : "14px",
                      fontWeight: 400,
                      letterSpacing: "0.02em",
                    }}
                  >
                    @versa.villa
                  </span>
                </motion.a>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
