export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

export const FACE_MEANING: Record<
  DieFace,
  { name: string; why: string }
> = {
  1: { name: "Point", why: "One mark. Unity, origin." },
  2: { name: "Pair", why: "Two marks. Duality." },
  3: { name: "Triangle", why: "Three sides, three corners." },
  4: { name: "Square", why: "Four sides, four corners." },
  5: { name: "Star", why: "Five points." },
  6: { name: "Hexagon", why: "Six sides, six corners." },
};

const ink = "#1c1916";
const accent = "#c45c26";

export function FaceSymbol({
  face,
  size = 72,
}: {
  face: DieFace;
  size?: number;
}) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 72 72"
      aria-hidden
      className="overflow-visible"
    >
      {face === 1 && (
        <circle cx="36" cy="36" r="11" fill={ink} />
      )}
      {face === 2 && (
        <>
          <circle cx="24" cy="36" r="9" fill={ink} />
          <circle cx="48" cy="36" r="9" fill={ink} />
        </>
      )}
      {face === 3 && (
        <polygon
          points="36,16 56,54 16,54"
          fill="none"
          stroke={ink}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      )}
      {face === 4 && (
        <rect
          x="16"
          y="16"
          width="40"
          height="40"
          fill="none"
          stroke={ink}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      )}
      {face === 5 && (
        <polygon
          points={starPoints(36, 36, 22, 9)}
          fill={accent}
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {face === 6 && (
        <polygon
          points={hexPoints(36, 36, 22)}
          fill="none"
          stroke={ink}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function starPoints(cx: number, cy: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (Math.PI / 5) * i;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

export function faceToSvgDataUrl(face: DieFace): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 72 72">
    <rect width="72" height="72" rx="8" fill="#f7f1e6" stroke="#1c1916" stroke-width="1.5"/>
    <g transform="translate(0,0)">${symbolMarkup(face)}</g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function symbolMarkup(face: DieFace): string {
  switch (face) {
    case 1:
      return `<circle cx="36" cy="36" r="11" fill="${ink}"/>`;
    case 2:
      return `<circle cx="24" cy="36" r="9" fill="${ink}"/><circle cx="48" cy="36" r="9" fill="${ink}"/>`;
    case 3:
      return `<polygon points="36,16 56,54 16,54" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>`;
    case 4:
      return `<rect x="16" y="16" width="40" height="40" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>`;
    case 5:
      return `<polygon points="${starPoints(36, 36, 22, 9)}" fill="${accent}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
    case 6:
      return `<polygon points="${hexPoints(36, 36, 22)}" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>`;
  }
}
