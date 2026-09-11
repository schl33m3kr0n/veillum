"use client";

import { useState } from "react";
import Link from "next/link";
import { FACE_MEANING, FaceSymbol, type DieFace } from "@/lib/dice-symbols";
import { DieCube } from "./die-cube";

function rollFace(): DieFace {
  return (Math.floor(Math.random() * 6) + 1) as DieFace;
}

export function SymbolDiePage() {
  const [face, setFace] = useState<DieFace>(1);
  const [turns, setTurns] = useState({ x: 0, y: 0 });
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setTurns((t) => ({
      x: t.x + 1 + Math.floor(Math.random() * 2),
      y: t.y + 2 + Math.floor(Math.random() * 2),
    }));
    setFace(rollFace());
    window.setTimeout(() => setRolling(false), 900);
  };

  const meaning = FACE_MEANING[face];

  return (
    <div className="flex h-dvh flex-col overflow-auto bg-[#1f1c19] text-[#f7f1e6]">
      <header className="flex items-center justify-between px-6 py-4">
        <p className="font-[family-name:var(--font-fraunces)] text-xl tracking-tight">
          Symbol die
        </p>
        <Link
          href="/"
          className="text-sm text-[#d4a054] underline-offset-4 hover:underline"
        >
          Back to studio
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 pb-16">
        <DieCube
          face={face}
          turns={turns}
          rolling={rolling}
          size={196}
          onRoll={roll}
        />
        <div className="max-w-sm text-center">
          <p className="font-[family-name:var(--font-fraunces)] text-3xl">
            {meaning.name}
            <span className="ml-2 text-xl text-[#d4a054]">{face}</span>
          </p>
          <p className="mt-2 text-sm text-[#cfc8bc]">{meaning.why}</p>
          <p className="mt-4 text-xs tracking-wide text-[#8a8276] uppercase">
            Click the cube to roll
          </p>
        </div>
        <ul className="grid w-full max-w-xl grid-cols-3 gap-3 sm:grid-cols-6">
          {([1, 2, 3, 4, 5, 6] as DieFace[]).map((n) => (
            <li
              key={n}
              className={`flex flex-col items-center rounded-lg border bg-[#f7f1e6] p-2 text-[#1c1916] ${
                n === face ? "ring-2 ring-[#d4a054]" : "border-[#2a2622]"
              }`}
            >
              <FaceSymbol face={n} size={44} />
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wide">
                {FACE_MEANING[n].name}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
