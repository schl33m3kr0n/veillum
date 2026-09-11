"use client";

import { FaceSymbol, type DieFace } from "@/lib/dice-symbols";

const FACE_ROT: Record<DieFace, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

export function DieCube({
  face,
  turns,
  rolling,
  size = 168,
  onRoll,
}: {
  face: DieFace;
  turns: { x: number; y: number };
  rolling: boolean;
  size?: number;
  onRoll: () => void;
}) {
  const half = size / 2;
  const rot = FACE_ROT[face];
  const transform = `rotateX(${turns.x * 360 + rot.x}deg) rotateY(${turns.y * 360 + rot.y}deg)`;
  const mark = Math.round(size * 0.64);

  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={rolling}
      aria-label={`Roll die. Showing ${face}.`}
      className="die-scene shrink-0 cursor-pointer"
      style={{ width: size, height: size, perspective: size * 5.5 }}
    >
      <div
        className="die-cube relative"
        style={{
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          transform,
          transition: rolling
            ? "transform 0.9s cubic-bezier(0.2, 0.75, 0.2, 1)"
            : "transform 0.35s ease",
        }}
      >
        {(
          [
            [1, `rotateY(0deg) translateZ(${half}px)`],
            [6, `rotateY(180deg) translateZ(${half}px)`],
            [3, `rotateY(90deg) translateZ(${half}px)`],
            [4, `rotateY(-90deg) translateZ(${half}px)`],
            [2, `rotateX(90deg) translateZ(${half}px)`],
            [5, `rotateX(-90deg) translateZ(${half}px)`],
          ] as const
        ).map(([n, t]) => (
          <div
            key={n}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-md border border-[#1c1916] bg-[#f7f1e6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
            style={{
              transform: t,
              backfaceVisibility: "hidden",
            }}
          >
            <FaceSymbol face={n} size={mark} />
            <span className="absolute right-2 bottom-1.5 font-[family-name:var(--font-fraunces)] text-xs text-[#7a7268]">
              {n}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}
