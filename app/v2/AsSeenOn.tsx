"use client";

import { useRef, useEffect } from "react";

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
  { src: "/wsj-wordmark.svg", alt: "Wall Street Journal", url: "https://www.wsj.com/real-estate/luxury-homes/fire-resistant-home-pacific-palisades-los-angeles-c66bff83", height: 32 },
  { src: "/pgsix-wordmark.svg", alt: "Page Six", url: "https://pagesix.com/2026/03/02/hollywood/inside-the-ambitious-project-to-make-truly-fireproof-homes-after-the-devastating-palisades-fires/", height: 30 },
  { src: "/latimes-wordmark.svg", alt: "LA Times", url: "https://www.latimes.com/environment/story/2026-03-02/can-fire-resistant-homes-be-sexy", height: 30 },
  { src: "/trd-wordmark.svg", alt: "The Real Deal", url: "https://therealdeal.com/la/2026/03/02/ardie-tavangarian-to-bring-fire-resistant-homes-norcal-florida/", height: 28 },
  { src: "/hs-wordmark.svg", alt: "Hey SoCal", url: "https://heysocal.com/2026/02/06/newsom-announces-funding-for-la-fire-survivors-to-access-pre-built-housing/", height: 28 },
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

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const halfWidth = track.scrollWidth / 2;
    const duration = halfWidth * 20;
    const anim = track.animate(
      [{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(-${halfWidth}px,0,0)` }],
      { duration, iterations: Infinity, easing: "linear" },
    );
    animRef.current = anim;
    rateRef.current = BASE_RATE;
    const tick = () => {
      const target = hoveredRef.current ? HOVER_RATE : BASE_RATE;
      rateRef.current += (target - rateRef.current) * RATE_LERP;
      anim.playbackRate = rateRef.current;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); anim.cancel(); };
  }, []);

  // 4x duplicate for seamless infinite loop
  const logos = [...PRESS_LOGOS, ...PRESS_LOGOS, ...PRESS_LOGOS, ...PRESS_LOGOS];

  return (
    <section
      style={{
        position: "relative",
        backgroundColor: "#F8F2E4",
        borderTop: "1px solid rgba(184, 150, 90, 0.1)",
        borderBottom: "1px solid rgba(184, 150, 90, 0.1)",
        padding: "40px 0 44px",
        overflow: "hidden",
      }}
    >
      <p
        style={{
          textAlign: "center",
          fontFamily: "'Alte Haas Grotesk', sans-serif",
          fontSize: "12px",
          fontWeight: 400,
          letterSpacing: "5px",
          textTransform: "uppercase",
          color: "rgba(74, 60, 36, 0.4)",
          marginBottom: "28px",
        }}
      >
        AS SEEN ON
      </p>

      <div
        onMouseEnter={() => { hoveredRef.current = true; playTick(4800, 0.025, 0.04); }}
        onMouseLeave={() => { hoveredRef.current = false; }}
        style={{ overflow: "hidden", cursor: "default" }}
      >
        <div
          ref={trackRef}
          style={{ display: "flex", alignItems: "center", gap: "72px", willChange: "transform" }}
        >
          {logos.map((logo, i) => (
            <a
              key={`${logo.alt}-${i}`}
              href={logo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playTick(3600, 0.04, 0.06)}
              onMouseEnter={() => playTick(5200, 0.02, 0.03)}
              className="as-seen-logo"
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 20px",
                opacity: 0.35,
                transition: "opacity 0.3s ease, transform 0.3s ease",
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
                }}
              />
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .as-seen-logo:hover {
          opacity: 0.7 !important;
          transform: scale(1.05);
        }
      `}</style>
    </section>
  );
}
