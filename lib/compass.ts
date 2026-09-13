export function shortestAngleDelta(from: number, to: number) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function sampleCompassArc(
  cx: number,
  cy: number,
  r: number,
  start: number,
  sweep: number,
): number[] {
  const radius = Math.max(1, r);
  const abs = Math.abs(sweep);
  const steps = Math.max(2, Math.ceil((radius * Math.max(abs, 0.04)) / 2.5));
  const pts: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = start + (sweep * i) / steps;
    pts.push(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
  }
  return pts;
}

export function compassArcPath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  sweep: number,
): string | null {
  if (r < 1 || Math.abs(sweep) < 1e-4) return null;
  const polar = (a: number) => ({
    x: cx + Math.cos(a) * r,
    y: cy + Math.sin(a) * r,
  });
  const sweepFlag = sweep >= 0 ? 1 : 0;
  const a = polar(start);
  if (Math.abs(sweep) >= Math.PI * 2 - 0.002) {
    const b = polar(start + Math.PI);
    return `M ${a.x} ${a.y} A ${r} ${r} 0 1 ${sweepFlag} ${b.x} ${b.y} A ${r} ${r} 0 1 ${sweepFlag} ${a.x} ${a.y}`;
  }
  const b = polar(start + sweep);
  const large = Math.abs(sweep) > Math.PI ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} ${sweepFlag} ${b.x} ${b.y}`;
}
