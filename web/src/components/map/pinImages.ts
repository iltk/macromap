import type { Map as MaplibreMap } from "maplibre-gl";
import { PIN_PATH } from "../../constants/categories";
import { readableOnWhite } from "../../utils/brand";

const PIXEL_RATIO = 2;
const W = 32;
const H = 42;

export interface PinBrand {
  color: string;
  initials: string;
}

/**
 * Draws a teardrop pin in the chain's brand colour with its initials in a white disc.
 * Synchronous (canvas), so it can run inside MapLibre's `styleimagemissing` handler,
 * which also re-creates images after the map style changes (e.g. dark mode).
 *
 * Image ids: `pin-<slug>` and `pin-<slug>-selected`.
 */
function drawPin(brand: PinBrand, selectedColor: string | null): ImageData | null {
  const color = selectedColor ?? brand.color;
  const canvas = document.createElement("canvas");
  canvas.width = W * PIXEL_RATIO;
  canvas.height = H * PIXEL_RATIO;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);

  ctx.save();
  ctx.translate(2, 1);
  ctx.scale(28 / 32, 39 / 42);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = color;
  ctx.fill(new Path2D(PIN_PATH));
  ctx.restore();

  ctx.beginPath();
  ctx.arc(16, 15, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const text = brand.initials;
  const size = text.length >= 3 ? 7.5 : text.length === 2 ? 9 : 11;
  ctx.font = `800 ${size}px Roboto, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = readableOnWhite(color);
  ctx.fillText(text, 16, 15.5, 18);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

const registered = new WeakSet<MaplibreMap>();
const FALLBACK: PinBrand = { color: "#5f6368", initials: "•" };

/** Idempotent; call as soon as the map instance exists (before its style finishes loading). */
export function registerPinImages(
  map: MaplibreMap,
  brandFor: (slug: string) => PinBrand | undefined,
  selectedColor: () => string,
) {
  if (registered.has(map)) return;
  registered.add(map);
  map.on("styleimagemissing", (e: { id: string }) => {
    const m = /^pin-(.+?)(-selected)?$/.exec(e.id);
    if (!m || map.hasImage(e.id)) return;
    const img = drawPin(brandFor(m[1]) ?? FALLBACK, m[2] ? selectedColor() : null);
    if (img) map.addImage(e.id, img, { pixelRatio: PIXEL_RATIO });
  });
}
