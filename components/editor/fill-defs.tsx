import { gradientSpec, type Fillable } from "@/lib/fill";

export function FillDefs({ layer }: { layer: Fillable }) {
  const spec = gradientSpec(layer);
  if (!spec) return null;
  const stops = (
    <>
      <stop offset="0" stopColor={spec.from} />
      <stop offset="1" stopColor={spec.to} />
    </>
  );
  return (
    <defs>
      {spec.kind === "radial" ? (
        <radialGradient id={spec.id} cx="0.5" cy="0.5" r="0.75">
          {stops}
        </radialGradient>
      ) : (
        <linearGradient
          id={spec.id}
          x1={spec.x1}
          y1={spec.y1}
          x2={spec.x2}
          y2={spec.y2}
        >
          {stops}
        </linearGradient>
      )}
    </defs>
  );
}
