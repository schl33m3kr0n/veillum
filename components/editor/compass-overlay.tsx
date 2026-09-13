"use client";

export type CompassDraft = {
  cx: number;
  cy: number;
  r: number;
  angle: number;
};

export type CompassHit = "needle" | "pencil" | "empty";

export const COMPASS_HANDLE = 16;

export function compassPencil(c: CompassDraft) {
  const radius = Math.max(0, c.r);
  return {
    x: c.cx + Math.cos(c.angle) * radius,
    y: c.cy + Math.sin(c.angle) * radius,
  };
}

export function hitCompass(
  c: CompassDraft,
  p: { x: number; y: number },
): CompassHit {
  const pencil = compassPencil(c);
  const dPencil = Math.hypot(p.x - pencil.x, p.y - pencil.y);
  const dNeedle = Math.hypot(p.x - c.cx, p.y - c.cy);
  const pencilHit = dPencil <= COMPASS_HANDLE;
  const needleHit = dNeedle <= COMPASS_HANDLE;
  if (pencilHit && needleHit) return dPencil <= dNeedle ? "pencil" : "needle";
  if (pencilHit) return "pencil";
  if (needleHit) return "needle";
  return "empty";
}

export function CompassOverlay({
  cx,
  cy,
  r,
  angle,
  color,
  focus = null,
}: {
  cx: number;
  cy: number;
  r: number;
  angle: number;
  color: string;
  focus?: CompassHit | null;
}) {
  const radius = Math.max(0, r);
  const px = cx + Math.cos(angle) * radius;
  const py = cy + Math.sin(angle) * radius;
  const mx = (cx + px) / 2;
  const my = (cy + py) / 2;
  const vx = px - cx;
  const vy = py - cy;
  const len = Math.hypot(vx, vy) || 1;
  let nx = -vy / len;
  let ny = vx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const lift = Math.max(28, radius * 0.55);
  const hx = mx + nx * lift;
  const hy = my + ny * lift;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      {radius > 2 && (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={1.75}
          strokeDasharray="5 4"
          opacity={0.9}
        />
      )}
      <line
        x1={hx}
        y1={hy}
        x2={cx}
        y2={cy}
        stroke="#1c1916"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <line
        x1={hx}
        y1={hy}
        x2={px}
        y2={py}
        stroke="#c45c26"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <circle cx={hx} cy={hy} r={5.5} fill="#f7f1e6" stroke="#1c1916" strokeWidth={1.5} />
      <circle
        cx={cx}
        cy={cy}
        r={focus === "needle" ? 11 : 9}
        fill="none"
        stroke="#f7f1e6"
        strokeWidth={1.25}
        opacity={focus === "needle" ? 0.95 : 0.45}
      />
      <circle cx={cx} cy={cy} r={5} fill="#1c1916" />
      <circle
        cx={px}
        cy={py}
        r={focus === "pencil" ? 10 : 8}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        opacity={focus === "pencil" ? 0.95 : 0.5}
      />
      <circle cx={px} cy={py} r={4.5} fill={color} stroke="#1c1916" strokeWidth={1} />
      {radius > 12 && (
        <text
          x={cx}
          y={Math.max(cy, py) + 18}
          textAnchor="middle"
          fill="#f7f1e6"
          stroke="#1c1916"
          strokeWidth={3}
          paintOrder="stroke"
          fontSize={11}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {Math.round(radius)}
        </text>
      )}
    </svg>
  );
}
