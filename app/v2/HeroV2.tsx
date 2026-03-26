"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ArrowRightIcon,
  PlayIcon,
  PauseIcon,
  SpeakerLoudIcon,
  SpeakerOffIcon,
  EnterFullScreenIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { useIsMobile } from "../hooks/useIsMobile";

const LOAD_MIN_MS = 1400;
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;

const HEADING_WORDS = [
  { text: "Born", line: 0 },
  { text: "from", line: 0 },
  { text: "resilience,", line: 0 },
  { text: "built", line: 1 },
  { text: "for", line: 1 },
  { text: "the", line: 1 },
  { text: "future.", line: 1 },
];

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

function useHeroReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const minTimer = new Promise<void>((r) => setTimeout(r, LOAD_MIN_MS));
    const fontsReady = document.fonts.ready;
    Promise.all([minTimer, fontsReady]).then(() => { if (!done) setReady(true); });
    return () => { done = true; };
  }, []);
  return ready;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function HeroV2() {
  const shouldReduceMotion = useReducedMotion();
  const ready = useHeroReady();
  const isMobile = useIsMobile();
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isMoviePlaying, setIsMoviePlaying] = useState(false);

  // Movie controls
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isScrubbing) setControlsVisible(false);
    }, 3000);
  }, [isScrubbing]);

  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video || !isMoviePlaying) return;
    const onTime = () => setCurrentTime(video.currentTime);
    const onDur = () => setDuration(video.duration || 0);
    const onEnd = () => {
      setIsMoviePlaying(false);
      setIsPaused(false);
      window.dispatchEvent(new CustomEvent("versa-movie", { detail: { playing: false } }));
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDur);
    video.addEventListener("loadedmetadata", onDur);
    video.addEventListener("ended", onEnd);
    if (video.duration) setDuration(video.duration);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDur);
      video.removeEventListener("loadedmetadata", onDur);
      video.removeEventListener("ended", onEnd);
    };
  }, [isMoviePlaying]);

  useEffect(() => {
    if (isMoviePlaying) { setControlsVisible(true); resetHideTimer(); }
    else if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, [isMoviePlaying, resetHideTimer]);

  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  const handleWatchMovie = useCallback(() => {
    playTick(3800, 0.04, 0.08);
    setIsMoviePlaying(true);
    setIsPaused(false);
    setIsMuted(false);
    window.dispatchEvent(new CustomEvent("versa-movie", { detail: { playing: true } }));
    setTimeout(() => {
      const v = mainVideoRef.current;
      if (!v) return;
      v.muted = false;
      v.currentTime = 0;
      v.play().catch(() => { v.muted = true; setIsMuted(true); v.play().catch(() => {}); });
    }, 600);
  }, []);

  const handleCloseMovie = useCallback(() => {
    playTick(3200, 0.035, 0.06);
    const v = mainVideoRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
    setIsMoviePlaying(false);
    setIsPaused(false);
    window.dispatchEvent(new CustomEvent("versa-movie", { detail: { playing: false } }));
  }, []);

  const togglePause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = mainVideoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setIsPaused(false); }
    else { v.pause(); setIsPaused(true); }
    resetHideTimer();
  }, [resetHideTimer]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = mainVideoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    resetHideTimer();
  }, [resetHideTimer]);

  const handleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = mainVideoRef.current;
    if (v?.requestFullscreen) v.requestFullscreen();
    resetHideTimer();
  }, [resetHideTimer]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = mainVideoRef.current;
    const tl = timelineRef.current;
    if (!v || !tl || !duration) return;
    const rect = tl.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
    setCurrentTime(v.currentTime);
    resetHideTimer();
  }, [duration, resetHideTimer]);

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: "100vh", position: "sticky", top: 0, zIndex: 1 }}
    >
      {/* Background video — making of Versa Villa */}
      <video
        ref={bgVideoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          zIndex: 0,
        }}
      >
        <source src="/versa-villa-final.mp4" type="video/mp4" />
      </video>

      {/* Black overlay */}
      <motion.div
        style={{ position: "absolute", inset: 0, backgroundColor: "#000", zIndex: 1 }}
        animate={{ opacity: isMoviePlaying ? 0 : 0.6 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      />

      {/* Main movie (Watch Movie) with controls */}
      <AnimatePresence>
        {isMoviePlaying && (
          <motion.div
            style={{ position: "absolute", inset: 0, zIndex: 10, cursor: controlsVisible ? "auto" : "none" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
            onMouseMove={() => resetHideTimer()}
            onClick={(e) => { if ((e.target as HTMLElement).tagName === "VIDEO") togglePause(e); }}
          >
            <video
              ref={mainVideoRef}
              playsInline
              preload="auto"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", backgroundColor: "#000" }}
            >
              <source src="/versa-villa-final.mp4" type="video/mp4" />
            </video>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: controlsVisible ? 1 : 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                pointerEvents: controlsVisible ? "auto" : "none",
                background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
                padding: isMobile ? "60px 20px 120px" : "80px 40px 32px",
                display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "16px",
              }}
            >
              {/* Timeline */}
              <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                style={{ width: "100%", height: "32px", display: "flex", alignItems: "center", cursor: "pointer", touchAction: "none" }}
              >
                <div style={{ width: "100%", height: "3px", backgroundColor: "rgba(248,242,228,0.2)", borderRadius: "2px", position: "relative" }}>
                  <div style={{
                    height: "100%", width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                    backgroundColor: "#F8F2E4", borderRadius: "2px",
                    transition: isScrubbing ? "none" : "width 0.1s linear", position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", right: "-6px", top: "50%", transform: "translateY(-50%)",
                      width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#F8F2E4",
                      boxShadow: "0 0 8px rgba(0,0,0,0.4)",
                    }} />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <button onClick={togglePause} style={{ background: "none", border: "none", cursor: "pointer", color: "#F8F2E4", padding: "4px", display: "flex" }}>
                    {isPaused ? <PlayIcon width={22} height={22} /> : <PauseIcon width={22} height={22} />}
                  </button>
                  <button onClick={toggleMute} style={{ background: "none", border: "none", cursor: "pointer", color: "#F8F2E4", padding: "4px", display: "flex" }}>
                    {isMuted ? <SpeakerOffIcon width={22} height={22} /> : <SpeakerLoudIcon width={22} height={22} />}
                  </button>
                  <span style={{ fontFamily: "'Alte Haas Grotesk', sans-serif", fontSize: "14px", color: "rgba(248,242,228,0.7)", letterSpacing: "0.05em" }}>
                    {formatTime(currentTime)} <span style={{ opacity: 0.5 }}>/</span> {formatTime(duration)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <button onClick={handleFullscreen} style={{ background: "none", border: "none", cursor: "pointer", color: "#F8F2E4", padding: "4px", display: "flex" }}>
                    <EnterFullScreenIcon width={22} height={22} />
                  </button>
                  <button onClick={handleCloseMovie} style={{ background: "none", border: "none", cursor: "pointer", color: "#F8F2E4", padding: "4px", display: "flex" }}>
                    <Cross2Icon width={22} height={22} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Layer — heading + two CTAs */}
      <motion.div
        style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: isMoviePlaying ? "none" : "auto" }}
        animate={{ opacity: isMoviePlaying ? 0 : 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
      >
        <div
          style={{
            position: "absolute",
            top: isMobile ? "45%" : "400px",
            left: "50%",
            transform: isMobile ? "translate(-50%, -50%)" : "translateX(-50%)",
            textAlign: "center",
            width: isMobile ? "90%" : "auto",
          }}
        >
          {/* Heading */}
          <h1
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: isMobile ? "clamp(32px, 5vw, 48px)" : "56px",
              fontWeight: 400,
              lineHeight: "110%",
              letterSpacing: "-0.02em",
              color: "#F8F2E4",
              WebkitFontSmoothing: "antialiased",
              whiteSpace: isMobile ? "normal" : "nowrap",
            }}
          >
            {[0, 1].map((lineIdx) => {
              const words = HEADING_WORDS.filter((w) => w.line === lineIdx);
              return (
                <span key={lineIdx} style={{ display: "block" }}>
                  {words.map((w, wi) => {
                    const globalIdx = lineIdx === 0 ? wi : 3 + wi;
                    const wordDelay = 0.2 + globalIdx * 0.07;
                    return (
                      <motion.span
                        key={w.text}
                        style={{ display: "inline-block", willChange: "filter, opacity, transform" }}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 12, filter: "blur(6px)" }}
                        animate={ready ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
                        transition={{
                          duration: 0.65, ease: EASE_OUT_EXPO, delay: wordDelay,
                          filter: { duration: 0.7, ease: EASE_OUT_EXPO, delay: wordDelay },
                        }}
                      >
                        {w.text}
                        {wi < words.length - 1 ? "\u00A0" : null}
                      </motion.span>
                    );
                  })}
                </span>
              );
            })}
          </h1>

          {/* Two CTAs — premium underline style */}
          <motion.div
            style={{
              marginTop: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobile ? "32px" : "48px",
              flexWrap: "wrap",
            }}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={ready ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.75 }}
          >
            {/* Check Eligibility */}
            <a
              href="#fire-features"
              onClick={(e) => {
                e.preventDefault();
                playTick(3800, 0.04, 0.08);
                const el = document.querySelector("#fire-features");
                if (el) {
                  const top = el.getBoundingClientRect().top + window.scrollY;
                  window.scrollTo({ top, behavior: "smooth" });
                }
              }}
              onMouseEnter={() => playTick(4000, 0.03, 0.05)}
              className="hero-v2-cta"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "4px 6px",
                borderBottom: "1px solid #B8965A",
                borderRadius: 0,
                textDecoration: "none",
                color: "#B8965A",
                transition: "gap 0.3s ease, color 0.3s ease",
              }}
            >
              <span
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: isMobile ? "clamp(14px, 2vw, 18px)" : "13px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                }}
              >
                CHECK ELIGIBILITY
              </span>
              <ArrowRightIcon width={14} height={14} />
            </a>

            {/* Watch Movie */}
            <button
              onClick={handleWatchMovie}
              onMouseEnter={() => playTick(4000, 0.03, 0.05)}
              className="hero-v2-cta"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "4px 6px",
                borderBottom: "1px solid rgba(248, 242, 228, 0.35)",
                borderRadius: 0,
                color: "#F8F2E4",
                transition: "gap 0.3s ease, color 0.3s ease, border-color 0.3s ease",
              }}
            >
              <span
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: isMobile ? "clamp(14px, 2vw, 18px)" : "13px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                }}
              >
                WATCH MOVIE
              </span>
              <ArrowRightIcon width={14} height={14} style={{ color: "#B8965A" }} />
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Hover styles */}
      <style>{`
        .hero-v2-cta:hover {
          gap: 18px !important;
        }
        .hero-v2-cta:active {
          transform: scale(0.97);
          transition: transform 80ms ease;
        }
      `}</style>
    </section>
  );
}
