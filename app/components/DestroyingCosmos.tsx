"use client";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
  MotionValue,
} from "motion/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

/* ─────────────────────────────────────────────────────────────────────────────
 * DESTROYING COSMOS
 *
 * Phase-based state machine with bidirectional scroll support:
 *   Phase 0 — Cosmos: floating images + "Destroying [subtitle]" cycling
 *   Phase 1 — Expanded: palisades fullscreen (burn not started or reversing)
 *   Phase 2 — Complete: burn done, quote visible
 *
 * Forward:  scroll triggers expand → auto-burn → auto-quote-reveal
 * Backward: scroll back → quote hides + burn reverses → palisades collapses
 * ─────────────────────────────────────────────────────────────────────────── */

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;
const EASE_REVEAL = [0.16, 1, 0.3, 1] as const;

let audioCtx: AudioContext | null = null;
function playTick(frequency = 3200, duration = 0.035, volume = 0.04) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    if (audioCtx.state === "suspended") return;
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
    /* silent */
  }
}

const SOURCES = [
  "ruins-1", "ruins-2", "ruins-3", "ruins-4",
  "families-1", "families-2", "families-3",
  "streets-1", "streets-2", "streets-3", "streets-4",
  "blaze-1", "blaze-2", "blaze-3",
  "community-1", "community-2", "community-3", "community-4",
  "community-5", "community-6", "community-7",
  "rebuild-2", "rebuild-4", "rebuild-5",
];

interface Slot {
  id: number;
  src: string;
  top: string;
  left: string;
  width: number;
  height: number;
  delay: number;
  revealGroup: number;
  depth: number;
  floatY: number;
  floatDur: number;
}

const DESKTOP_SLOTS: Slot[] = [
  { id: 1,  src: "ruins-1",           top: "12%", left: "22%", width: 80,  height: 100, delay: 0.4,  revealGroup: 0, depth: 0.035, floatY: -10, floatDur: 5 },
  { id: 2,  src: "community-1",       top: "28%", left: "12%", width: 90,  height: 90,  delay: 0.1,  revealGroup: 0, depth: 0.05,  floatY: -10, floatDur: 5 },
  { id: 3,  src: "streets-3",         top: "15%", left: "42%", width: 110, height: 70,  delay: 0.7,  revealGroup: 1, depth: 0.065, floatY: -10, floatDur: 6 },
  { id: 4,  src: "families-2",        top: "30%", left: "72%", width: 85,  height: 120, delay: 0.2,  revealGroup: 0, depth: 0.08,  floatY: -10, floatDur: 5 },
  { id: 5,  src: "ruins-4",           top: "8%",  left: "88%", width: 100, height: 100, delay: 1.1,  revealGroup: 2, depth: 0.02,  floatY: -10, floatDur: 4 },
  { id: 6,  src: "blaze-1",           top: "45%", left: "15%", width: 130, height: 80,  delay: 0.5,  revealGroup: 1, depth: 0.035, floatY: -10, floatDur: 5 },
  { id: 7,  src: "streets-1",         top: "52%", left: "82%", width: 75,  height: 110, delay: 0.9,  revealGroup: 2, depth: 0.05,  floatY: -10, floatDur: 6 },
  { id: 8,  src: "families-3",        top: "68%", left: "28%", width: 95,  height: 95,  delay: 0.05, revealGroup: 0, depth: 0.065, floatY: -10, floatDur: 5 },
  { id: 9,  src: "ruins-2",           top: "78%", left: "12%", width: 115, height: 75,  delay: 1.2,  revealGroup: 3, depth: 0.08,  floatY: -10, floatDur: 4 },
  { id: 10, src: "palisades-before",  top: "82%", left: "45%", width: 85,  height: 125, delay: 0.45, revealGroup: 1, depth: 0.02,  floatY: -10, floatDur: 6 },
  { id: 11, src: "streets-2",         top: "72%", left: "68%", width: 105, height: 105, delay: 0.8,  revealGroup: 2, depth: 0.035, floatY: -10, floatDur: 5 },
  { id: 12, src: "blaze-3",           top: "88%", left: "88%", width: 135, height: 85,  delay: 0.3,  revealGroup: 0, depth: 0.05,  floatY: -10, floatDur: 5 },
  { id: 13, src: "community-3",       top: "38%", left: "88%", width: 75,  height: 115, delay: 1.4,  revealGroup: 3, depth: 0.065, floatY: -10, floatDur: 6 },
  { id: 14, src: "streets-4",         top: "58%", left: "8%",  width: 95,  height: 95,  delay: 1.0,  revealGroup: 2, depth: 0.08,  floatY: -10, floatDur: 5 },
  { id: 15, src: "ruins-3",           top: "8%",  left: "8%",  width: 80,  height: 80,  delay: 0.6,  revealGroup: 1, depth: 0.02,  floatY: -10, floatDur: 4 },
  { id: 16, src: "blaze-2",           top: "85%", left: "25%", width: 90,  height: 90,  delay: 0.85, revealGroup: 2, depth: 0.035, floatY: -10, floatDur: 5 },
];

const MOBILE_SLOTS: Slot[] = [
  { id: 1,  src: "ruins-1",           top: "8%",  left: "5%",  width: 80,  height: 100, delay: 0.1,  revealGroup: 0, depth: 0.03,  floatY: -8, floatDur: 5 },
  { id: 2,  src: "community-1",       top: "6%",  left: "65%", width: 90,  height: 90,  delay: 0.3,  revealGroup: 0, depth: 0.04,  floatY: -8, floatDur: 5 },
  { id: 3,  src: "streets-3",         top: "25%", left: "2%",  width: 85,  height: 70,  delay: 0.5,  revealGroup: 1, depth: 0.05,  floatY: -8, floatDur: 6 },
  { id: 4,  src: "families-2",        top: "28%", left: "72%", width: 80,  height: 100, delay: 0.7,  revealGroup: 1, depth: 0.035, floatY: -8, floatDur: 5 },
  { id: 5,  src: "blaze-1",           top: "48%", left: "5%",  width: 90,  height: 70,  delay: 0.9,  revealGroup: 2, depth: 0.04,  floatY: -8, floatDur: 5 },
  { id: 6,  src: "streets-1",         top: "50%", left: "75%", width: 75,  height: 95,  delay: 1.1,  revealGroup: 2, depth: 0.05,  floatY: -8, floatDur: 6 },
  { id: 7,  src: "community-3",       top: "70%", left: "8%",  width: 85,  height: 85,  delay: 1.3,  revealGroup: 3, depth: 0.03,  floatY: -8, floatDur: 5 },
  { id: 8,  src: "palisades-before",  top: "75%", left: "40%", width: 80,  height: 110, delay: 1.0,  revealGroup: 2, depth: 0.02,  floatY: -6, floatDur: 6 },
  { id: 9,  src: "ruins-2",           top: "72%", left: "70%", width: 90,  height: 75,  delay: 1.5,  revealGroup: 3, depth: 0.04,  floatY: -8, floatDur: 5 },
];

const PALISADES_ID_DESKTOP = 10;
const PALISADES_ID_MOBILE = 8;

const SUBTITLES = [
  "homes built over decades,",
  "stability,",
  "sense of belonging,",
  "family memories,",
  "entire neighborhoods.",
];

const SUBTITLE_INTERVAL = 2000;
const SUBTITLE_START_DELAY = 400;
const TITLE_REVEAL_DELAY = 150;

const GLIMMER_CYCLE_MS = 5000;

// ── Quote word-by-word reveal data ───────────────────────────────────────────
const QUOTE_WORDS = "This tragedy marks one of the most heartbreaking days of our career. Witnessing incredible buildings, cherished memories, and vibrant lives reduced to ashes is beyond devastating.".split(" ");
const QUOTE_WORD_STAGGER = 0.07;
const QUOTE_WORD_DURATION = 0.9;

function isInHeaderZone(slot: Slot): boolean {
  const top = parseFloat(slot.top);
  const left = parseFloat(slot.left);
  return (top < 25 && left > 55) || (top < 15 && left < 15);
}

// ── Burn helpers ──────────────────────────────────────────────────────────────
function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }
function mapR(x: number, a: number, b: number) { return clamp((x - a) / (b - a), 0, 1); }
function eio(t: number) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }

const P4_BURN_IN    = 0.02;
const P4_BURN_START = 0.08;
const P4_BURN_END   = 1.00;

const VS_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FS_SRC = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_top;
uniform sampler2D u_bot;
uniform float u_progress;
uniform float u_noise;
uniform float u_edge;
uniform float u_bloom;
uniform vec3 u_glow;
uniform float u_top_aspect;
uniform float u_bot_aspect;
uniform float u_canvas_aspect;

vec2 coverUV(vec2 uv, float imgAspect, float canvasAspect) {
  if (canvasAspect > imgAspect) {
    float s = imgAspect / canvasAspect;
    return vec2(uv.x, (uv.y - 0.5) * s + 0.5);
  } else {
    float s = canvasAspect / imgAspect;
    return vec2((uv.x - 0.5) * s + 0.5, uv.y);
  }
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float smoothNoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u2 = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u2.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u2.x),u2.y);
}
float fbm(vec2 p) {
  float v=0.0,a=0.5;
  for(int i=0;i<5;i++){ v+=a*smoothNoise(p); p*=2.1; a*=0.5; }
  return v;
}
void main() {
  vec2 topUV = coverUV(v_uv, u_top_aspect, u_canvas_aspect);
  vec2 botUV = coverUV(v_uv, u_bot_aspect, u_canvas_aspect);
  float burnLine = 1.05 - u_progress * 1.15;
  float n = fbm(vec2(v_uv.x * u_canvas_aspect, v_uv.y) * u_noise) * 2.0 - 1.0;
  float threshold = burnLine + n * 0.12;
  float dist = v_uv.y - threshold;
  vec4 topCol = texture2D(u_top, topUV);
  if (dist > u_edge) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }
  vec4 col;
  vec4 botDark = vec4(texture2D(u_bot, botUV).rgb * 0.4, 1.0);
  if (dist < -u_edge) {
    col = topCol;
  } else {
    float t = (dist + u_edge) / (2.0 * u_edge);
    float glowAmt = sin(t * 3.14159) * u_bloom;
    vec4 blended = mix(topCol, botDark, t);
    col = vec4(mix(blended.rgb, u_glow, glowAmt * 0.85), 1.0);
    col.rgb += u_glow * glowAmt * 0.4;
  }
  float outerDist = abs(dist);
  float outerEdge = u_edge * 4.0;
  if (outerDist < outerEdge && outerDist >= u_edge * 0.5) {
    float bloom = pow(1.0 - outerDist/outerEdge, 2.0) * u_bloom * 0.3;
    col.rgb += u_glow * bloom;
  }
  gl_FragColor = clamp(col, 0.0, 1.0);
}`;

// ── Scroll thresholds ────────────────────────────────────────────────────────
const EXPAND_TRIGGER  = 0.45; // scroll down past this → expand
const COLLAPSE_TRIGGER = 0.35; // scroll back below this → collapse
const REVERSE_TRIGGER  = 0.55; // scroll back below this → reverse burn + hide quote

// ── Single floating image card ───────────────────────────────────────────────
function FloatingImageCard({
  slot,
  isRevealed,
  isGlimmered,
  currentSrc,
  smoothMouseX,
  smoothMouseY,
  shouldReduceMotion,
  headerVisible,
}: {
  slot: Slot;
  isRevealed: boolean;
  isGlimmered: boolean;
  currentSrc: string;
  smoothMouseX: MotionValue<number>;
  smoothMouseY: MotionValue<number>;
  shouldReduceMotion: boolean | null;
  headerVisible: boolean;
}) {
  const x = useTransform(smoothMouseX, (v) => v * slot.depth);
  const y = useTransform(smoothMouseY, (v) => v * slot.depth);
  const hideForHeader = headerVisible && isInHeaderZone(slot);

  return (
    <motion.div
      style={{
        position: "absolute",
        top: slot.top,
        left: slot.left,
        width: slot.width,
        height: slot.height,
        x,
        y,
      }}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.85, filter: "blur(12px)" }}
      animate={isRevealed ? {
        opacity: hideForHeader ? 0 : (isGlimmered ? 0 : 1),
        scale: 1,
        filter: "blur(0px)",
      } : {}}
      transition={{
        duration: 0.8,
        delay: slot.delay,
        ease: EASE_REVEAL,
        opacity: { duration: hideForHeader ? 0.4 : (isGlimmered ? 0.6 : 0.8) },
      }}
    >
      <motion.div
        style={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden" }}
        animate={isRevealed ? { y: [0, slot.floatY, 0] } : {}}
        transition={{
          duration: slot.floatDur,
          repeat: Infinity,
          ease: "easeInOut",
          delay: slot.delay + 0.8,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/${currentSrc}.webp`}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="eager"
          draggable={false}
        />
      </motion.div>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function DestroyingCosmos() {
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [revealedGroups, setRevealedGroups] = useState<Set<number>>(new Set());
  const [glimmeredSlots, setGlimmeredSlots] = useState<Set<number>>(new Set());
  const [slotSrcs, setSlotSrcs] = useState<Map<number, string>>(new Map());
  const [allRevealed, setAllRevealed] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const slots = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;
  const palisadesId = isMobile ? PALISADES_ID_MOBILE : PALISADES_ID_DESKTOP;

  // ── Phase state machine ─────────────────────────────────────────────────
  // 0 = cosmos, 1 = expanded, 2 = complete (burn done + quote visible)
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const goPhase = useCallback((p: number) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // ── Burn refs ──────────────────────────────────────────────────────────
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const scrollVRef     = useRef(0);
  const rafRef         = useRef<number>(0);
  const beforeImgRef   = useRef<HTMLImageElement | null>(null);
  const afterImgRef    = useRef<HTMLImageElement | null>(null);
  const glRef          = useRef<WebGLRenderingContext | null>(null);
  const uProgressRef   = useRef<WebGLUniformLocation | null>(null);
  const afterImgElRef  = useRef<HTMLImageElement>(null);
  const autoBurnRafRef = useRef<number>(0);
  const burnDirRef     = useRef<"forward" | "reverse" | null>(null);
  const [imgsReady, setImgsReady] = useState(false);

  // ── Smooth cursor parallax ─────────────────────────────────────────────
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { damping: 25, stiffness: 150 });
  const smoothMouseY = useSpring(mouseY, { damping: 25, stiffness: 150 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    mouseX.set(e.clientX - window.innerWidth / 2);
    mouseY.set(e.clientY - window.innerHeight / 2);
  };

  const textX = useTransform(smoothMouseX, (v) => v * 0.01);
  const textY = useTransform(smoothMouseY, (v) => v * 0.01);

  // ── Preload images ─────────────────────────────────────────────────────
  useEffect(() => {
    SOURCES.forEach((src) => { const img = new Image(); img.src = `/${src}.webp`; });
    let loaded = 0;
    const check = () => { if (++loaded === 2) setImgsReady(true); };
    const b = new Image(); b.onload = check; b.src = "/palisades-before.webp";
    const a = new Image(); a.onload = check; a.src = "/palisades-after.webp";
    beforeImgRef.current = b;
    afterImgRef.current = a;
  }, []);

  // ── Header visibility ──────────────────────────────────────────────────
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) setHeaderVisible(false);
      else if (y < lastY) setHeaderVisible(true);
      else setHeaderVisible(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── IntersectionObserver — only reset when scrolling back ABOVE section ──
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Only reset if the element is BELOW the viewport (user scrolled back up above it)
          const rect = entry.boundingClientRect;
          const scrolledPast = rect.top < 0; // element is above viewport = user scrolled forward past it
          if (scrolledPast) {
            // Scrolled forward past section — keep state frozen, just mark not visible
            setIsVisible(false);
          } else {
            // Scrolled back above section — full reset
            setIsVisible(false);
            setShowTitle(false);
            setShowSubtitle(false);
            setSubtitleIndex(0);
            setRevealedGroups(new Set());
            setGlimmeredSlots(new Set());
            setAllRevealed(false);
            goPhase(0);
            burnDirRef.current = null;
            if (autoBurnRafRef.current) cancelAnimationFrame(autoBurnRafRef.current);
            scrollVRef.current = 0;
            if (afterImgElRef.current) afterImgElRef.current.style.opacity = "0";
            if (canvasRef.current) canvasRef.current.style.opacity = "0";
          }
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [goPhase]);

  // ── Title reveal ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(() => setShowTitle(true), TITLE_REVEAL_DELAY);
    return () => clearTimeout(t);
  }, [isVisible]);

  // ── Subtitle cycling ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isVisible) return;
    let count = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    const showTimer = setTimeout(() => setShowSubtitle(true), SUBTITLE_START_DELAY);
    const cycleTimer = setTimeout(() => {
      interval = setInterval(() => {
        count++;
        if (count >= SUBTITLES.length - 1) {
          setSubtitleIndex((prev) => Math.max(prev, SUBTITLES.length - 1));
          if (interval) clearInterval(interval);
        } else {
          setSubtitleIndex((prev) => Math.max(prev, count));
        }
      }, SUBTITLE_INTERVAL);
    }, SUBTITLE_START_DELAY + SUBTITLE_INTERVAL);
    return () => { clearTimeout(showTimer); clearTimeout(cycleTimer); if (interval) clearInterval(interval); };
  }, [isVisible]);

  // ── Reveal groups ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isVisible) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const maxGroup = Math.max(...slots.map((s) => s.revealGroup));
    const initSrcs = new Map<number, string>();
    slots.forEach((s) => initSrcs.set(s.id, s.src));
    setSlotSrcs(initSrcs);

    const groupDelays = [0, 600, 1200, 1800, 2400];
    for (let g = 0; g <= maxGroup; g++) {
      const t = setTimeout(() => {
        if (phaseRef.current >= 1) return; // Don't play sounds during expand/burn/quote
        setRevealedGroups((prev) => { const next = new Set(prev); next.add(g); return next; });
        playTick(3400 - g * 150, 0.04, 0.035);
        if (g === maxGroup) setTimeout(() => setAllRevealed(true), 1500);
      }, groupDelays[g] ?? groupDelays[groupDelays.length - 1] + (g - groupDelays.length + 1) * 700);
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
  }, [isVisible, slots]);

  // ── Glimmer — only active in phase 0 ─────────────────────────────────
  useEffect(() => {
    if (!allRevealed || phase >= 1) return;
    const nonPalisades = slots.filter((s) => s.id !== palisadesId).map((s) => s.id);
    const interval = setInterval(() => {
      if (phaseRef.current >= 1) return; // Guard against race
      const target = nonPalisades[Math.floor(Math.random() * nonPalisades.length)];
      setGlimmeredSlots((prev) => { const next = new Set(prev); next.add(target); return next; });
      setTimeout(() => {
        setSlotSrcs((prev) => {
          const updated = new Map(prev);
          const current = updated.get(target);
          let pick: string;
          do { pick = SOURCES[Math.floor(Math.random() * SOURCES.length)]; } while (pick === current);
          updated.set(target, pick);
          return updated;
        });
        setGlimmeredSlots((prev) => { const next = new Set(prev); next.delete(target); return next; });
      }, 700);
    }, GLIMMER_CYCLE_MS);
    return () => clearInterval(interval);
  }, [allRevealed, phase, slots, palisadesId]);

  // ── Burn visuals update (direct DOM, no re-renders) ────────────────────
  const updateBurnVisuals = useCallback((cv: number) => {
    scrollVRef.current = cv;
    const canvasOp = mapR(cv, P4_BURN_IN, P4_BURN_IN + 0.04);
    const layerOp = Math.max(0.001, canvasOp);
    if (afterImgElRef.current) afterImgElRef.current.style.opacity = String(layerOp);
    if (canvasRef.current) canvasRef.current.style.opacity = String(layerOp);
  }, []);

  // ── Burn animation functions ───────────────────────────────────────────
  const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });

  const startForwardBurn = useCallback(() => {
    if (burnDirRef.current) cancelAnimationFrame(autoBurnRafRef.current);
    burnDirRef.current = "forward";
    const duration = 5000;
    let start = 0;
    const from = scrollVRef.current;

    const tick = (now: number) => {
      if (!start) start = now;
      if (burnDirRef.current !== "forward") return;
      const t = Math.min((now - start) / duration, 1);
      updateBurnVisuals(from + (1 - from) * eio(t));
      if (t < 1) {
        autoBurnRafRef.current = requestAnimationFrame(tick);
      } else {
        burnDirRef.current = null;
        goPhase(2); // burn complete → show quote
      }
    };

    // Small delay for visual settle after expand
    setTimeout(() => {
      if (burnDirRef.current === "forward") {
        autoBurnRafRef.current = requestAnimationFrame(tick);
      }
    }, 400);
  }, [updateBurnVisuals, goPhase]);

  const startReverseBurn = useCallback(() => {
    if (burnDirRef.current) cancelAnimationFrame(autoBurnRafRef.current);
    burnDirRef.current = "reverse";
    const duration = 3000; // faster reverse
    let start = 0;
    const from = scrollVRef.current;

    const tick = (now: number) => {
      if (!start) start = now;
      if (burnDirRef.current !== "reverse") return;
      const t = Math.min((now - start) / duration, 1);
      updateBurnVisuals(from * (1 - eio(t)));
      if (t < 1) {
        autoBurnRafRef.current = requestAnimationFrame(tick);
      } else {
        burnDirRef.current = null;
        // Reverse done: collapse if scroll is back far enough
        const sv = scrollYProgress.get();
        if (sv < COLLAPSE_TRIGGER) {
          goPhase(0);
        } else if (sv >= EXPAND_TRIGGER) {
          // User scrolled forward again during reverse — re-burn
          startForwardBurn();
        }
        // Otherwise stay at phase 1 (expanded, waiting)
      }
    };

    autoBurnRafRef.current = requestAnimationFrame(tick);
  }, [updateBurnVisuals, goPhase, scrollYProgress, startForwardBurn]);

  // ── Scroll-driven phase transitions ────────────────────────────────────
  const isVisibleRef = useRef(false);
  useEffect(() => { isVisibleRef.current = isVisible; }, [isVisible]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!isVisibleRef.current) return;
    const p = phaseRef.current;

    // Phase 0: cosmos — subtitle advancement + forward trigger
    if (p === 0) {
      const scrollIdx = Math.min(
        SUBTITLES.length - 1,
        Math.floor((v / (EXPAND_TRIGGER - 0.05)) * SUBTITLES.length)
      );
      setSubtitleIndex((prev) => Math.max(prev, scrollIdx));

      if (v >= EXPAND_TRIGGER) {
        goPhase(1);
        // Expand animation starts via phase >= 1 → motion.div animate
        // onAnimationComplete will trigger forward burn
      }
    }

    // Phase 1: expanded — backward collapse trigger
    if (p === 1) {
      if (v < COLLAPSE_TRIGGER && !burnDirRef.current) {
        goPhase(0);
      }
    }

    // Phase 2: burn complete + quote visible — no reverse allowed
    // Once the burn finishes and the quote appears, the transition is permanent.
  });

  // ── Palisades expand/collapse completion handler ────────────────────────
  const handlePalisadesComplete = useCallback(() => {
    // Only start forward burn if we just expanded (phase 1, no burn running)
    if (phaseRef.current === 1 && !burnDirRef.current && imgsReady) {
      startForwardBurn();
    }
  }, [startForwardBurn, imgsReady]);

  // ── WebGL setup + render loop ──────────────────────────────────────────
  useEffect(() => {
    if (!imgsReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const opts = { alpha: true, premultipliedAlpha: false };
    const gl = (canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) return;
    glRef.current = gl;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error("Shader error:", gl.getShaderInfoLog(s));
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS_SRC));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS_SRC));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uProgressRef.current = gl.getUniformLocation(prog, "u_progress");
    const uNoise       = gl.getUniformLocation(prog, "u_noise");
    const uEdge        = gl.getUniformLocation(prog, "u_edge");
    const uBloom       = gl.getUniformLocation(prog, "u_bloom");
    const uGlow        = gl.getUniformLocation(prog, "u_glow");
    const uTop         = gl.getUniformLocation(prog, "u_top");
    const uBot         = gl.getUniformLocation(prog, "u_bot");
    const uTopAspect   = gl.getUniformLocation(prog, "u_top_aspect");
    const uBotAspect   = gl.getUniformLocation(prog, "u_bot_aspect");
    const uCanvasAspect = gl.getUniformLocation(prog, "u_canvas_aspect");

    gl.uniform1f(uNoise, 10.8);
    gl.uniform1f(uEdge, 0.02);
    gl.uniform1f(uBloom, 1.0);
    gl.uniform3fv(uGlow, [1.0, 1.0, 1.0]);
    gl.uniform1i(uTop, 0);
    gl.uniform1i(uBot, 1);

    const bImg = beforeImgRef.current!;
    const aImg = afterImgRef.current!;
    gl.uniform1f(uTopAspect, bImg.naturalWidth / bImg.naturalHeight);
    gl.uniform1f(uBotAspect, aImg.naturalWidth / aImg.naturalHeight);

    const loadTex = (img: HTMLImageElement, unit: number) => {
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      return tex;
    };
    loadTex(beforeImgRef.current!, 0);
    loadTex(afterImgRef.current!, 1);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uCanvasAspect, canvas.width / canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const burnP = mapR(scrollVRef.current, P4_BURN_START, P4_BURN_END);
      gl.uniform1f(uProgressRef.current, burnP);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [imgsReady]);

  const pSlot = slots.find((s) => s.id === palisadesId)!;

  return (
    <div id="destruction" ref={outerRef} style={{ height: "700vh" }}>
      <div
        ref={stickyRef}
        onMouseMove={handleMouseMove}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          backgroundColor: "#F8F2E4",
        }}
      >
        {/* Regular floating images — visible in phase 0, hidden in phase >= 1 */}
        <motion.div
          animate={{ opacity: phase >= 1 ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        >
          {slots.map((slot) => {
            if (slot.id === palisadesId) return null;
            const isRevealed = revealedGroups.has(slot.revealGroup);
            const isGlimmered = glimmeredSlots.has(slot.id);
            const currentSrc = slotSrcs.get(slot.id) ?? slot.src;
            return (
              <FloatingImageCard
                key={slot.id}
                slot={slot}
                isRevealed={isRevealed}
                isGlimmered={isGlimmered}
                currentSrc={currentSrc}
                smoothMouseX={smoothMouseX}
                smoothMouseY={smoothMouseY}
                shouldReduceMotion={shouldReduceMotion}
                headerVisible={headerVisible}
              />
            );
          })}
        </motion.div>

        {/* Palisades card — smooth expand/collapse in both directions */}
        <motion.div
          style={{
            position: "absolute",
            zIndex: 20,
            overflow: "hidden",
          }}
          initial={{
            top: pSlot.top,
            left: pSlot.left,
            width: pSlot.width,
            height: pSlot.height,
            borderRadius: 16,
          }}
          animate={phase >= 1 ? {
            top: "0%",
            left: "0%",
            width: "100%",
            height: "100%",
            borderRadius: 0,
          } : {
            top: pSlot.top,
            left: pSlot.left,
            width: pSlot.width,
            height: pSlot.height,
            borderRadius: 16,
          }}
          transition={{
            duration: 0.9,
            ease: [0.23, 1, 0.32, 1],
          }}
          onAnimationComplete={handlePalisadesComplete}
        >
          <motion.div
            style={{ width: "100%", height: "100%", overflow: "hidden" }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.85, filter: "blur(12px)" }}
            animate={revealedGroups.has(pSlot.revealGroup) ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.8, delay: pSlot.delay, ease: EASE_REVEAL }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/palisades-before.webp"
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              loading="eager"
              draggable={false}
            />
          </motion.div>
        </motion.div>

        {/* ── Burn layers ── */}

        {/* Darkened after image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={afterImgElRef}
          src="/palisades-after.webp"
          alt=""
          decoding="async"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 22,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.4)",
            opacity: 0,
            pointerEvents: "none",
            willChange: "opacity",
          }}
        />

        {/* WebGL burn canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            opacity: 0,
            pointerEvents: "none",
            willChange: "opacity",
          }}
        />

        {/* Quote — centered, word-by-word blur reveal when phase >= 2 */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 35,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            padding: isMobile ? "0 24px" : "0 80px",
          }}
        >
          <div style={{ maxWidth: isMobile ? "100%" : "780px", textAlign: "center" }}>
            {/* Large quotation mark */}
            <motion.span
              style={{
                display: "block",
                fontFamily: "var(--font-playfair), serif",
                fontSize: isMobile ? "60px" : "80px",
                fontWeight: 400,
                color: "#F8F2E4",
                lineHeight: 1,
                marginBottom: isMobile ? "16px" : "24px",
                willChange: "filter, opacity",
              }}
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={phase >= 2
                ? { opacity: 1, filter: "blur(0px)" }
                : { opacity: 0, filter: "blur(6px)" }}
              transition={phase >= 2
                ? { duration: 0.8, ease: EASE_OUT_QUINT }
                : { duration: 0.3 }}
            >
              &ldquo;
            </motion.span>

            {/* Quote text — word by word blur reveal (forward) / quick fade (reverse) */}
            <p
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: isMobile ? "24px" : "40px",
                fontWeight: 400,
                color: "#F8F2E4",
                lineHeight: "100%",
                letterSpacing: "-0.02em",
                textAlign: "center",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                margin: 0,
              }}
            >
              {QUOTE_WORDS.map((word, i) => (
                <motion.span
                  key={i}
                  style={{
                    display: "inline-block",
                    willChange: "filter, opacity, transform",
                  }}
                  initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                  animate={phase >= 2
                    ? { opacity: 1, y: 0, filter: "blur(0px)" }
                    : { opacity: 0, y: 14, filter: "blur(6px)" }}
                  transition={phase >= 2 ? {
                    duration: QUOTE_WORD_DURATION,
                    ease: EASE_OUT_QUINT,
                    delay: 0.3 + i * QUOTE_WORD_STAGGER,
                    filter: {
                      duration: 1.1,
                      ease: EASE_OUT_QUINT,
                      delay: 0.3 + i * QUOTE_WORD_STAGGER,
                    },
                  } : {
                    duration: 0.3,
                    delay: 0,
                  }}
                >
                  {word}{i < QUOTE_WORDS.length - 1 ? "\u00A0" : null}
                </motion.span>
              ))}
            </p>

            {/* Attribution */}
            <motion.p
              style={{
                fontFamily: "'Alte Haas Grotesk', sans-serif",
                fontSize: isMobile ? "14px" : "18px",
                fontWeight: 700,
                color: "#F8F2E4",
                lineHeight: "100%",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textAlign: "center",
                marginTop: isMobile ? "24px" : "36px",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                willChange: "filter, opacity",
              }}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={phase >= 2
                ? { opacity: 1, filter: "blur(0px)" }
                : { opacity: 0, filter: "blur(4px)" }}
              transition={phase >= 2 ? {
                duration: 0.8,
                ease: EASE_OUT_QUINT,
                delay: 0.3 + QUOTE_WORDS.length * QUOTE_WORD_STAGGER + 0.3,
              } : {
                duration: 0.3,
                delay: 0,
              }}
            >
              ~ Ardie Tavangarian
            </motion.p>
          </div>
        </div>

        {/* Center text — "Destroying [subtitle]" — visible in phase 0 only */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 15,
            pointerEvents: "none",
          }}
          animate={{ opacity: phase >= 1 ? 0 : 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.h2
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: isMobile ? "40px" : "56px",
              fontWeight: 400,
              lineHeight: "110%",
              letterSpacing: "-0.02em",
              color: "#616D45",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              margin: 0,
              textAlign: "center",
              x: textX,
              y: textY,
              display: "inline-block",
              willChange: "filter, opacity, transform",
            }}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={showTitle ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            transition={{
              duration: 0.9,
              ease: EASE_OUT_QUINT,
              filter: { duration: 1.1, ease: EASE_OUT_QUINT },
            }}
          >
            Destroying
          </motion.h2>

          <div style={{ minHeight: isMobile ? "52px" : "66px", marginTop: "4px" }}>
            <AnimatePresence mode="wait">
              {showSubtitle && (
                <motion.p
                  key={subtitleIndex}
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: isMobile ? "40px" : "56px",
                    fontWeight: 400,
                    lineHeight: "110%",
                    letterSpacing: "-0.02em",
                    color: "#616D45",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                    margin: 0,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    willChange: "filter, opacity, transform",
                  }}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={{
                    duration: 0.9,
                    ease: EASE_OUT_QUINT,
                    filter: { duration: 1.1, ease: EASE_OUT_QUINT },
                  }}
                >
                  {SUBTITLES[subtitleIndex]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
