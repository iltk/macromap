import { useEffect, useRef, useState } from "react";
import type { DayPoint } from "../../utils/history";

interface Props {
  title: string;
  points: DayPoint[];
  value: (p: DayPoint) => number;
  unit: string;
  target: number | null;
  color: string;
  height?: number;
}

const PAD = { top: 12, right: 8, bottom: 26, left: 40 };
const fmt = (n: number) => Math.round(n).toLocaleString();

function niceMax(v: number) {
  if (v <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => (s * pow) >= v / 4)! * pow;
  return Math.ceil(v / step) * step;
}

/** Path for a bar with 4px rounded top corners and a square base. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** One column per day with an optional target line. Every value is also in the history table. */
export function DayBarChart({ title, points, value, unit, target, color, height = 180 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const values = points.map(value);
  const max = niceMax(Math.max(...values, target ? target * 1.1 : 0));
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const band = plotW / points.length;
  const barW = Math.max(3, Math.min(24, band * 0.6));
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const labelEvery = points.length <= 10 ? 1 : Math.ceil(points.length / 6);
  const activePoint = active !== null ? points[active] : null;

  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 text-sm font-semibold text-gray-900">{title}</figcaption>
      <div ref={wrap} className="relative" onMouseLeave={() => setActive(null)}>
        <svg width={width} height={height} role="img" aria-label={`${title} by day`} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-gray-200)" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-gray-500 text-[10px]">
                {fmt(t)}
              </text>
            </g>
          ))}

          {points.map((p, i) => {
            const v = values[i];
            const x = PAD.left + band * i + (band - barW) / 2;
            const h = Math.max(0, PAD.top + plotH - y(v));
            return (
              <g key={p.key}>
                {v > 0 && <path d={barPath(x, y(v), barW, h)} fill={color} opacity={active === null || active === i ? 1 : 0.45} />}
                {i % labelEvery === 0 && (
                  <text x={PAD.left + band * i + band / 2} y={height - 8} textAnchor="middle" className="fill-gray-500 text-[10px]">
                    {points.length <= 10 ? p.date.toLocaleDateString(undefined, { weekday: "short" }) : p.date.getDate()}
                  </text>
                )}
                {/* hit target: the whole band, taller than the bar */}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${p.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}: ${p.logged ? `${fmt(v)} ${unit}` : "nothing logged"}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="outline-none focus-visible:stroke-gray-900"
                />
              </g>
            );
          })}

          {target !== null && target > 0 && (
            <g pointerEvents="none">
              <line x1={PAD.left} x2={width - PAD.right} y1={y(target)} y2={y(target)} stroke="var(--color-gray-700)" strokeWidth={1.5} />
              <text x={width - PAD.right} y={y(target) - 4} textAnchor="end" className="fill-gray-700 text-[10px] font-medium">
                Target {fmt(target)}
              </text>
            </g>
          )}
          <line x1={PAD.left} x2={width - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="var(--color-gray-300)" strokeWidth={1} />
        </svg>

        {activePoint && active !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
            style={{
              left: Math.min(Math.max(PAD.left + band * active + band / 2, 70), width - 70),
              top: Math.max(0, y(values[active]) - 52),
            }}
          >
            <p className="font-medium text-gray-900">
              {activePoint.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <p className="text-gray-700">
              {activePoint.logged ? (
                <>
                  {fmt(values[active])} {unit}
                  {target ? <span className="text-gray-500"> · {Math.round((values[active] / target) * 100)}% of target</span> : null}
                </>
              ) : (
                <span className="text-gray-500">Nothing logged</span>
              )}
            </p>
          </div>
        )}
      </div>
    </figure>
  );
}
