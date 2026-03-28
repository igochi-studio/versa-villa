"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { InstagramLogoIcon } from "@radix-ui/react-icons";
import { useIsMobile } from "../hooks/useIsMobile";

const NAV_SCROLL = [
  { label: "FEATURES", href: "/v2#fire-features" },
  { label: "OUR STORY", href: "/v2#context" },
  { label: "THE VISION", href: "/v2#vision" },
];

const NAV_PAGES = [
  { label: "PROCESS ARCHIVE", href: "/v2/process-archive" },
  { label: "GALLERY", href: "/v2/gallery" },
  { label: "MODELS", href: "/v2/models" },
];

const NAV_ALL = [...NAV_SCROLL, ...NAV_PAGES];

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

// ── Haptic sound ───────────────────────────────────────────────────────────
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

function playDeepTick() {
  playTick(2400, 0.06, 0.08);
  setTimeout(() => playTick(3200, 0.04, 0.05), 30);
}

// ── Helper: navigate for hash links ────────────────────────────────────────
function navigateToHref(href: string) {
  const hashIndex = href.indexOf("#");
  if (hashIndex !== -1) {
    const path = href.substring(0, hashIndex);
    const hash = href.substring(hashIndex);
    const isHome = window.location.pathname === "/v2" || window.location.pathname === "/v2/";
    if (!path || isHome) {
      const el = document.querySelector(hash);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top, behavior: "smooth" });
      }
      return;
    }
  }
  window.location.href = href;
}

// ── Desktop Nav Link ───────────────────────────────────────────────────────
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
        e.preventDefault();
        playTick(3600, 0.04, 0.06);
        navigateToHref(href);
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
      <span
        style={{
          fontFamily: "'Alte Haas Grotesk', sans-serif",
          fontSize: "12px",
          fontWeight: 400,
          letterSpacing: "0.08em",
          color: hovered ? "#B8965A" : "rgba(248, 242, 228, 0.5)",
          transition: "color 0.3s ease",
          userSelect: "none",
        }}
      >
        {num}
      </span>
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? "15px" : "18px",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          color: hovered ? "#F8F2E4" : "rgba(248, 242, 228, 0.8)",
          transition: "color 0.3s ease",
        }}
      >
        {label}
      </span>
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

// ── Mobile Menu Item ───────────────────────────────────────────────────────
function MobileNavItem({
  label,
  href,
  index,
  onNavigate,
}: {
  label: string;
  href: string;
  index: number;
  onNavigate: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const num = String(index + 1).padStart(2, "0");

  return (
    <motion.a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        playTick(3600, 0.04, 0.06);
        onNavigate();
        setTimeout(() => navigateToHref(href), 200);
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
        gap: "16px",
        position: "relative",
        padding: "22px 0",
        textDecoration: "none",
        cursor: "pointer",
        borderBottom: "1px solid rgba(184, 150, 90, 0.15)",
        transform: hovered ? "translateX(8px)" : "translateX(0px)",
        transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      <span
        style={{
          fontFamily: "'Alte Haas Grotesk', sans-serif",
          fontSize: "12px",
          fontWeight: 400,
          letterSpacing: "0.08em",
          color: hovered ? "#B8965A" : "rgba(248, 242, 228, 0.35)",
          transition: "color 0.4s ease",
          minWidth: "24px",
          userSelect: "none",
        }}
      >
        {num}
      </span>
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "26px",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          color: "#F8F2E4",
          opacity: hovered ? 1 : 0.8,
          transition: "opacity 0.3s ease",
        }}
      >
        {label}
      </span>
      <motion.span
        style={{
          position: "absolute",
          bottom: -1,
          left: 0,
          height: "1px",
          backgroundColor: "#B8965A",
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

// ── Mobile Hamburger Trigger ───────────────────────────────────────────────
function MobileMenuTrigger({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  const size = 44;

  return (
    <motion.button
      onClick={() => {
        playDeepTick();
        onClick();
      }}
      onMouseEnter={() => playTick(5200, 0.02, 0.03)}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      whileTap={{ scale: 0.95 }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "1px solid rgba(248, 242, 228, 0.2)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isOpen ? "0px" : "4.5px",
        background: "rgba(248, 242, 228, 0.15)",
        backdropFilter: "blur(24px) saturate(1.6)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.3)",
        position: "relative",
        zIndex: 52,
        transition: "gap 0.3s ease",
      }}
    >
      <motion.span
        animate={
          isOpen
            ? { rotate: 45, y: 0, width: 16 }
            : { rotate: 0, y: 0, width: 18 }
        }
        transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
        style={{
          display: "block",
          height: 1.5,
          borderRadius: 1,
          backgroundColor: "#F8F2E4",
          transformOrigin: "center",
        }}
      />
      <motion.span
        animate={
          isOpen
            ? { opacity: 0, width: 0 }
            : { opacity: 1, width: 12 }
        }
        transition={{ duration: 0.3, ease: EASE_OUT_QUINT }}
        style={{
          display: "block",
          height: 1.5,
          borderRadius: 1,
          backgroundColor: "#F8F2E4",
        }}
      />
      <motion.span
        animate={
          isOpen
            ? { rotate: -45, y: 0, width: 16 }
            : { rotate: 0, y: 0, width: 18 }
        }
        transition={{ duration: 0.45, ease: EASE_OUT_QUINT }}
        style={{
          display: "block",
          height: 1.5,
          borderRadius: 1,
          backgroundColor: "#F8F2E4",
          transformOrigin: "center",
        }}
      />
    </motion.button>
  );
}

// ── Main Header ────────────────────────────────────────────────────────────
export default function HeaderV2() {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [shown, setShown] = useState(true);
  const lastScrollY = useRef(0);
  const [moviePlaying, setMoviePlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

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

  // Close menu when header hides
  useEffect(() => {
    if (!shown) setMenuOpen(false);
  }, [shown]);

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
            height: isMobile ? "38px" : "46px",
            width: "auto",
            display: "block",
          }}
        />
      </a>

      {/* Desktop: horizontal nav items */}
      {!isMobile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
          }}
        >
          {NAV_ALL.map((item, i) => (
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

      {/* Mobile: hamburger trigger */}
      {isMobile && (
        <MobileMenuTrigger
          isOpen={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        />
      )}

      {/* Mobile: fullscreen menu panel (portaled to body) */}
      {isMobile && mounted && createPortal(
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Scrim */}
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
                  zIndex: 150,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                }}
              />

              {/* Panel */}
              <motion.div
                key="nav-panel"
                ref={panelRef}
                role="dialog"
                aria-label="Navigation menu"
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.88, y: -16, filter: "blur(12px)" }
                }
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.94, y: -8, filter: "blur(6px)" }
                }
                transition={{ duration: 0.55, ease: EASE_OUT_QUINT }}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 151,
                  background: "rgb(20, 18, 15)",
                  padding: "100px 32px 32px",
                  transformOrigin: "top right",
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Close button */}
                <div style={{ position: "absolute", top: 20, right: 20 }}>
                  <MobileMenuTrigger
                    isOpen={true}
                    onClick={() => setMenuOpen(false)}
                  />
                </div>

                {/* Top shimmer */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "10%",
                    right: "10%",
                    height: "1px",
                    background: "linear-gradient(90deg, transparent, rgba(184,150,90,0.35), rgba(248,242,228,0.12), rgba(184,150,90,0.35), transparent)",
                    borderRadius: "1px",
                  }}
                />

                {/* NAVIGATE label */}
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
                    color: "rgba(184, 150, 90, 0.5)",
                    marginBottom: "32px",
                  }}
                >
                  NAVIGATE
                </motion.span>

                {/* Scroll section items */}
                {NAV_SCROLL.map((item, i) => (
                  <MobileNavItem
                    key={item.label}
                    label={item.label}
                    href={item.href}
                    index={i}
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
                    marginTop: "24px",
                    border: "1px solid rgba(184, 150, 90, 0.2)",
                    borderRadius: "12px",
                    padding: "20px",
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
                      marginBottom: "8px",
                    }}
                  >
                    MORE INFORMATION
                  </span>
                  {NAV_PAGES.map((item, i) => (
                    <MobileNavItem
                      key={item.label}
                      label={item.label}
                      href={item.href}
                      index={i + NAV_SCROLL.length}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </motion.div>

                {/* Bottom gold line */}
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.8, ease: EASE_OUT_QUINT, delay: 0.4 }}
                  style={{
                    height: "1px",
                    background: "linear-gradient(90deg, rgba(184, 150, 90, 0.4), rgba(184, 150, 90, 0.1))",
                    marginTop: "28px",
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
                    marginTop: "16px",
                    textDecoration: "none",
                    color: "rgba(248, 242, 228, 0.5)",
                    transition: "color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#B8965A";
                    playTick(4800, 0.02, 0.03);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(248, 242, 228, 0.5)";
                  }}
                >
                  <InstagramLogoIcon width={18} height={18} />
                  <span
                    style={{
                      fontFamily: "'Alte Haas Grotesk', sans-serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      letterSpacing: "0.02em",
                    }}
                  >
                    @versa.villa
                  </span>
                </motion.a>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.nav>
  );
}
