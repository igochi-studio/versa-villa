#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# bake-flower-fallback.sh
#
# Produces flower-animation-baked.mp4 that looks identical to the transparent
# WebM rendered via CSS mix-blend-mode:multiply on the #F8F2E4 background —
# without needing any blend mode in the browser (works on iOS / Safari).
#
# Why frame-by-frame PNG:
#   Working in PNG (lossless RGB) avoids YUV round-trip errors during the
#   colour correction step. Only the final H.264 encode touches YUV.
#
# Algorithm:
#   The source video has a near-white background (~#F4F3EE, NOT pure white).
#   Simple multiply gives a slightly-dark result. Instead we:
#     1. Auto-measure the actual source background colour from frame 1.
#     2. Compute a per-channel correction:  factor = target_bg / measured_bg
#     3. Apply that factor in pure RGB — so measured_bg → target_bg exactly.
#
# Usage:
#   bash scripts/bake-flower-fallback.sh
#
# Requires: ffmpeg ≥ 4.x  (brew install ffmpeg)
#           ImageMagick 7  (brew install imagemagick)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

INPUT="$ROOT/public/flower-animation-transparent.webm"
OUTPUT="$ROOT/public/flower-animation-baked.mp4"   # new name → guaranteed cache bust

TARGET_HEX="#F8F2E4"   # must match backgroundColor in LandscapeSection.tsx

# ── Sanity checks ────────────────────────────────────────────────────────────
for cmd in ffmpeg ffprobe magick; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌  '$cmd' not found."
    [[ "$cmd" == "magick" ]] && echo "   Install: brew install imagemagick"
    [[ "$cmd" != "magick" ]] && echo "   Install: brew install ffmpeg"
    exit 1
  fi
done
if [[ ! -f "$INPUT" ]]; then
  echo "❌  Source not found: $INPUT"
  exit 1
fi

# ── Probe input ──────────────────────────────────────────────────────────────
WIDTH=$(ffprobe  -v error -select_streams v:0 -show_entries stream=width  -of default=noprint_wrappers=1:nokey=1 "$INPUT")
HEIGHT=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=noprint_wrappers=1:nokey=1 "$INPUT")
FPS=$(ffprobe    -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "$INPUT")

echo "Input:      $INPUT"
echo "Dimensions: ${WIDTH}x${HEIGHT} @ ${FPS} fps"
echo "Target bg:  ${TARGET_HEX}"
echo "Output:     $OUTPUT"
echo

# ── Parse target colour ───────────────────────────────────────────────────────
HEX="${TARGET_HEX#\#}"
TARGET_R=$(( 16#${HEX:0:2} ))
TARGET_G=$(( 16#${HEX:2:2} ))
TARGET_B=$(( 16#${HEX:4:2} ))

# ── Temp workspace ───────────────────────────────────────────────────────────
TMP=$(mktemp -d)
SRC_DIR="$TMP/src"
OUT_DIR="$TMP/out"
mkdir -p "$SRC_DIR" "$OUT_DIR"
trap 'rm -rf "$TMP"' EXIT

# ── Step 1: extract every frame as lossless PNG ──────────────────────────────
echo "→ Extracting frames…"
ffmpeg -y -i "$INPUT" "$SRC_DIR/frame%05d.png" 2>/dev/null
FRAME_COUNT=$(ls "$SRC_DIR" | wc -l | tr -d ' ')
echo "  ${FRAME_COUNT} frames extracted"

# ── Step 2: measure the source background white-point ────────────────────────
#
# Sample the top-left 60×60 region of frame 1 to find the actual background
# colour (the source is near-white, not pure white, due to video compression).
# We take the per-channel maximum across that region.
#
FRAME1="$SRC_DIR/frame00001.png"
WHITE_R=$(magick "$FRAME1" -crop 60x60+0+0 +repage -channel R -format '%[fx:round(maxima*255)]' info:)
WHITE_G=$(magick "$FRAME1" -crop 60x60+0+0 +repage -channel G -format '%[fx:round(maxima*255)]' info:)
WHITE_B=$(magick "$FRAME1" -crop 60x60+0+0 +repage -channel B -format '%[fx:round(maxima*255)]' info:)

echo "→ Measured source background: RGB(${WHITE_R}, ${WHITE_G}, ${WHITE_B})"

# ── Step 3: compute per-channel correction factors ───────────────────────────
#
# factor_c = target_c / source_white_c
#
# Effect:  source_background_pixel × factor → target_bg exactly
#          black pixel              × factor → stays black
#          dark sketch lines        × factor → approximately unchanged
#          (factor ≈ 1.0 per channel, so dark values shift by < 2 units)
#
FACTOR_R=$(python3 -c "print(f'{${TARGET_R}/${WHITE_R}:.6f}')")
FACTOR_G=$(python3 -c "print(f'{${TARGET_G}/${WHITE_G}:.6f}')")
FACTOR_B=$(python3 -c "print(f'{${TARGET_B}/${WHITE_B}:.6f}')")

echo "   Correction factors:        R×${FACTOR_R}  G×${FACTOR_G}  B×${FACTOR_B}"
echo

# ── Step 4: apply correction to every frame ───────────────────────────────────
echo "→ Compositing frames…"
DONE=0
for src_frame in "$SRC_DIR"/frame*.png; do
  fname=$(basename "$src_frame")
  magick "$src_frame" \
    -channel R -evaluate Multiply "${FACTOR_R}" \
    -channel G -evaluate Multiply "${FACTOR_G}" \
    -channel B -evaluate Multiply "${FACTOR_B}" \
    +channel \
    -clamp \
    "$OUT_DIR/$fname"
  DONE=$(( DONE + 1 ))
  (( DONE % 20 == 0 )) && echo "  ${DONE}/${FRAME_COUNT}"
done
echo "  ${FRAME_COUNT}/${FRAME_COUNT} done"

# ── Step 5: verify corner pixel of frame 1 ───────────────────────────────────
CORNER=$(magick "$OUT_DIR/frame00001.png" -crop 1x1+0+0 +repage -format '%[fx:round(r*255)],%[fx:round(g*255)],%[fx:round(b*255)]' info:)
echo
echo "→ Verification — frame 1 corner: RGB(${CORNER})  (target: ${TARGET_R},${TARGET_G},${TARGET_B})"

# ── Step 6: re-encode composited frames → MP4 ────────────────────────────────
echo "→ Encoding MP4…"
ffmpeg -y \
  -framerate "$FPS" \
  -i "$OUT_DIR/frame%05d.png" \
  -c:v libx264 \
  -profile:v high \
  -pix_fmt yuv420p \
  -crf 18 \
  -movflags +faststart \
  "$OUTPUT" 2>&1 | grep -E "kb/s|error" || true

echo
echo "✅  Done → $OUTPUT"
