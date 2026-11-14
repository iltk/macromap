import type { Map as MaplibreMap } from "maplibre-gl";
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_PATHS,
  PIN_PATH,
  SELECTED_COLOR,
  isVenueCategory,
} from "../../constants/categories";

const PIXEL_RATIO = 2;
const W = 32;
const H = 42;

/**
 * Draws a teardrop pin with the category glyph. Synchronous (canvas + Path2D),
 * so it can run inside MapLibre's `styleimagemissing` handler, which also
 * re-creates the images after the map style is switched.
 *
 * Image ids: `pin-<category>` and `pin-<category>-selected`.
 */
function drawPin(category: string, selected: boolean): ImageData | null {
  if (!isVenueCategory(category)) return null;
  const color = selected ? SELECTED_COLOR : CATEGORY_COLORS[category];
  const canvas = document.createElement("canvas");
  canvas.width = W * PIXEL_RATIO;
  canvas.height = H * PIXEL_RATIO;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);

  // body (slightly inset so the drop shadow isn't clipped)
  ctx.save();
  ctx.translate(2, 1);
  ctx.scale(28 / 32, 39 / 42);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = color;
  ctx.fill(new Path2D(PIN_PATH));
  ctx.restore();

  // white disc
  ctx.beginPath();
  ctx.arc(16, 15, 9.5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // glyph, 13px centred on the disc
  ctx.save();
  ctx.translate(16 - 6.5, 15 - 6.5);
  ctx.scale(13 / 24, 13 / 24);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(CATEGORY_ICON_PATHS[category]));
  ctx.restore();

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

const registered = new WeakSet<MaplibreMap>();

/** Idempotent; call as soon as the map instance exists (before its style finishes loading). */
export function registerPinImages(map: MaplibreMap) {
  if (registered.has(map)) return;
  registered.add(map);
  map.on("styleimagemissing", (e: { id: string }) => {
    const m = /^pin-([a-z]+)(-selected)?$/.exec(e.id);
    if (!m || map.hasImage(e.id)) return;
    const img = drawPin(m[1], Boolean(m[2]));
    if (img) map.addImage(e.id, img, { pixelRatio: PIXEL_RATIO });
  });
}
