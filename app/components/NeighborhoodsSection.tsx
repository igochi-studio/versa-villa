"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "motion/react";

// ─── Scroll timeline (section = 600vh, v = 0 → 1) ────────────────────────────
//
//  v 0.002        text CharReveal fires
//  v 0.05 → 0.10  before image fades in (small, centered)
//  v 0.12 → 0.40  image expands: small centered → full viewport
//  v 0.12 → 0.22  text fades out during expansion
//  v 0.38 → 0.42  burn canvas cross-fades in (replaces CSS image)
//  v 0.42 → 1.00  fire line sweeps bottom → top, burning "before" to reveal "after"

const T = {
  TEXT_ON:    0.002,
  IMG_IN:     0.05,
  IMG_FULL:   0.10,
  EXPAND_ON:  0.12,
  TEXT_OFF:   0.22,
  EXPAND_OFF: 0.40,
  BURN_IN:    0.38,   // canvas starts fading in (slight overlap with expansion)
  BURN_END:   1.00,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }
function map(x: number, a: number, b: number) { return clamp((x - a) / (b - a), 0, 1); }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }
function smooth(t: number) { return t * t * (3 - 2 * t); }
function fract(x: number) { return x - Math.floor(x); }

// ─── Noise (for organic burn edge) ───────────────────────────────────────────

function hash(n: number) { return fract(Math.sin(n) * 43758.5453123); }

function vnoise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = smooth(fx), uy = smooth(fy);
  return lerp(
    lerp(hash(ix     + iy       * 57), hash(ix + 1 + iy       * 57), ux),
    lerp(hash(ix     + (iy + 1) * 57), hash(ix + 1 + (iy + 1) * 57), ux),
    uy,
  );
}

// Fractional Brownian Motion — stacks 4 octaves for natural-looking turbulence
function fbm(x: number, y: number): number {
  return (
    vnoise(x,      y)      * 0.500 +
    vnoise(x * 2,  y * 2)  * 0.250 +
    vnoise(x * 4,  y * 4)  * 0.125 +
    vnoise(x * 8,  y * 8)  * 0.063
  ) * 2 - 1; // center around 0
}

// Y coordinate of the burn edge at normalised x position [0-1]
// amp controls maximum vertical deviation in px
function burnEdgeY(xNorm: number, baseBurnY: number, t: number, amp: number): number {
  return baseBurnY + fbm(xNorm * 3.5 + t * 0.10, t * 0.07 + xNorm * 0.3) * amp;
}

// ─── Canvas: object-fit cover ────────────────────────────────────────────────
// Replicates CSS object-fit:cover so the canvas image matches the <img> exactly.

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number,
) {
  if (!img.naturalWidth) return;
  const imgW = img.naturalWidth, imgH = img.naturalHeight;
  const ca = dw / dh, ia = imgW / imgH;
  let sx = 0, sy = 0, sw = imgW, sh = imgH;
  if (ca > ia) { sh = imgW / ca;  sy = (imgH - sh) / 2; }
  else          { sw = imgH * ca; sx = (imgW - sw) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// ─── Burn frame renderer ─────────────────────────────────────────────────────

function drawBurnFrame(
  ctx:    CanvasRenderingContext2D,
  before: HTMLImageElement,
  after:  HTMLImageElement,
  burnP:  number,   // 0 = fully before, 1 = fully after
  t:      number,   // slowly-increasing time for edge animation
  W:      number,
  H:      number,
) {
  ctx.clearRect(0, 0, W, H);

  // After image: always the base layer (reveals as before burns away)
  drawCover(ctx, after, 0, 0, W, H);

  if (burnP <= 0) { drawCover(ctx, before, 0, 0, W, H); return; }
  if (burnP >= 1) return;

  // Fire line centre: travels bottom→top as burnP goes 0→1
  const amp       = H * 0.09;                          // vertical jitter amplitude
  const baseBurnY = H * (1 - burnP) + amp * 0.5;      // +0.5amp so burn starts gently off-bottom

  // Sample the fire edge at regular x intervals
  const STEP = 3; // px — sample density
  const pts: number[] = [];
  for (let x = 0; x <= W; x += STEP) {
    pts.push(burnEdgeY(x / W, baseBurnY, t, amp));
  }

  // ── Clip: "before" image shows only above the fire line ─────────────────
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, pts[pts.length - 1]);
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(i * STEP, pts[i]);
  ctx.closePath();
  ctx.clip();
  drawCover(ctx, before, 0, 0, W, H);
  ctx.restore();

  // ── Fire line glow — multiple passes create a luminous bloom ────────────
  //   outer soft glow → inner bright core → crisp white edge
  const drawEdge = (lw: number, alpha: number, blur: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, pts[0]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(i * STEP, pts[i]);
    ctx.lineWidth   = lw;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur  = blur;
    ctx.stroke();
    ctx.restore();
  };
  drawEdge(14, 0.06, 50);   // wide soft halo
  drawEdge(6,  0.25, 24);   // medium glow
  drawEdge(3,  0.60, 10);   // bright inner glow
  drawEdge(1,  0.95,  2);   // crisp white line
}

// ─── CharReveal ──────────────────────────────────────────────────────────────

const CHAR_SPRING = { type: "spring" as const, stiffness: 250, damping: 60, mass: 1 };

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

// ─── Section ─────────────────────────────────────────────────────────────────

export default function NeighborhoodsSection() {
  const sectionRef  = useRef<HTMLElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const beforeRef   = useRef<HTMLImageElement | null>(null);
  const afterRef    = useRef<HTMLImageElement | null>(null);
  const rafRef      = useRef<number>(0);
  const timeRef     = useRef(0);
  const scrollVRef  = useRef(0);

  const [textVisible, setTextVisible] = useState(false);
  const [imgsReady,  setImgsReady]  = useState(false);

  // Refs for direct DOM manipulation (no re-renders for continuous values)
  const textVisibleRef  = useRef(false);
  const imgClipRef      = useRef<HTMLDivElement>(null);
  const textElRef       = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const cv = Math.max(0, v);
    scrollVRef.current = cv;

    // Discrete state — only fires once
    if (cv >= T.TEXT_ON && !textVisibleRef.current) {
      textVisibleRef.current = true;
      setTextVisible(true);
    }

    // ── Direct DOM updates for continuous values ──
    const imgFade  = map(cv, T.IMG_IN,   T.IMG_FULL);
    const expandP  = easeInOut(map(cv, T.EXPAND_ON, T.EXPAND_OFF));
    const textOp   = 1 - map(cv, T.EXPAND_ON, T.TEXT_OFF);
    const canvasOp = map(cv, T.BURN_IN,  T.BURN_IN + 0.04);
    const cssImgOp = imgFade * (1 - map(cv, T.BURN_IN - 0.01, T.BURN_IN + 0.04));

    // Image rectangle: small centered → full viewport
    const INIT_W = 33, INIT_H = 26, INIT_L = (100 - INIT_W) / 2, INIT_T = 52;
    const iW = lerp(INIT_W, 100, expandP);
    const iH = lerp(INIT_H, 100, expandP);
    const iL = lerp(INIT_L, 0,   expandP);
    const iT = lerp(INIT_T, 0,   expandP);
    const iR = lerp(8,      0,   expandP);

    if (canvasRef.current) canvasRef.current.style.opacity = String(canvasOp);
    if (textElRef.current)   textElRef.current.style.opacity   = String(textOp);

    if (imgClipRef.current) {
      const s = imgClipRef.current.style;
      s.left         = `${iL}vw`;
      s.top          = `${iT}vh`;
      s.width        = `${iW}vw`;
      s.height       = `${iH}vh`;
      s.borderRadius = `${iR}px`;
      s.opacity      = String(cssImgOp);
    }
  });

  // ── Load before / after images ────────────────────────────────────────────
  useEffect(() => {
    let loaded = 0;
    const check = () => { if (++loaded === 2) setImgsReady(true); };
    const b = new Image(); b.onload = check; b.src = "/palisades-before.webp";
    const a = new Image(); a.onload = check; a.src = "/palisades-after.webp";
    beforeRef.current = b;
    afterRef.current  = a;
  }, []);

  // ── Canvas render loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!imgsReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      timeRef.current += 0.016;
      const v = scrollVRef.current;

      // Only draw when the canvas is (or is about to be) visible
      if (v >= T.BURN_IN - 0.05) {
        const burnP = map(v, T.BURN_IN, T.BURN_END);
        drawBurnFrame(
          ctx,
          beforeRef.current!,
          afterRef.current!,
          burnP,
          timeRef.current,
          canvas.width,
          canvas.height,
        );
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [imgsReady]);

  return (
    <section ref={sectionRef} style={{ height: "600vh" }}>
      <div
        className="sticky top-0 overflow-hidden"
        style={{ height: "100vh", backgroundColor: "#F7F5F0" }}
      >

        {/* ── Burn canvas (full viewport, fades in to replace CSS image) ──── */}
        <canvas
          ref={canvasRef}
          style={{
            position:      "absolute",
            inset:         0,
            zIndex:        5,
            opacity:       0,
            pointerEvents: "none",
          }}
        />

        {/* ── Before image (reveals small, then expands) ─────────────────── */}
        <div
          ref={imgClipRef}
          style={{
            position:     "absolute",
            left:         "33.5vw",
            top:          "52vh",
            width:        "33vw",
            height:       "26vh",
            borderRadius: "8px",
            overflow:     "hidden",
            zIndex:       4,
            opacity:      0,
            pointerEvents: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/palisades-before.webp"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>

        {/* ── Text ─────────────────────────────────────────────────────────── */}
        {textVisible && (
          <div
            ref={textElRef}
            className="absolute text-center pointer-events-none select-none w-full"
            style={{ top: "36vh", left: 0, zIndex: 20, opacity: 1 }}
          >
            <p
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "52px",
                fontWeight: 400,
                fontStyle: "italic",
                color: "#4A3C24",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: "2px",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <CharReveal text="Destroying" />
            </p>
            <p
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "52px",
                fontWeight: 400,
                color: "#4A3C24",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <CharReveal text="entire neighborhoods." baseDelay={0.3} />
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
