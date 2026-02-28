"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";
import Header from "../components/Header";

const EASE_OUT_QUINT: [number, number, number, number] = [0.23, 1, 0.32, 1];

// Curated & reordered: duplicates removed, similar subjects spread apart
const IMAGES: { src: string; orientation: "portrait" | "landscape" }[] = [
  // Exterior day → interior → portrait → render → different interior → exterior night…
  { src: "/003_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // front exterior day
  { src: "/014_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // interior detail
  { src: "/villa-type-1.webp", orientation: "landscape" },                        // render
  { src: "/010_Bienvenida 1241_by mrbarcelo.webp", orientation: "portrait" },    // portrait entry
  { src: "/012_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // living room bookshelf
  { src: "/villa-dawn.webp", orientation: "landscape" },                          // dawn exterior
  { src: "/037_Bienvenida 1241_by mrbarcelo copy.webp", orientation: "landscape" }, // bathroom/detail
  { src: "/villa-type-3.webp", orientation: "landscape" },                        // render
  { src: "/019_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // kitchen
  { src: "/041_Bienvenida 1241_by mrbarcelo.webp", orientation: "portrait" },    // portrait staircase
  { src: "/065_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // backyard day
  { src: "/villa-type-5.webp", orientation: "landscape" },                        // render
  { src: "/033_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // master bedroom
  { src: "/005_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // exterior angle 2
  { src: "/080_Bienvenida 1241_by mrbarcelo copy.webp", orientation: "landscape" }, // living room night
  { src: "/villa-type-7.webp", orientation: "landscape" },                        // render
  { src: "/022_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // dining room
  { src: "/070_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // twilight front
  { src: "/villa-construction.webp", orientation: "landscape" },                  // construction
  { src: "/038_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // detail/fixture
  { src: "/006_Bienvenida 1241 Portraits_by mrbarcelo.webp", orientation: "landscape" }, // family portrait
  { src: "/villa-type-2.webp", orientation: "landscape" },                        // render
  { src: "/043_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // pool/patio
  { src: "/013_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // interior hallway
  { src: "/villa-evening.webp", orientation: "landscape" },                       // evening exterior
  { src: "/083_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // wide living room
  { src: "/villa-type-4.webp", orientation: "landscape" },                        // render
  { src: "/035_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // bedroom 2
  { src: "/074_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // twilight side
  { src: "/081_Bienvenida 1241_by mrbarcelo copy.webp", orientation: "landscape" }, // living fireplace
  { src: "/villa-type-6.webp", orientation: "landscape" },                        // render
  { src: "/061_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // outdoor detail
  { src: "/094_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // exterior dusk
  { src: "/villa-type-8.webp", orientation: "landscape" },                        // render
  { src: "/099_Bienvenida 1241_by mrbarcelo.webp", orientation: "landscape" },   // aerial/wide
];

const GAP = 6;

const CLOSE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='19' fill='rgba(0,0,0,0.4)' stroke='rgba(255,255,255,0.6)' stroke-width='1.5'/%3E%3Cpath d='M14 14L26 26M26 14L14 26' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E\") 20 20, pointer";

function distributeToColumns(
  images: typeof IMAGES,
  colCount: number
): (typeof IMAGES)[] {
  const cols: (typeof IMAGES)[] = Array.from({ length: colCount }, () => []);
  const heights = new Array(colCount).fill(0);
  for (const img of images) {
    const shortest = heights.indexOf(Math.min(...heights));
    cols[shortest].push(img);
    heights[shortest] += img.orientation === "portrait" ? 1.5 : 0.75;
  }
  return cols;
}

export default function GalleryPage() {
  const isMobile = useIsMobile();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const colCount = isMobile ? 2 : 3;

  const tripled = [...IMAGES, ...IMAGES, ...IMAGES];
  const columns = distributeToColumns(tripled, colCount);

  useEffect(() => {
    const el = scrollRef.current;
    const grid = gridRef.current;
    if (!el || !grid) return;

    const images = grid.querySelectorAll("img");
    const promises = Array.from(images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((r) => {
            img.onload = () => r();
            img.onerror = () => r();
          })
    );

    let raf = 0;

    Promise.all(promises).then(() => {
      const oneSetHeight = grid.scrollHeight / 3;
      if (oneSetHeight <= 0) return;

      el.scrollTop = oneSetHeight;

      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const st = el.scrollTop;
          if (st >= oneSetHeight * 2) {
            el.scrollTop = st - oneSetHeight;
          } else if (st < oneSetHeight * 0.05) {
            el.scrollTop = st + oneSetHeight;
          }
        });
      };

      el.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        cancelAnimationFrame(raf);
        el.removeEventListener("scroll", onScroll);
      };
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = useCallback(() => setLightboxSrc(null), []);

  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxSrc(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxSrc]);

  return (
    <main
      style={{
        backgroundColor: "#F8F2E4",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Header />

      <div
        ref={scrollRef}
        style={{
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div
          ref={gridRef}
          style={{
            display: "flex",
            gap: `${GAP}px`,
            padding: `0 ${GAP}px`,
            alignItems: "flex-start",
          }}
        >
          {columns.map((col, colIdx) => (
            <div
              key={colIdx}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: `${GAP}px`,
              }}
            >
              {col.map((img, i) => (
                <div
                  key={`${img.src}-${colIdx}-${i}`}
                  className="gallery-card"
                  style={{
                    overflow: "hidden",
                    cursor: "pointer",
                    lineHeight: 0,
                  }}
                  onClick={() => setLightboxSrc(img.src)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt=""
                    loading="eager"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                    className="gallery-card-img"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_QUINT }}
            onClick={handleClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: CLOSE_CURSOR,
              padding: isMobile ? "24px" : "60px",
            }}
          >
            <motion.img
              src={lightboxSrc}
              alt=""
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
              style={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                borderRadius: "6px",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .gallery-card-img {
          transition: transform 600ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .gallery-card:hover .gallery-card-img {
          transform: scale(1.03);
        }
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}
