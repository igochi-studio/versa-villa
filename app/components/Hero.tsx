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

// ── Timing — sync with LoadingScreen ────────────────────────────────────────
// bgExit at 1860ms, curtain gone ~2650ms. Content reveals as curtain lifts.
// LOAD_OFFSET is the minimum wait; we also wait for fonts to be ready so
// the blur reveal doesn't stutter from a late font swap.
const LOAD_MIN_MS = 1400;

// ── Easing ──────────────────────────────────────────────────────────────────
// ease-out-quint: stronger deceleration, classier settle
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;
const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;

// ── Heading word-by-word blur reveal ────────────────────────────────────────
const HEADING_WORDS = [
  { text: "Born", line: 0 },
  { text: "from", line: 0 },
  { text: "resilience,", line: 0 },
  { text: "built", line: 1 },
  { text: "for", line: 1 },
  { text: "the", line: 1 },
  { text: "future.", line: 1 },
];

// ── Haptic sound — subtle tick via Web Audio API ────────────────────────────
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
    // Audio not available — silent fallback
  }
}

// ── Wait for loading screen + fonts before revealing ────────────────────────
function useHeroReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;

    const minTimer = new Promise<void>((r) => setTimeout(r, LOAD_MIN_MS));
    const fontsReady = document.fonts.ready;

    Promise.all([minTimer, fontsReady]).then(() => {
      if (!done) setReady(true);
    });

    return () => { done = true; };
  }, []);

  return ready;
}

// ── Format time as M:SS ─────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const ready = useHeroReady();
  const isMobile = useIsMobile();
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isMoviePlaying, setIsMoviePlaying] = useState(false);

  // Movie controls state
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Auto-hide controls after 3s of no mouse movement
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isScrubbing) setControlsVisible(false);
    }, 3000);
  }, [isScrubbing]);

  // Track video time
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video || !isMoviePlaying) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onEnded = () => {
      setIsMoviePlaying(false);
      setIsPaused(false);
      window.dispatchEvent(new CustomEvent("versa-movie", { detail: { playing: false } }));
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("loadedmetadata", onDurationChange);
    video.addEventListener("ended", onEnded);

    // Initial
    if (video.duration) setDuration(video.duration);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("loadedmetadata", onDurationChange);
      video.removeEventListener("ended", onEnded);
    };
  }, [isMoviePlaying]);

  // Show controls on entry, start hide timer
  useEffect(() => {
    if (isMoviePlaying) {
      setControlsVisible(true);
      resetHideTimer();
    } else {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
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
      const mainVideo = mainVideoRef.current;
      if (!mainVideo) return;
      mainVideo.muted = false;
      mainVideo.currentTime = 0;
      mainVideo.play().catch(() => {
        mainVideo.muted = true;
        setIsMuted(true);
        mainVideo.play().catch(() => {});
      });
    }, 600);
  }, []);

  const handleCloseMovie = useCallback(() => {
    playTick(3200, 0.035, 0.06);
    const mainVideo = mainVideoRef.current;
    if (mainVideo) {
      mainVideo.pause();
      mainVideo.currentTime = 0;
    }
    setIsMoviePlaying(false);
    setIsPaused(false);
    window.dispatchEvent(new CustomEvent("versa-movie", { detail: { playing: false } }));
  }, []);

  const togglePause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = mainVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
    resetHideTimer();
  }, [resetHideTimer]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = mainVideoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    resetHideTimer();
  }, [resetHideTimer]);

  const handleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = mainVideoRef.current;
    if (!video) return;
    if (video.requestFullscreen) video.requestFullscreen();
    resetHideTimer();
  }, [resetHideTimer]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = mainVideoRef.current;
    const timeline = timelineRef.current;
    if (!video || !timeline || !duration) return;
    const rect = timeline.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
    setCurrentTime(video.currentTime);
    resetHideTimer();
  }, [duration, resetHideTimer]);

  const handleMouseMoveOnMovie = useCallback(() => {
    resetHideTimer();
  }, [resetHideTimer]);

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: "100vh", position: "sticky", top: 0, zIndex: 1 }}
    >
      {/* Background video — metadata preload so fonts get priority */}
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
        <source src="/hero-bg.webm" type="video/webm" />
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Black overlay */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000",
          zIndex: 1,
        }}
        animate={{ opacity: isMoviePlaying ? 0 : 0.6 }}
        transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
      />

      {/* Main movie with controls */}
      <AnimatePresence>
        {isMoviePlaying && (
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              cursor: controlsVisible ? "auto" : "none",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
            onMouseMove={handleMouseMoveOnMovie}
            onClick={(e) => {
              // Only close if clicking the video area (not controls)
              if ((e.target as HTMLElement).tagName === "VIDEO") {
                togglePause(e);
              }
            }}
          >
            <video
              ref={mainVideoRef}
              playsInline
              preload="auto"
              style={{
                width: "100%",
                height: "100%",
                objectFit: isMobile ? "contain" : "cover",
                display: "block",
                backgroundColor: "#000",
              }}
            >
              <source src="/versa-villa-intro-movie.mp4" type="video/mp4" />
            </video>

            {/* Controls overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: controlsVisible ? 1 : 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_QUINT }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                pointerEvents: controlsVisible ? "auto" : "none",
                background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
                padding: isMobile ? "60px 20px 80px" : "80px 40px 32px",
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? "12px" : "16px",
              }}
            >
              {/* Timeline */}
              <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsScrubbing(true);
                  handleTimelineClick(e);

                  const onMove = (ev: MouseEvent) => {
                    const video = mainVideoRef.current;
                    const timeline = timelineRef.current;
                    if (!video || !timeline || !duration) return;
                    const rect = timeline.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                    video.currentTime = ratio * duration;
                    setCurrentTime(video.currentTime);
                  };
                  const onUp = () => {
                    setIsScrubbing(false);
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                  };
                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                }}
                style={{
                  width: "100%",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "3px",
                    backgroundColor: "rgba(248, 242, 228, 0.2)",
                    borderRadius: "2px",
                    position: "relative",
                    overflow: "visible",
                  }}
                >
                  {/* Progress */}
                  <div
                    style={{
                      height: "100%",
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                      backgroundColor: "#F8F2E4",
                      borderRadius: "2px",
                      transition: isScrubbing ? "none" : "width 0.1s linear",
                      position: "relative",
                    }}
                  >
                    {/* Scrub head */}
                    <div
                      style={{
                        position: "absolute",
                        right: "-6px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: "#F8F2E4",
                        boxShadow: "0 0 8px rgba(0,0,0,0.4)",
                        opacity: controlsVisible ? 1 : 0,
                        transition: "opacity 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom row: controls + time */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {/* Left: play/pause + time */}
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "16px" }}>
                  <button
                    onClick={togglePause}
                    aria-label={isPaused ? "Play" : "Pause"}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#F8F2E4",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.9,
                      transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                  >
                    {isPaused ? (
                      <PlayIcon width={isMobile ? 18 : 22} height={isMobile ? 18 : 22} />
                    ) : (
                      <PauseIcon width={isMobile ? 18 : 22} height={isMobile ? 18 : 22} />
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#F8F2E4",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.9,
                      transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                  >
                    {isMuted ? (
                      <SpeakerOffIcon width={isMobile ? 18 : 22} height={isMobile ? 18 : 22} />
                    ) : (
                      <SpeakerLoudIcon width={isMobile ? 18 : 22} height={isMobile ? 18 : 22} />
                    )}
                  </button>

                  {/* Time display */}
                  <span
                    style={{
                      fontFamily: "'Alte Haas Grotesk', sans-serif",
                      fontSize: isMobile ? "12px" : "14px",
                      fontWeight: 400,
                      color: "rgba(248, 242, 228, 0.7)",
                      letterSpacing: "0.05em",
                      userSelect: "none",
                    }}
                  >
                    {formatTime(currentTime)}{" "}
                    <span style={{ opacity: 0.5 }}>/</span>{" "}
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Right: fullscreen + close */}
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "16px" }}>
                  <button
                    onClick={handleFullscreen}
                    aria-label="Fullscreen"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#F8F2E4",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.9,
                      transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                  >
                    <EnterFullScreenIcon width={isMobile ? 18 : 22} height={isMobile ? 18 : 22} />
                  </button>

                  <button
                    onClick={handleCloseMovie}
                    aria-label="Close movie"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#F8F2E4",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.9,
                      transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                  >
                    <Cross2Icon width={isMobile ? 18 : 22} height={isMobile ? 18 : 22} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Layer */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          pointerEvents: isMoviePlaying ? "none" : "auto",
        }}
        animate={{ opacity: isMoviePlaying ? 0 : 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
      >
        {/* Center content */}
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
          {/* Heading — cinematic word-by-word blur reveal */}
          <h1
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: isMobile ? "32px" : "56px",
              fontWeight: 400,
              lineHeight: "110%",
              letterSpacing: "-0.02em",
              color: "#F8F2E4",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              whiteSpace: isMobile ? "normal" : "nowrap",
            }}
          >
            {[0, 1].map((lineIdx) => {
              const words = HEADING_WORDS.filter((w) => w.line === lineIdx);
              return (
                <span key={lineIdx} style={{ display: "block" }}>
                  {words.map((w, wi) => {
                    const globalIdx = lineIdx === 0 ? wi : 3 + wi;
                    const wordDelay = 0.4 + globalIdx * 0.12;
                    return (
                      <motion.span
                        key={w.text}
                        style={{
                          display: "inline-block",
                          willChange: "filter, opacity, transform",
                        }}
                        initial={
                          shouldReduceMotion
                            ? false
                            : { opacity: 0, y: 18, filter: "blur(6px)" }
                        }
                        animate={
                          ready
                            ? { opacity: 1, y: 0, filter: "blur(0px)" }
                            : undefined
                        }
                        transition={{
                          duration: 0.9,
                          ease: EASE_OUT_QUINT,
                          delay: wordDelay,
                          filter: {
                            duration: 1.1,
                            ease: EASE_OUT_QUINT,
                            delay: wordDelay,
                          },
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

          {/* WATCH MOVIE button */}
          <motion.div
            style={{ marginTop: "28px", display: "inline-block" }}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={ready ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            transition={{ duration: 0.8, ease: EASE_OUT_QUINT, delay: 1.3 }}
          >
            {/* CSS transitions for hover — 150ms ease, no spring linger */}
            <button
              onClick={handleWatchMovie}
              onMouseEnter={() => playTick(4000, 0.03, 0.05)}
              className="hero-watch-btn"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "4px 6px 4px 6px",
                borderBottom: "1.5px solid #B8965A",
                borderRadius: 0,
                position: "relative",
                overflow: "hidden",
                color: "#F8F2E4",
                // Transition on the button itself for color
                transition: "color 150ms ease",
              }}
            >
              {/* Background fill — CSS transition, not spring */}
              <span
                className="hero-watch-btn-bg"
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "#F8F2E4",
                  transformOrigin: "bottom center",
                  transform: "scaleY(0)",
                  transition: "transform 180ms ease",
                  zIndex: 0,
                }}
              />

              {/* Text */}
              <span
                className="hero-watch-btn-text"
                style={{
                  fontFamily: "'Alte Haas Grotesk', sans-serif",
                  fontSize: isMobile ? "20px" : "32px",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  position: "relative",
                  zIndex: 1,
                  color: "inherit",
                  transition: "color 150ms ease",
                }}
              >
                WATCH MOVIE
              </span>

              {/* Arrow */}
              <span
                className="hero-watch-btn-arrow"
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  color: "#B8965A",
                  transition: "color 150ms ease, transform 150ms ease",
                }}
              >
                <ArrowRightIcon width={isMobile ? 20 : 28} height={isMobile ? 20 : 28} />
              </span>
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Hover styles — CSS for instant enter + instant leave (no spring linger) */}
      <style>{`
        .hero-watch-btn:hover {
          color: #1a1a1a;
        }
        .hero-watch-btn:hover .hero-watch-btn-bg {
          transform: scaleY(1);
        }
        .hero-watch-btn:hover .hero-watch-btn-arrow {
          color: #1a1a1a;
          transform: translateX(4px);
        }
        .hero-watch-btn:active {
          transform: scale(0.97);
          transition: transform 80ms ease;
        }
      `}</style>
    </section>
  );
}
