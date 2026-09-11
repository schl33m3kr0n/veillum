"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor-store";
import {
  FACE_MEANING,
  FaceSymbol,
  faceToSvgDataUrl,
  type DieFace,
} from "@/lib/dice-symbols";

const SIZE = 112;
const HALF = SIZE / 2;

const FACE_ROT: Record<DieFace, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

function rollFace(): DieFace {
  return (Math.floor(Math.random() * 6) + 1) as DieFace;
}

export function SymbolDie() {
  const [face, setFace] = useState<DieFace>(1);
  const [turns, setTurns] = useState({ x: 0, y: 0 });
  const [rolling, setRolling] = useState(false);

  const rot = FACE_ROT[face];
  const transform = `rotateX(${turns.x * 360 + rot.x}deg) rotateY(${turns.y * 360 + rot.y}deg)`;

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    const next = rollFace();
    setTurns((t) => ({
      x: t.x + 1 + Math.floor(Math.random() * 2),
      y: t.y + 2 + Math.floor(Math.random() * 2),
    }));
    setFace(next);
    window.setTimeout(() => setRolling(false), 900);
  };

  const place = () => {
    useEditorStore.getState().addImageFromSrc(faceToSvgDataUrl(face), {
      name: `${FACE_MEANING[face].name} (${face})`,
      width: 160,
      height: 160,
    });
  };

  const meaning = FACE_MEANING[face];

  return (
    <div className="pointer-events-auto absolute bottom-3 left-10 z-30 flex items-end gap-3 rounded-xl border border-border/70 bg-card/95 p-3 shadow-lg backdrop-blur-sm">
      <button
        type="button"
        onClick={roll}
        disabled={rolling}
        aria-label={`Roll die. Showing ${face}, ${meaning.name}.`}
        className="die-scene shrink-0"
        style={{ width: SIZE, height: SIZE, perspective: 640 }}
      >
        <div
          className="die-cube relative"
          style={{
            width: SIZE,
            height: SIZE,
            transformStyle: "preserve-3d",
            transform,
            transition: rolling
              ? "transform 0.9s cubic-bezier(0.2, 0.75, 0.2, 1)"
              : "transform 0.35s ease",
          }}
        >
          {(
            [
              [1, `rotateY(0deg) translateZ(${HALF}px)`],
              [6, `rotateY(180deg) translateZ(${HALF}px)`],
              [3, `rotateY(90deg) translateZ(${HALF}px)`],
              [4, `rotateY(-90deg) translateZ(${HALF}px)`],
              [2, `rotateX(90deg) translateZ(${HALF}px)`],
              [5, `rotateX(-90deg) translateZ(${HALF}px)`],
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
              <FaceSymbol face={n} size={72} />
              <span className="absolute right-1.5 bottom-1 font-[family-name:var(--font-fraunces)] text-[10px] text-[#7a7268]">
                {n}
              </span>
            </div>
          ))}
        </div>
      </button>
      <div className="w-40 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Symbol die
        </p>
        <p className="text-sm leading-tight">
          <span className="font-medium">{meaning.name}</span>
          <span className="text-muted-foreground"> · {face}</span>
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {meaning.why} Click the cube to roll.
        </p>
        <Button size="xs" variant="outline" onClick={place}>
          Place face on page
        </Button>
      </div>
    </div>
  );
}
