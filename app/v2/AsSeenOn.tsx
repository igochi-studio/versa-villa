"use client";

import { useRef, useEffect } from "react";

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
  } catch { /* silent */ }
}

const PRESS_LOGOS = [
  {
    src: "/wsj-wordmark.svg",
    alt: "Wall Street Journal",
    url: "https://www.wsj.com/real-estate/luxury-homes/fire-resistant-home-pacific-palisades-los-angeles-c66bff83",
    height: 24,
  },
  {
    src: "/pgsix-wordmark.svg",
    alt: "Page Six",
    url: "https://pagesix.com/2026/03/02/hollywood/inside-the-ambitious-project-to-make-truly-fireproof-homes-after-the-devastating-palisades-fires/",
    height: 22,
  },
  {
    src: "/latimes-wordmark.svg",
    alt: "LA Times",
    url: "https://www.latimes.com/environment/story/2026-03-02/can-fire-resistant-homes-be-sexy",
    height: 22,
  },
  {
    src: "/trd-wordmark.svg",
    alt: "The Real Deal",
    url: "https://therealdeal.com/la/2026/03/02/ardie-tavangarian-to-bring-fire-resistant-homes-norcal-florida/",
    height: 20,
  },
  {
    src: "/hs-wordmark.svg",
    alt: "Hey SoCal",
    url: "https://heysocal.com/2026/02/06/newsom-announces-funding-for-la-fire-survivors-to-access-pre-built-housing/",
    height: 20,
  },
];

const BASE_RATE = 1;
const HOVER_RATE = 0.2;
const RATE_LERP = 0.04;

export default function AsSeenOn() {
  const trackRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const animRef = useRef<Animation | null>(null);
  const rateRef = useRef(BASE_RATE);
  const rafRef = useRef(0);

  // WAAPI marquee — runs on compositor thread
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const halfWidth = track.scrollWidth / 2;
    const duration = halfWidth * 22; // controls speed

    const anim = track.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: `translate3d(-${halfWidth}px, 0, 0)` },
      ],
      { duration, iterations: Infinity, easing: "linear" },
    );
    animRef.current = anim;
    rateRef.current = BASE_RATE;

    // Lightweight RAF — only adjusts playbackRate
    const tick = () => {
      const target = hoveredRef.current ? HOVER_RATE : BASE_RATE;
      rateRef.current += (target - rateRef.current) * RATE_LERP;
      anim.playbackRate = rateRef.current;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      anim.cancel();
    };
  }, []);

  // Duplicate logos for seamless loop
  const logos = [...PRESS_LOGOS, ...PRESS_LOGOS];

  return (
    <section
      style={{
        position: "relative",
        zIndex: 3,
        backgroundColor: "#F8F2E4",
        borderBottom: "1px solid rgba(184, 150, 90, 0.12)",
        padding: "32px 0 36px",
        overflow: "hidden",
      }}
    >
      {/* Label */}
      <p
        style={{
          textAlign: "center",
          fontFamily: "'Alte Haas Grotesk', sans-serif",
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "4px",
          textTransform: "uppercase",
          color: "rgba(74, 60, 36, 0.35)",
          marginBottom: "24px",
        }}
      >
        AS SEEN ON
      </p>

      {/* Marquee track */}
      <div
        onMouseEnter={() => {
          hoveredRef.current = true;
          playTick(4800, 0.025, 0.04);
        }}
        onMouseLeave={() => { hoveredRef.current = false; }}
        style={{ overflow: "hidden", cursor: "default" }}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "80px",
            willChange: "transform",
          }}
        >
          {logos.map((logo, i) => (
            <a
              key={`${logo.alt}-${i}`}
              href={logo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playTick(3600, 0.04, 0.06)}
              onMouseEnter={() => playTick(5200, 0.02, 0.03)}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 16px",
                opacity: 0.4,
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.8";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "0.4";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.src}
                alt={logo.alt}
                style={{
                  height: `${logo.height}px`,
                  width: "auto",
                  display: "block",
                  filter: "grayscale(1)",
                  transition: "filter 0.3s ease",
                }}
                onMouseOver={(e) => { e.currentTarget.style.filter = "grayscale(0)"; }}
                onMouseOut={(e) => { e.currentTarget.style.filter = "grayscale(1)"; }}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
