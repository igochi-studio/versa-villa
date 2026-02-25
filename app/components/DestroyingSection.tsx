"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";
import { SpeakerLoudIcon, SpeakerOffIcon } from "@radix-ui/react-icons";
import { useDialKit } from "dialkit";

/* ─────────────────────────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — Destroying Section (Image Reveals)
 *
 * Trigger: scroll position within 1700vh section
 * burnProgress 0→1 over first 1000vh, horizProgress 0→1 over last 700vh
 *
 * RULE #1: The screen is NEVER blank.
 *          Old batch holds as a dimmed backdrop until the next phase replaces it.
 *          Images crossfade like double-exposed film — new memories over old.
 *
 * RULE #2: First scroll = immediate content.
 *          Two images materialize within the first ~30vh of scrolling.
 *          No empty staring at a blank screen wondering if it's broken.
 *
 * Five lifecycle states per image:
 *
 *   FUTURE     opacity 0, blur 8px, scale 0.97
 *              → not yet — invisible, waiting for its scroll threshold
 *
 *   ENTER      opacity 0→1, blur 8→0px, scale 0.97→1.0         [0.55s]
 *              → rack-focus reveal with ease-out-quart
 *              → blur clears ×1.4 slower than opacity
 *              → scale settles ×1.6 slower — subtle "breathing in"
 *
 *   ACTIVE     opacity 1, blur 0, scale 1
 *              → sharp, present, fully in focus
 *
 *   BACKDROP   opacity 0.25, blur 6px, scale 0.99               [0.5s]
 *              → previous phase's batch — dimmed but present
 *              → keeps the screen populated during crossfade
 *              → ease-in-out-quart for graceful recession
 *
 *   GONE       opacity 0, blur 8px, scale 0.98                  [0.4s]
 *              → 2+ phases old — fully exits
 *              → or: phase 4 wipe — everything clears for burn
 *
 * Phase transitions (the crossfade):
 *   When activePhase advances from N to N+1:
 *     • Batch N:   ACTIVE → BACKDROP (dims to 25%, softens)
 *     • Batch N-1: BACKDROP → GONE (now two phases old, exit)
 *     • Batch N+1: images ENTER one-by-one as scroll hits thresholds
 *   At no point is the screen empty. Batch N holds as BACKDROP
 *   while Batch N+1 materializes on top.
 *
 *   Phase 4 exception: ALL previous batches → GONE immediately
 *   (wipe for the before/after burn transition)
 *
 * Reveal cadence (burnProgress thresholds):
 *   Each batch is spread across its FULL phase — no front-loading.
 *   Something new appears roughly every 50–85vh of scrolling.
 *   Batch 0: 0.003, 0.07, 0.14, 0.003  (TL+BR diagonal first, TR at 70vh, BL at 140vh)
 *   Batch 1: 0.23, 0.28, 0.33           (fills 0.22→0.36, ~70vh apart)
 *   Batch 2: 0.37, 0.40, 0.44, 0.48    (fills 0.36→0.50, ~50vh apart)
 *   Batch 3: 0.51, 0.55, 0.60           (fills 0.50→0.64, ~65vh apart)
 *   Batch 4: 0.65 (single image)
 * ─────────────────────────────────────────────────────────────────────────── */

const EASE_OUT_QUART    = [0.165, 0.84, 0.44, 1] as const;  // enter — snappy arrival
const EASE_IN_OUT_QUART = [0.77, 0, 0.175, 1] as const;     // exit/backdrop — natural
const BLUR_EASE = EASE_IN_OUT_QUART;                          // alias for legacy code

// ─── Scroll timeline ─────────────────────────────────────────────────────────
const TEXT_VISIBLE_AT = 0.005;
const PHASE_START = [0, 0.22, 0.36, 0.50, 0.64];

const REVEAL_AT = [
  0.003, 0.07, 0.14, 0.003,  // Batch 0 — TL+BR diagonal first, TR at 70vh, BL at 140vh
  0.23, 0.28, 0.33,           // Batch 1 — fills phase (0.22→0.36)
  0.37, 0.40, 0.44, 0.48,    // Batch 2 — steady cadence (0.36→0.50)
  0.51, 0.55, 0.60,           // Batch 3 — fills phase (0.50→0.64)
  0.65,                        // Batch 4 — palisades-before
];

const BATCH_OF  = (i: number) => (i < 4 ? 0 : i < 7 ? 1 : i < 11 ? 2 : i < 14 ? 3 : 4);
const PHASE_TEXT = [
  "homes built over decades,",
  "family memories,",
  "stability,",
  "sense of belonging,",
  "entire neighborhoods.",
];

const P4_EXPAND_ON  = 0.70;
const P4_EXPAND_OFF = 0.80;
const P4_BURN_IN    = 0.78;
const P4_BURN_START = 0.82;
const P4_BURN_END   = 1.00;


interface ImageSlot {
  src: string; left?: string; right?: string; top?: string; bottom?: string;
  width: string; height: string;
}

const ALL_IMAGES: ImageSlot[] = [
  { src: "ruins-1",   left:  "4vw", top:    "5vh", width: "22vw", height: "30vh" },
  { src: "ruins-2",   right: "4vw", top:    "5vh", width: "22vw", height: "30vh" },
  { src: "ruins-3",   left: "29vw", bottom: "5vh", width: "22vw", height: "31vh" },
  { src: "ruins-4",   right: "4vw", bottom: "5vh", width: "20vw", height: "28vh" },
  { src: "families-1",   left: "34vw", top:  "2vh",   width: "34vw", height: "38vh" },
  { src: "families-2",   left:  "2vw", top: "44vh",   width: "23vw", height: "43vh" },
  { src: "families-3",   left: "48vw", top: "57vh",   width: "31vw", height: "36vh" },
  { src: "streets-1",  left: "15vw", top:  "2vh",   width: "24vw", height: "33vh" },
  { src: "streets-2",  right: "8vw", top:  "7vh",   width: "23vw", height: "35vh" },
  { src: "streets-3",  left: "10vw", top: "60vh",   width: "24vw", height: "34vh" },
  { src: "streets-4",  left: "37vw", top: "62vh",   width: "27vw", height: "33vh" },
  { src: "blaze-1",   left:  "3vw", top: "33vh",   width: "27vw", height: "41vh" },
  { src: "blaze-2",   right: "5vw", top:  "4vh",   width: "43vw", height: "34vh" },
  { src: "blaze-3",   left: "36vw", top: "62vh",   width: "27vw", height: "33vh" },
  { src: "palisades-before",left: "33vw", top: "61vh",   width: "34vw", height: "28vh" },
];

const ALL_IMAGES_MOBILE: ImageSlot[] = [
  { src: "ruins-1",   left:  "2vw", top:  "2vh",  width: "45vw", height: "30vh" },
  { src: "ruins-2",   right: "2vw", top:  "2vh",  width: "45vw", height: "30vh" },
  { src: "ruins-3",   left:  "2vw", top: "68vh",  width: "45vw", height: "26vh" },
  { src: "ruins-4",   right: "2vw", top: "68vh",  width: "45vw", height: "26vh" },
  { src: "families-1",   left:  "5vw", top:  "2vh",  width: "90vw", height: "34vh" },
  { src: "families-2",   left:  "2vw", top: "68vh",  width: "46vw", height: "28vh" },
  { src: "families-3",   right: "2vw", top: "68vh",  width: "46vw", height: "28vh" },
  { src: "streets-1",  left:  "2vw", top:  "2vh",  width: "45vw", height: "30vh" },
  { src: "streets-2",  right: "2vw", top:  "2vh",  width: "45vw", height: "30vh" },
  { src: "streets-3",  left:  "2vw", top: "68vh",  width: "45vw", height: "26vh" },
  { src: "streets-4",  right: "2vw", top: "68vh",  width: "45vw", height: "26vh" },
  { src: "blaze-1",   left:  "2vw", top: "68vh",  width: "46vw", height: "26vh" },
  { src: "blaze-2",   right: "2vw", top:  "2vh",  width: "90vw", height: "28vh" },
  { src: "blaze-3",   right: "2vw", top: "68vh",  width: "46vw", height: "26vh" },
  { src: "palisades-before",left: "13vw", top: "68vh",  width: "74vw", height: "26vh" },
];

const B4_INIT_DESKTOP = { left: 33, top: 61, width: 34, height: 28 };
const B4_INIT_MOBILE  = { left: 13, top: 68, width: 74, height: 26 };

function lerp(a: number, b: number, t: number)   { return a + (b - a) * t; }
function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }
function mapR(x: number, a: number, b: number)    { return clamp((x - a) / (b - a), 0, 1); }
function eio(t: number) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }

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

// ── DialKit: tune image reveal transitions ────────────────
function useImageRevealDials() {
  return useDialKit("Image Reveals", {
    enter: {
      duration: [0.4, 0.1, 2.0],     // s — snappy reveal
      blur:     [8, 0, 20],          // px — starting soft focus
      scale:    [0.97, 0.9, 1.0],    // starting scale — "breathe in"
    },
    backdrop: {
      duration: [0.5, 0.1, 2.0],     // s — graceful dim
      opacity:  [0.25, 0, 0.5],      // dimmed but present
      blur:     [6, 0, 16],          // px — softened, not invisible
      scale:    [0.99, 0.95, 1.0],   // barely smaller
    },
    gone: {
      duration: [0.35, 0.1, 1.5],    // s — fast final exit
    },
  });
}

// ── DialKit: tune character blur reveal in real time ───────────
function useDestroyingRevealDials() {
  return useDialKit("Destroying Text Reveal", {
    timing: {
      stagger:  [0.03, 0.01, 0.15],  // seconds between characters
      duration: [0.5, 0.1, 2.0],     // seconds per character transition
    },
    effect: {
      blur:   [12, 0, 40],           // px — starting blur amount
      enterY: [6, 0, 30],            // px — vertical slide distance
    },
  });
}

function CharReveal({
  text,
  params,
  baseDelay = 0,
}: {
  text: string;
  params: ReturnType<typeof useDestroyingRevealDials>;
  baseDelay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const t = params.timing as { stagger: number; duration: number };
  const fx = params.effect as { blur: number; enterY: number };

  return (
    <span aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          style={{ display: "inline-block", willChange: "filter, opacity" }}
          initial={shouldReduceMotion ? false : {
            opacity: 0,
            filter: `blur(${fx.blur}px)`,
            y: fx.enterY,
          }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
          }}
          transition={{
            duration: t.duration,
            ease: EASE_OUT_QUART,
            delay: baseDelay + i * t.stagger,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

export default function DestroyingSection() {
  const revealParams = useDestroyingRevealDials();
  const imgParams    = useImageRevealDials();
  const isMobile     = useIsMobile();
  const sectionRef   = useRef<HTMLElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const scrollVRef   = useRef(0);
  const rafRef       = useRef<number>(0);
  const beforeImgRef = useRef<HTMLImageElement | null>(null);
  const afterImgRef  = useRef<HTMLImageElement | null>(null);
  const glRef        = useRef<WebGLRenderingContext | null>(null);
  const uProgressRef = useRef<WebGLUniformLocation | null>(null);
  const quoteRef     = useRef<HTMLDivElement>(null);
  const logoRef      = useRef<HTMLImageElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const flowerRef    = useRef<HTMLVideoElement>(null);

  const [activePhase,   setActivePhase]   = useState(0);
  const [revealedMask,  setRevealedMask]  = useState(0);
  const revealedMaskRef = useRef(0);
  const [textVisible,   setTextVisible]   = useState(false);
  const [imgsReady,     setImgsReady]     = useState(false);
  const [bgColor,       setBgColor]       = useState("#414833");
  const [isMuted,       setIsMuted]       = useState(false);

  // Refs for direct DOM manipulation of continuous values (no re-renders)
  const textVisibleRef   = useRef(false);
  const afterImgElRef    = useRef<HTMLImageElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const beforeClipRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setBgColor("#F7F5F0"), 2600);
    return () => clearTimeout(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // ── Split scroll: burn phase (first 50% = 1000vh) + horiz phase (last 50% = 1000vh) ──
  // burnProgress  0→1 over first 1000vh, clamps at 1 thereafter
  // horizProgress 0→0 during burn, then 0→1 over last 1000vh
  const burnProgress  = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 1]);
  const horizProgress = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0, 1]);

  // ── Horizontal slide transforms ──────────────────────────────────────────
  // 5 panels (P1-P3:100vw each, P4:165vw, P5:100vw = 565vw total)
  // Panel 2 (video) gets a long hold so people can't just scroll past it
  // Video hold zone: 0.13→0.48 (35% of horiz = 350vh of dead scroll on video)
  const containerSlideX = useTransform(
    horizProgress,
    [0.00, 0.10, 0.13, 0.48, 0.51, 0.74, 0.77, 0.90, 0.94, 1.0],
    ["0vw", "-100vw", "-100vw", "-200vw", "-200vw", "-365vw", "-365vw", "-465vw", "-465vw", "-465vw"]
  );
  // Panel 1 contracts to 0.95 as slide begins
  const panel1Scale     = useTransform(horizProgress, [0, 0.04], [1, 0.95]);

  // ── Parallax offsets — text lags slightly behind scroll for depth ──────
  const p3TextX   = useTransform(horizProgress, [0.48, 0.58], [40, 0]);
  const p3TextOp  = useTransform(horizProgress, [0.50, 0.56], [0, 1]);
  const p4TextOp  = useTransform(horizProgress, [0.54, 0.60], [0, 1]);
  const p4QuestOp = useTransform(horizProgress, [0.64, 0.70], [0, 1]);
  const p5TextX   = useTransform(horizProgress, [0.77, 0.92], [50, 0]);
  const p5TextOp  = useTransform(horizProgress, [0.79, 0.86], [0, 1]);
  // Photo vertical float — subtle upward drift as you scroll through P4
  const p4PhotoY  = useTransform(horizProgress, [0.51, 0.74], [20, -10]);

  // ── Burn scroll event — ref + discrete state only (no per-pixel re-render) ──
  useMotionValueEvent(burnProgress, "change", (v) => {
    const cv = Math.max(0, v);
    scrollVRef.current = cv;

    // ── Discrete state (React skips re-render if value unchanged) ──
    if (cv >= TEXT_VISIBLE_AT && !textVisibleRef.current) {
      textVisibleRef.current = true;
      setTextVisible(true);
    }

    const newPhase = cv < PHASE_START[1] ? 0 : cv < PHASE_START[2] ? 1 : cv < PHASE_START[3] ? 2 : cv < PHASE_START[4] ? 3 : 4;
    setActivePhase(newPhase);

    // Only re-render when a NEW image threshold is crossed (not every scroll tick)
    let mask = 0;
    for (let i = 0; i < REVEAL_AT.length; i++) {
      if (cv >= REVEAL_AT[i]) mask |= (1 << i);
    }
    if (mask !== revealedMaskRef.current) {
      revealedMaskRef.current = mask;
      setRevealedMask(mask);
    }

    // ── Direct DOM updates for continuous values (no re-render) ──
    const canvasOp = mapR(cv, P4_BURN_IN, P4_BURN_IN + 0.04);
    const expandP  = eio(mapR(cv, P4_EXPAND_ON, P4_EXPAND_OFF));
    const textOp   = newPhase === 4
      ? Math.max(0, 1 - mapR(cv, P4_EXPAND_ON, P4_EXPAND_ON + 0.06))
      : 1;

    const layerOp = Math.max(0.001, canvasOp); // never exactly 0 — keep layers composited
    if (afterImgElRef.current)    afterImgElRef.current.style.opacity = String(layerOp);
    if (canvasRef.current)        canvasRef.current.style.opacity     = String(layerOp);
    if (textContainerRef.current) textContainerRef.current.style.opacity = String(textOp);

    if (beforeClipRef.current) {
      const B4      = isMobile ? B4_INIT_MOBILE : B4_INIT_DESKTOP;
      const fadeIn  = mapR(cv, REVEAL_AT[14], REVEAL_AT[14] + 0.03);
      const opacity = fadeIn * (1 - canvasOp);
      const clipT   = lerp(B4.top,                    0, expandP);
      const clipL   = lerp(B4.left,                   0, expandP);
      const clipR   = lerp(100 - B4.left - B4.width,  0, expandP);
      const clipB   = lerp(100 - B4.top  - B4.height, 0, expandP);
      const clipRad = lerp(8, 0, expandP);
      beforeClipRef.current.style.opacity  = String(opacity);
      beforeClipRef.current.style.clipPath = `inset(${clipT}vh ${clipR}vw ${clipB}vh ${clipL}vw round ${clipRad}px)`;
    }
  });

  // ── Load before / after images ───────────────────────────────────────────
  useEffect(() => {
    let loaded = 0;
    const check = () => { if (++loaded === 2) setImgsReady(true); };
    const b = new Image(); b.onload = check; b.src = "/palisades-before.webp";
    const a = new Image(); a.onload = check; a.src = "/palisades-after.webp";
    beforeImgRef.current = b;
    afterImgRef.current  = a;
  }, []);

  // ── WebGL setup + render loop ─────────────────────────────────────────────
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
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,   VS_SRC));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS_SRC));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uProgressRef.current    = gl.getUniformLocation(prog, "u_progress");
    const uNoise            = gl.getUniformLocation(prog, "u_noise");
    const uEdge             = gl.getUniformLocation(prog, "u_edge");
    const uBloom            = gl.getUniformLocation(prog, "u_bloom");
    const uGlow             = gl.getUniformLocation(prog, "u_glow");
    const uTop              = gl.getUniformLocation(prog, "u_top");
    const uBot              = gl.getUniformLocation(prog, "u_bot");
    const uTopAspect        = gl.getUniformLocation(prog, "u_top_aspect");
    const uBotAspect        = gl.getUniformLocation(prog, "u_bot_aspect");
    const uCanvasAspect     = gl.getUniformLocation(prog, "u_canvas_aspect");

    gl.uniform1f(uNoise,  10.8);
    gl.uniform1f(uEdge,   0.02);
    gl.uniform1f(uBloom,  1.0);
    gl.uniform3fv(uGlow,  [1.0, 1.0, 1.0]);
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
    loadTex(afterImgRef.current!,  1);

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uCanvasAspect, canvas.width / canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    if (quoteRef.current) quoteRef.current.style.opacity = '0';

    const tick = () => {
      const sv    = scrollVRef.current;
      const burnP = mapR(sv, P4_BURN_START, P4_BURN_END);
      const alpha = mapR(sv, P4_BURN_IN,    P4_BURN_IN + 0.04);

      gl.uniform1f(uProgressRef.current, burnP);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (quoteRef.current)
        quoteRef.current.style.opacity = alpha >= 1 ? '1' : '0';

      if (logoRef.current) {
        const burnLineY  = (1.05 - burnP * 1.15) * window.innerHeight;
        const logoBottom = 40 + logoRef.current.offsetHeight;
        logoRef.current.style.opacity = burnLineY < logoBottom ? '1' : '0';
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [imgsReady]);

  // ── Video: autoplay with sound when Panel 2 slides into view ─────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    return horizProgress.on("change", (h) => {
      if (h > 0.06 && h < 0.40 && video.paused) {
        video.currentTime = 0;
        video.muted = false;
        video
          .play()
          .then(() => setIsMuted(false))
          .catch(() => {
            // Browser blocked unmuted autoplay — fall back to muted
            video.muted = true;
            video.play().then(() => setIsMuted(true)).catch(() => {});
          });
      }
      // Pause when scrolling away from Panel 2
      if ((h < 0.03 || h > 0.52) && !video.paused) {
        video.pause();
        if (h < 0.03) video.currentTime = 0;
      }
    });
  }, [horizProgress]);

  // ── Flower video: autoplay when Panel 5 is in view ─────────────────────
  useEffect(() => {
    const flower = flowerRef.current;
    if (!flower) return;

    return horizProgress.on("change", (h) => {
      if (h > 0.74 && flower.paused) {
        flower.muted = true;
        flower.play().catch(() => {});
      }
      if (h < 0.70 && !flower.paused) {
        flower.pause();
        flower.currentTime = 0;
      }
    });
  }, [horizProgress]);

  const handleVideoClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const images = isMobile ? ALL_IMAGES_MOBILE : ALL_IMAGES;

  return (
    <section ref={sectionRef} style={{ height: "2000vh" }}>
      <motion.div
        className="sticky top-0 overflow-hidden"
        style={{ height: "100vh" }}
        animate={{ backgroundColor: bgColor }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >

        {/* ── Sliding container: 565vw, slides left during horizontal phase ── */}
        <motion.div
          style={{
            position: "relative",
            width:    "565vw",
            height:   "100vh",
            x:        containerSlideX,
          }}
        >

          {/* ── Panel 1: All burn / after-image content ── */}
          <motion.div
            style={{
              position:        "absolute",
              left:            0,
              top:             0,
              width:           "100vw",
              height:          "100vh",
              scale:           panel1Scale,
              transformOrigin: "center center",
            }}
          >

            {/* Darkened after image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={afterImgElRef}
              src="/palisades-after.webp"
              alt=""
              decoding="async"
              style={{
                position:      "absolute",
                inset:         0,
                zIndex:        5,
                width:         "100%",
                height:        "100%",
                objectFit:     "cover",
                filter:        "brightness(0.4)",
                opacity:       0.001,
                pointerEvents: "none",
                willChange:    "opacity",
              }}
            />

            {/* Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={logoRef}
              src="/versa-villa-logo.svg"
              alt="Versa Villa"
              style={{
                position:      "absolute",
                top:           "40px",
                left:          "50%",
                transform:     "translateX(-50%)",
                height:        isMobile ? "36px" : "48px",
                width:         "auto",
                zIndex:        41,
                opacity:       0,
                pointerEvents: "none",
              }}
            />

            {/* WebGL burn canvas */}
            <canvas
              ref={canvasRef}
              style={{
                position:      "absolute",
                inset:         0,
                zIndex:        30,
                opacity:       0.001,
                pointerEvents: "none",
                willChange:    "opacity",
              }}
            />

            {/* Quote */}
            <div
              ref={quoteRef}
              aria-hidden
              style={{
                position:      "absolute",
                left:          isMobile ? "20px"             : "140px",
                ...(isMobile ? { top: "42vh" } : { bottom: "120px" }),
                zIndex:        20,
                pointerEvents: "none",
                width:         isMobile ? "min(340px, 92vw)" : "min(601px, 82vw)",
              }}
            >
              <p
                style={{
                  fontFamily:          "var(--font-inter), sans-serif",
                  fontSize:            isMobile ? "22px" : "32px",
                  fontWeight:          400,
                  color:               "#F7F5F0",
                  lineHeight:          "120%",
                  letterSpacing:       isMobile ? "-0.44px" : "-0.64px",
                  textAlign:           "justify",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                <span
                  style={{
                    fontFamily:    "var(--font-playfair), serif",
                    fontSize:      isMobile ? "26px" : "40px",
                    fontStyle:     "italic",
                    fontWeight:    400,
                    lineHeight:    "110%",
                    letterSpacing: isMobile ? "-0.44px" : "-0.8px",
                  }}
                >&ldquo;T</span>
                his tragedy marks one of the most heartbreaking days of our career. Witnessing incredible buildings, cherished memories, and vibrant lives reduced to ashes is beyond devastating.&rdquo;
              </p>
              <p
                style={{
                  fontFamily:          "var(--font-playfair), serif",
                  fontSize:            isMobile ? "20px" : "32px",
                  fontWeight:          400,
                  color:               "#F7F5F0",
                  lineHeight:          "110%",
                  letterSpacing:       isMobile ? "-0.4px" : "-0.64px",
                  marginTop:           "1.2em",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                ~ Ardie Tavangarian
              </p>
            </div>

            {/* Phase images */}
            {images.map((img, i) => {
              const batch          = BATCH_OF(i);
              const isCurrentBatch = batch === activePhase;
              const revealed       = (revealedMask & (1 << i)) !== 0;

              if (batch === 4) {
                const B4 = isMobile ? B4_INIT_MOBILE : B4_INIT_DESKTOP;
                return (
                  <div
                    ref={beforeClipRef}
                    key={img.src}
                    style={{
                      position:  "absolute",
                      top:       0, left:  0,
                      width:     "100%", height: "100%",
                      clipPath:  `inset(${B4.top}vh ${100 - B4.left - B4.width}vw ${100 - B4.top - B4.height}vh ${B4.left}vw round 8px)`,
                      zIndex:    10,
                      opacity:   0,
                      pointerEvents: "none",
                      willChange: "clip-path, opacity",
                      contain:    "layout style paint",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/palisades-before.webp"
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                );
              }

              const ent = imgParams.enter as { duration: number; blur: number; scale: number };
              const bk  = imgParams.backdrop as { duration: number; opacity: number; blur: number; scale: number };
              const gn  = imgParams.gone as { duration: number };

              // Five-state lifecycle
              const isActive   = isCurrentBatch && revealed;
              const isBackdrop = batch === activePhase - 1 && activePhase !== 4;
              const isGone     = batch < activePhase - 1
                              || (batch === activePhase - 1 && activePhase === 4);

              let targetOpacity: number;
              let targetFilter:  string;
              let targetScale:   number;
              let transition;

              if (isActive) {
                targetOpacity = 1;
                targetFilter  = "blur(0px)";
                targetScale   = 1;
                transition = {
                  opacity: { duration: ent.duration, ease: EASE_OUT_QUART },
                  filter:  { duration: ent.duration * 1.3, ease: EASE_OUT_QUART },
                  scale:   { duration: ent.duration * 1.5, ease: EASE_OUT_QUART },
                };
              } else if (isBackdrop) {
                targetOpacity = bk.opacity;
                targetFilter  = `blur(${bk.blur}px)`;
                targetScale   = bk.scale;
                transition = {
                  opacity: { duration: bk.duration, ease: EASE_IN_OUT_QUART },
                  filter:  { duration: bk.duration, ease: EASE_IN_OUT_QUART },
                  scale:   { duration: bk.duration * 1.2, ease: EASE_IN_OUT_QUART },
                };
              } else if (isGone) {
                targetOpacity = 0;
                targetFilter  = `blur(${ent.blur}px)`;
                targetScale   = 0.98;
                transition = {
                  opacity: { duration: gn.duration, ease: EASE_IN_OUT_QUART },
                  filter:  { duration: 0 },  // snap — invisible at opacity 0, skip expensive blur
                  scale:   { duration: 0 },  // snap — no point animating invisible element
                };
              } else {
                targetOpacity = 0;
                targetFilter  = `blur(${ent.blur}px)`;
                targetScale   = ent.scale;
                transition = {
                  opacity: { duration: 0.2, ease: EASE_OUT_QUART },
                  filter:  { duration: 0.2, ease: EASE_OUT_QUART },
                  scale:   { duration: 0.2, ease: EASE_OUT_QUART },
                };
              }

              return (
                <motion.div
                  key={img.src}
                  style={{
                    position:     "absolute",
                    ...(img.left   != null && { left:   img.left }),
                    ...(img.right  != null && { right:  img.right }),
                    ...(img.top    != null && { top:    img.top }),
                    ...(img.bottom != null && { bottom: img.bottom }),
                    width:        img.width,
                    height:       img.height,
                    overflow:     "hidden",
                    borderRadius: "8px",
                    zIndex:       10,
                    willChange:   "transform, filter, opacity",
                  }}
                  animate={{
                    opacity: targetOpacity,
                    filter:  targetFilter,
                    scale:   targetScale,
                  }}
                  transition={transition}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/${img.src}.webp`}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </motion.div>
              );
            })}

            {/* Destroying text */}
            {textVisible && (
              <div
                ref={textContainerRef}
                className="absolute text-center pointer-events-none select-none w-full"
                style={{ top: "clamp(250px, 48vh, 450px)", left: 0, zIndex: 20, opacity: 1 }}
              >
                <p
                  style={{
                    fontFamily:          "var(--font-playfair), serif",
                    fontSize:            "clamp(24px, 4.5vw, 52px)",
                    fontWeight:          400,
                    fontStyle:           "italic",
                    color:               "#4A3C24",
                    letterSpacing:       "-0.02em",
                    lineHeight:          1.1,
                    marginBottom:        "2px",
                    WebkitFontSmoothing: "antialiased",
                  }}
                >
                  <CharReveal text="Destroying" params={revealParams} />
                </p>
                <p
                  key={activePhase}
                  style={{
                    fontFamily:          "var(--font-playfair), serif",
                    fontSize:            "clamp(24px, 4.5vw, 52px)",
                    fontWeight:          400,
                    color:               "#4A3C24",
                    letterSpacing:       "-0.02em",
                    lineHeight:          1.1,
                    whiteSpace:          isMobile ? "normal" : "nowrap",
                    WebkitFontSmoothing: "antialiased",
                  }}
                >
                  <CharReveal text={PHASE_TEXT[activePhase]} params={revealParams} baseDelay={0.1} />
                </p>
              </div>
            )}

          </motion.div>
          {/* end Panel 1 */}

          {/* ── Panel 2: Video ── */}
          <div
            style={{
              position:        "absolute",
              left:            "100vw",
              top:             0,
              width:           "100vw",
              height:          "100vh",
              backgroundColor: "#000",
              cursor:          "pointer",
            }}
            onClick={handleVideoClick}
          >
            <video
              ref={videoRef}
              loop
              playsInline
              preload="auto"
              style={{
                position:  "absolute",
                inset:     0,
                width:     "100%",
                height:    "100%",
                objectFit: "cover",
                display:   "block",
              }}
            >
              <source src="/versa-villa-intro-movie.mp4" type="video/mp4" />
            </video>

            {/* [HELL] chapter label */}
            <div
              style={{
                position:      "absolute",
                top:           isMobile ? "20px" : "40px",
                left:          isMobile ? "20px" : "40px",
                zIndex:        10,
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontFamily:    "var(--font-inter), sans-serif",
                  fontSize:      isMobile ? "16px" : "24px",
                  fontWeight:    600,
                  color:         "#F7F5F0",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                [HELL]
              </span>
            </div>

            {/* Mute / unmute icon — bottom right */}
            <div
              style={{
                position:      "absolute",
                bottom:        isMobile ? "20px" : "40px",
                right:         isMobile ? "20px" : "40px",
                zIndex:        10,
                pointerEvents: "none",
                opacity:       0.8,
                color:         "#fff",
              }}
            >
              {isMuted
                ? <SpeakerOffIcon  width={isMobile ? 18 : 24} height={isMobile ? 18 : 24} />
                : <SpeakerLoudIcon width={isMobile ? 18 : 24} height={isMobile ? 18 : 24} />
              }
            </div>
          </div>
          {/* end Panel 2 */}

          {/* ── Panel 3: It's Personal ── */}
          <div
            style={{
              position:        "absolute",
              left:            "200vw",
              top:             0,
              width:           "100vw",
              height:          "100vh",
              backgroundColor: "#F7F5F0",
              display:         "flex",
              flexDirection:   "column",
            }}
          >
            {/* Top content area — caption left, text right */}
            <motion.div
              style={{
                display:       "flex",
                flexDirection: "row",
                padding:       isMobile ? "40px 24px 0 24px" : "60px 80px 0 80px",
                flex:          "0 0 auto",
                x:             p3TextX,
                opacity:       p3TextOp,
              }}
            >
              {/* Caption — left column */}
              <div style={{ flex: "0 0 auto", width: isMobile ? "40%" : "45%", paddingTop: "4px" }}>
                <span
                  style={{
                    fontFamily:    "var(--font-inter), sans-serif",
                    fontSize:      isMobile ? "16px" : "24px",
                    fontWeight:    600,
                    color:         "#B8965A",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    whiteSpace:    "nowrap",
                  }}
                >
                  [IT&apos;S PERSONAL]
                </span>
              </div>

              {/* Body text — right column */}
              <div style={{ flex: "1 1 auto" }}>
                <p
                  style={{
                    fontFamily:          "var(--font-inter), sans-serif",
                    fontSize:            isMobile ? "22px" : "32px",
                    fontWeight:          400,
                    color:               "#1a1a1a",
                    lineHeight:          "110%",
                    letterSpacing:       "-0.02em",
                    textAlign:           "justify",
                    WebkitFontSmoothing: "antialiased",
                  }}
                >
                  For more than 3 decades, Ardie Tavangarian and his team helped shape Pacific Palisades, designing and building homes throughout the neighborhood.{" "}
                  <span
                    style={{
                      fontFamily: "var(--font-playfair), serif",
                      fontStyle:  "italic",
                      fontWeight: 400,
                    }}
                  >
                    When the fires destroyed his own home,
                  </span>{" "}
                  the place where he raised his children, the loss became deeply personal. In the aftermath came reflection, and a clear conviction: rebuilding should not simply replace what was lost. It should create something stronger, more resilient, and worthy of the community&apos;s trust.
                </p>
              </div>
            </motion.div>

            {/* Palisades illustration — fills remaining space, full width */}
            <div
              style={{
                flex:     "1 1 auto",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/palisades.svg"
                alt="Pacific Palisades coastline illustration"
                style={{
                  position:       "absolute",
                  bottom:         0,
                  left:           0,
                  width:          "100%",
                  height:         "auto",
                  maxHeight:      "100%",
                  objectFit:      "contain",
                  objectPosition: "bottom left",
                }}
              />
            </div>
          </div>
          {/* end Panel 3 */}

          {/* ── Panel 4: The Change — 165vw wide ── */}
          <div
            style={{
              position:        "absolute",
              left:            "300vw",
              top:             0,
              width:           "165vw",
              height:          "100vh",
              backgroundColor: "#F7F5F0",
            }}
          >
            {/* "The disaster revealed..." — aligns with c-3 */}
            <motion.div
              style={{
                position: "absolute",
                left:     "calc(43vw + 48px)",
                top:      "60px",
                width:    "45vw",
                opacity:  p4TextOp,
              }}
            >
              <p
                style={{
                  fontFamily:          "var(--font-inter), sans-serif",
                  fontSize:            "32px",
                  fontWeight:          400,
                  color:               "#1a1a1a",
                  lineHeight:          "110%",
                  letterSpacing:       "-0.02em",
                  textAlign:           "justify",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                The disaster revealed fundamental questions about how homes should be built going forward.
              </p>
            </motion.div>

            {/* [THE CHANGE] caption */}
            <motion.div
              style={{
                position: "absolute",
                left:     "20vw",
                top:      "30vh",
                opacity:  p4TextOp,
              }}
            >
              <span
                style={{
                  fontFamily:    "var(--font-inter), sans-serif",
                  fontSize:      "24px",
                  fontWeight:    600,
                  color:         "#B8965A",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                [THE CHANGE]
              </span>
            </motion.div>

            {/* "How can homes..." questions — aligns with c-6 */}
            <motion.div
              style={{
                position: "absolute",
                left:     "calc(111vw + 120px)",
                top:      "60px",
                width:    "45vw",
                opacity:  p4QuestOp,
              }}
            >
              {[
                "How can homes better withstand future disasters?",
                "How can rebuilding happen faster after loss?",
                "How can families live with greater long-term security?",
              ].map((q, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily:          "var(--font-inter), sans-serif",
                    fontSize:            "32px",
                    fontWeight:          400,
                    color:               "#1a1a1a",
                    lineHeight:          "110%",
                    letterSpacing:       "-0.02em",
                    paddingBottom:       "12px",
                    marginBottom:        "12px",
                    borderBottom:        "1px solid #B8965A",
                    WebkitFontSmoothing: "antialiased",
                  }}
                >
                  {q}
                </p>
              ))}
            </motion.div>

            {/* Photos c-1 through c-7 — flex row, 24px gaps, bottom-aligned */}
            <motion.div
              style={{
                position:      "absolute",
                left:          "3vw",
                bottom:        0,
                display:       "flex",
                flexDirection: "row",
                gap:           "24px",
                alignItems:    "flex-end",
                y:             p4PhotoY,
              }}
            >
              {[
                { src: "community-1", width: "20vw", height: "38vh" },
                { src: "community-2", width: "20vw", height: "52vh" },
                { src: "community-3", width: "20vw", height: "36vh" },
                { src: "community-4", width: "24vw", height: "44vh" },
                { src: "community-5", width: "24vw", height: "62vh" },
                { src: "community-6", width: "20vw", height: "50vh" },
                { src: "community-7", width: "22vw", height: "42vh" },
              ].map((photo) => (
                <div
                  key={photo.src}
                  style={{
                    width:      photo.width,
                    height:     photo.height,
                    flexShrink: 0,
                    overflow:   "hidden",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/${photo.src}.webp`}
                    alt=""
                    style={{
                      width:     "100%",
                      height:    "100%",
                      objectFit: "cover",
                      display:   "block",
                    }}
                  />
                </div>
              ))}
            </motion.div>
          </div>
          {/* end Panel 4 */}

          {/* ── Panel 5: The Answer — 100vw ── */}
          <div
            style={{
              position:        "absolute",
              left:            "465vw",
              top:             0,
              width:           "100vw",
              height:          "100vh",
              backgroundColor: "#F7F5F0",
            }}
          >
            {/* [THE ANSWER] caption — top left */}
            <motion.div
              style={{
                position: "absolute",
                top:      "60px",
                left:     "80px",
                opacity:  p5TextOp,
              }}
            >
              <span
                style={{
                  fontFamily:    "var(--font-inter), sans-serif",
                  fontSize:      "24px",
                  fontWeight:    600,
                  color:         "#B8965A",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                [THE ANSWER]
              </span>
            </motion.div>

            {/* Quote — centered */}
            <motion.div
              style={{
                position:  "absolute",
                top:       "22vh",
                left:      "50%",
                width:     "min(540px, 70vw)",
                x:         p5TextX,
                opacity:   p5TextOp,
                translateX: "-50%",
              }}
            >
              <p
                style={{
                  fontFamily:          "var(--font-inter), sans-serif",
                  fontSize:            "32px",
                  fontWeight:          400,
                  color:               "#4A3C24",
                  lineHeight:          "110%",
                  letterSpacing:       "-0.02em",
                  textAlign:           "justify",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize:   "40px",
                    fontStyle:  "italic",
                    fontWeight: 400,
                    lineHeight: "110%",
                    letterSpacing: "-0.8px",
                  }}
                >
                  &ldquo;T
                </span>
                he Pacific Palisades fire is a sobering reminder of how fragile everything we work so hard to create can be.
              </p>
              <p
                style={{
                  fontFamily:          "var(--font-playfair), serif",
                  fontSize:            "32px",
                  fontWeight:          400,
                  color:               "#4A3C24",
                  lineHeight:          "110%",
                  letterSpacing:       "-0.64px",
                  marginTop:           "1.2em",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                ~ Ardie Tavangarian
              </p>
            </motion.div>

            {/* Flower animation — bottom center */}
            <video
              ref={flowerRef}
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              style={{
                position:  "absolute",
                bottom:    0,
                left:      "50%",
                transform: "translateX(-50%)",
                width:     "45vw",
                height:    "auto",
                maxHeight: "48vh",
                objectFit: "contain",
              }}
            >
              <source src="/flower-animation.mp4" type="video/mp4" />
            </video>
          </div>
          {/* end Panel 5 */}

        </motion.div>
        {/* end sliding container */}

      </motion.div>
    </section>
  );
}
