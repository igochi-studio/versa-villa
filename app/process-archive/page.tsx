"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useIsMobile } from "../hooks/useIsMobile";
import Header from "../components/Header";

const EASE_OUT_QUINT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const IMAGES: { src: string; orientation: "portrait" | "landscape" }[] = [
  { src: "/process-1.jpeg", orientation: "landscape" },
  { src: "/process-2.jpeg", orientation: "landscape" },
  { src: "/process-3.jpeg", orientation: "landscape" },
  { src: "/process-4.jpeg", orientation: "landscape" },
  { src: "/process-5.jpeg", orientation: "landscape" },
  { src: "/process-6.jpeg", orientation: "landscape" },
  { src: "/process-7.jpeg", orientation: "landscape" },
  { src: "/process-8.jpeg", orientation: "landscape" },
  { src: "/process-9.jpeg", orientation: "landscape" },
  { src: "/process-10.jpeg", orientation: "landscape" },
  { src: "/process-11.jpeg", orientation: "portrait" },
  { src: "/process-12.jpeg", orientation: "portrait" },
  { src: "/process-13.jpeg", orientation: "portrait" },
  { src: "/process-14.jpeg", orientation: "portrait" },
  { src: "/process-15.jpeg", orientation: "portrait" },
  { src: "/process-16.jpeg", orientation: "portrait" },
  { src: "/process-17.jpeg", orientation: "portrait" },
  { src: "/process-18.jpeg", orientation: "landscape" },
  { src: "/process-19.jpeg", orientation: "portrait" },
  { src: "/process-20.jpeg", orientation: "landscape" },
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

export default function ProcessArchivePage() {
  const isMobile = useIsMobile();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const colCount = isMobile ? 2 : 3;

  // Triple the images so we have enough runway to snap the middle copy
  const tripled = [...IMAGES, ...IMAGES, ...IMAGES];
  const columns = distributeToColumns(tripled, colCount);

  // Infinite scroll: snap back to middle set when scrolling past boundaries
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
      // gridHeight / 3 = height of one set
      const oneSetHeight = grid.scrollHeight / 3;
      if (oneSetHeight <= 0) return;

      // Start at the second set (middle)
      el.scrollTop = oneSetHeight;

      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const st = el.scrollTop;
          // Scrolled past the second set → snap back to first set equivalent
          if (st >= oneSetHeight * 2) {
            el.scrollTop = st - oneSetHeight;
          }
          // Scrolled above the first set → snap forward to second set equivalent
          else if (st < oneSetHeight * 0.05) {
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

      {/* Single scrollable container for the whole masonry grid */}
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
                  className="archive-card"
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
                    className="archive-card-img"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
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
        .archive-card-img {
          transition: transform 600ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .archive-card:hover .archive-card-img {
          transform: scale(1.03);
        }
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}
