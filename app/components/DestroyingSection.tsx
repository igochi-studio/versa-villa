"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";

const CHAR_SPRING = { type: "spring" as const, stiffness: 250, damping: 60, mass: 1 };
const BLUR_EASE   = [0.77, 0, 0.175, 1] as const;

// ─── Scroll timeline (section = 1400vh, v = 0 → 1) ────────────────────────
const TEXT_VISIBLE_AT = 0.005;
const PHASE_START = [0, 0.22, 0.36, 0.50, 0.64];

const REVEAL_AT = [
  0.03, 0.07, 0.12, 0.18,   // Batch 0 — homes
  0.22, 0.26, 0.30,          // Batch 1 — family
  0.36, 0.40, 0.43, 0.47,   // Batch 2 — stability
  0.50, 0.54, 0.58,          // Batch 3 — belonging
  0.65,                       // Batch 4 — before.png
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
  { src: "h-1",   left:  "4vw", top:    "5vh", width: "22vw", height: "30vh" },
  { src: "h-2",   right: "4vw", top:    "5vh", width: "22vw", height: "30vh" },
  { src: "h-3",   left: "29vw", bottom: "5vh", width: "22vw", height: "31vh" },
  { src: "h-4",   right: "4vw", bottom: "5vh", width: "20vw", height: "28vh" },
  { src: "f-1",   left: "34vw", top:  "2vh",   width: "34vw", height: "38vh" },
  { src: "f-2",   left:  "2vw", top: "44vh",   width: "23vw", height: "43vh" },
  { src: "f-3",   left: "48vw", top: "57vh",   width: "31vw", height: "36vh" },
  { src: "st-1",  left: "15vw", top:  "2vh",   width: "24vw", height: "33vh" },
  { src: "st-2",  right: "8vw", top:  "7vh",   width: "23vw", height: "35vh" },
  { src: "st-3",  left: "10vw", top: "60vh",   width: "24vw", height: "34vh" },
  { src: "st-4",  left: "37vw", top: "62vh",   width: "27vw", height: "33vh" },
  { src: "b-1",   left:  "3vw", top: "33vh",   width: "27vw", height: "41vh" },
  { src: "b-2",   right: "5vw", top:  "4vh",   width: "43vw", height: "34vh" },
  { src: "b-3",   left: "36vw", top: "62vh",   width: "27vw", height: "33vh" },
  { src: "before",left: "33vw", top: "61vh",   width: "34vw", height: "28vh" },
];

// ─── Math helpers ──────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number)   { return a + (b - a) * t; }
function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }
function mapR(x: number, a: number, b: number)    { return clamp((x - a) / (b - a), 0, 1); }
function eio(t: number) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }

// ─── WebGL shaders ─────────────────────────────────────────────────────────
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
  float burnLine = 1.05 - u_progress * 1.15;
  float n = fbm(v_uv * u_noise) * 2.0 - 1.0;
  float threshold = burnLine + n * 0.12;
  float dist = v_uv.y - threshold;
  vec4 topCol = texture2D(u_top, v_uv);
  // After region: fully transparent — HTML layers behind the canvas show through.
  // The text + darkened after.png sit behind the canvas and are revealed naturally.
  if (dist > u_edge) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }
  vec4 col;
  vec4 botDark = vec4(texture2D(u_bot, v_uv).rgb * 0.4, 1.0);
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

// ─── CharReveal ───────────────────────────────────────────────────────────
function CharReveal({ text, baseDelay = 0 }: { text: string; baseDelay?: number }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <span aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          style={{ display: "inline-block" }}
          initial={shouldReduceMotion ? false : { filter: "blur(12px)", y: 10, opacity: 0 }}
          animate={{ filter: "blur(0px)", y: 0, opacity: 1 }}
          transition={{ ...CHAR_SPRING, delay: baseDelay + i * 0.04 }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────
export default function DestroyingSection() {
  const sectionRef  = useRef<HTMLElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const scrollVRef  = useRef(0);
  const rafRef      = useRef<number>(0);
  const beforeImgRef = useRef<HTMLImageElement | null>(null);
  const afterImgRef  = useRef<HTMLImageElement | null>(null);

  // WebGL refs
  const glRef        = useRef<WebGLRenderingContext | null>(null);
  const uProgressRef = useRef<WebGLUniformLocation | null>(null);
  // DOM refs for rAF-driven clip/opacity — bypasses React re-renders
  const quoteRef     = useRef<HTMLDivElement>(null);
  const logoRef      = useRef<HTMLImageElement>(null);

  const [scrollV,     setScrollV]     = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const [imgsReady,   setImgsReady]   = useState(false);
  const [bgColor,     setBgColor]     = useState("#414833");

  useEffect(() => {
    const timer = setTimeout(() => setBgColor("#F7F5F0"), 2600);
    return () => clearTimeout(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const cv = Math.max(0, v);
    setScrollV(cv);
    scrollVRef.current = cv;
    if (cv >= TEXT_VISIBLE_AT) setTextVisible(true);
  });

  // ── Load before / after images ─────────────────────────────────────────
  useEffect(() => {
    let loaded = 0;
    const check = () => { if (++loaded === 2) setImgsReady(true); };
    const b = new Image(); b.onload = check; b.src = "/before.png";
    const a = new Image(); a.onload = check; a.src = "/after.png";
    beforeImgRef.current = b;
    afterImgRef.current  = a;
  }, []);

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
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(s));
      }
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS_SRC));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS_SRC));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    uProgressRef.current = gl.getUniformLocation(prog, "u_progress");
    const uNoise = gl.getUniformLocation(prog, "u_noise");
    const uEdge  = gl.getUniformLocation(prog, "u_edge");
    const uBloom = gl.getUniformLocation(prog, "u_bloom");
    const uGlow  = gl.getUniformLocation(prog, "u_glow");
    const uTop   = gl.getUniformLocation(prog, "u_top");
    const uBot   = gl.getUniformLocation(prog, "u_bot");

    // Static uniforms — settings from the design spec
    gl.uniform1f(uNoise,  10.8);              // 70% of [1–15] range
    gl.uniform1f(uEdge,   0.02);              // lesser edge sharpness
    gl.uniform1f(uBloom,  1.0);              // full bloom
    gl.uniform3fv(uGlow,  [1.0, 1.0, 1.0]); // white glow
    gl.uniform1i(uTop, 0);
    gl.uniform1i(uBot, 1);

    // Load texture helper
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

    // u_top = before (above burn line), u_bot = after (below / burned)
    loadTex(beforeImgRef.current!, 0);
    loadTex(afterImgRef.current!,  1);

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // Hide text before first rAF tick fires — rAF owns opacity from here on.
    // We intentionally do NOT set opacity in JSX so React can't reset it.
    if (quoteRef.current) quoteRef.current.style.opacity = '0';

    const tick = () => {
      const sv    = scrollVRef.current;
      const burnP = mapR(sv, P4_BURN_START, P4_BURN_END);
      const alpha = mapR(sv, P4_BURN_IN,    P4_BURN_IN + 0.04); // CSS canvasOp

      // ── WebGL draw ────────────────────────────────────────────────────────
      gl.uniform1f(uProgressRef.current, burnP);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // ── Quote: show once canvas is fully opaque ───────────────────────────
      // The canvas before-region is opaque and covers the text; the after-region
      // is transparent (shader outputs vec4(0)), so text reveals naturally
      // through the canvas without any clip-path or buffer.
      if (quoteRef.current) {
        quoteRef.current.style.opacity = alpha >= 1 ? '1' : '0';
      }

      // ── Logo: snap on once the burn line sweeps past it ──────────────────
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

  // ── Derived values ────────────────────────────────────────────────────
  const activePhase =
    scrollV < PHASE_START[1] ? 0 :
    scrollV < PHASE_START[2] ? 1 :
    scrollV < PHASE_START[3] ? 2 :
    scrollV < PHASE_START[4] ? 3 : 4;

  const expandP  = eio(mapR(scrollV, P4_EXPAND_ON,  P4_EXPAND_OFF));
  const canvasOp = mapR(scrollV, P4_BURN_IN, P4_BURN_IN + 0.04);

  // burnP is only used here for aria-hidden; actual clipping is driven by rAF.

  const textOp = activePhase === 4
    ? Math.max(0, 1 - mapR(scrollV, P4_EXPAND_ON, P4_EXPAND_ON + 0.06))
    : 1;

  const B4_INIT = { left: 33, top: 61, width: 34, height: 28 };

  return (
    <section ref={sectionRef} style={{ height: "1400vh" }}>
      <motion.div
        className="sticky top-0 overflow-hidden"
        style={{ height: "100vh" }}
        animate={{ backgroundColor: bgColor }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >

        {/* ── Darkened after image — visible through the transparent canvas ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/after.png"
          alt=""
          style={{
            position:      "absolute",
            inset:         0,
            zIndex:        5,
            width:         "100%",
            height:        "100%",
            objectFit:     "cover",
            filter:        "brightness(0.4)",
            opacity:       canvasOp,
            pointerEvents: "none",
          }}
        />

        {/* ── Logo — top-center, fades in with the canvas ─────────────── */}
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
            height:        "48px",
            width:         "auto",
            zIndex:        41,
            opacity:       0,   // rAF owns this — snaps to 1 when burn passes over
            pointerEvents: "none",
          }}
        />

        {/* ── WebGL burn canvas ────────────────────────────────────────── */}
        <canvas
          ref={canvasRef}
          style={{
            position:      "absolute",
            inset:         0,
            zIndex:        30,
            opacity:       canvasOp,
            pointerEvents: "none",
          }}
        />

        {/* ── Quote — behind the canvas (z=20 < canvas z=30) ──────────────── */}
        {/* The canvas's opaque before-region covers it; the transparent        */}
        {/* after-region reveals it naturally as the burn sweeps through.       */}
        {/* Opacity is driven entirely by rAF — NOT set in JSX so React        */}
        {/* re-renders cannot override it.                                      */}
        <div
          ref={quoteRef}
          aria-hidden
          style={{
            position:      "absolute",
            left:          "140px",
            bottom:        "120px",
            zIndex:        20,
            pointerEvents: "none",
            width:         "min(601px, 82vw)",
          }}
        >
          {/* Main quote — Inter body, Playfair italic opening "T" */}
          <p
            style={{
              fontFamily:          "var(--font-inter), sans-serif",
              fontSize:            "32px",
              fontWeight:          400,
              fontStyle:           "normal",
              color:               "#F7F5F0",
              lineHeight:          "110%",
              letterSpacing:       "-0.64px",
              textAlign:           "justify",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            <span
              style={{
                fontFamily:    "var(--font-playfair), serif",
                fontSize:      "40px",
                fontStyle:     "italic",
                fontWeight:    400,
                lineHeight:    "110%",
                letterSpacing: "-0.8px",
              }}
            >&ldquo;T</span>
            his tragedy marks one of the most heartbreaking days of our career. Witnessing incredible buildings, cherished memories, and vibrant lives reduced to ashes is beyond devastating.&rdquo;
          </p>

          {/* Attribution */}
          <p
            style={{
              fontFamily:          "var(--font-playfair), serif",
              fontSize:            "32px",
              fontWeight:          400,
              fontStyle:           "normal",
              color:               "#F7F5F0",
              lineHeight:          "110%",
              letterSpacing:       "-0.64px",
              marginTop:           "1.5em",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            ~ Ardie Tavangarian
          </p>
        </div>

        {/* ── Images ──────────────────────────────────────────────────── */}
        {ALL_IMAGES.map((img, i) => {
          const batch          = BATCH_OF(i);
          const isCurrentBatch = batch === activePhase;
          const isExiting      = batch === activePhase - 1;
          const revealed       = scrollV >= REVEAL_AT[i];

          if (batch === 4) {
            const fadeIn  = mapR(scrollV, REVEAL_AT[i], REVEAL_AT[i] + 0.03);
            const opacity = fadeIn * (1 - canvasOp);

            const clipT   = lerp(B4_INIT.top,                         0, expandP);
            const clipL   = lerp(B4_INIT.left,                        0, expandP);
            const clipR   = lerp(100 - B4_INIT.left - B4_INIT.width, 0, expandP);
            const clipB   = lerp(100 - B4_INIT.top  - B4_INIT.height,0, expandP);
            const clipRad = lerp(8, 0, expandP);

            return (
              <div
                key={img.src}
                style={{
                  position:  "absolute",
                  top:       0, left:  0,
                  width:     "100%", height: "100%",
                  clipPath:  `inset(${clipT}vh ${clipR}vw ${clipB}vh ${clipL}vw round ${clipRad}px)`,
                  zIndex:    10,
                  opacity,
                  pointerEvents: "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/before.png"
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            );
          }

          let targetOpacity: number;
          let targetFilter:  string;

          if (isCurrentBatch && revealed) {
            targetOpacity = 1;
            targetFilter  = "blur(0px)";
          } else if (isExiting) {
            targetOpacity = activePhase === 4 ? 0    : 0.13;
            targetFilter  = activePhase === 4 ? "blur(0px)" : "blur(22px)";
          } else {
            targetOpacity = 0;
            targetFilter  = "blur(16px)";
          }

          const transition =
            isExiting && activePhase === 4
              ? { opacity: { duration: 0.5, ease: [0.77, 0, 0.175, 1] as const }, filter: { duration: 0.3, ease: [0.77, 0, 0.175, 1] as const } }
              : isExiting
              ? { opacity: { duration: 1.6, ease: BLUR_EASE }, filter: { duration: 1.9, ease: BLUR_EASE } }
              : { opacity: { duration: 0.9, ease: BLUR_EASE }, filter: { duration: 1.3, ease: BLUR_EASE } };

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
              }}
              animate={{ opacity: targetOpacity, filter: targetFilter }}
              transition={transition}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/${img.src}.png`}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </motion.div>
          );
        })}

        {/* ── Destroying text ─────────────────────────────────────────── */}
        {textVisible && (
          <div
            className="absolute text-center pointer-events-none select-none w-full"
            style={{ top: "450px", left: 0, zIndex: 20, opacity: textOp }}
          >
            <p
              style={{
                fontFamily:          "var(--font-playfair), serif",
                fontSize:            "52px",
                fontWeight:          400,
                fontStyle:           "italic",
                color:               "#4A3C24",
                letterSpacing:       "-0.02em",
                lineHeight:          1.1,
                marginBottom:        "2px",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <CharReveal text="Destroying" />
            </p>

            <p
              key={activePhase}
              style={{
                fontFamily:          "var(--font-playfair), serif",
                fontSize:            "52px",
                fontWeight:          400,
                color:               "#4A3C24",
                letterSpacing:       "-0.02em",
                lineHeight:          1.1,
                whiteSpace:          "nowrap",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <CharReveal text={PHASE_TEXT[activePhase]} baseDelay={0.1} />
            </p>
          </div>
        )}

      </motion.div>
    </section>
  );
}
