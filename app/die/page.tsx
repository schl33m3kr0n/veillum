import type { Metadata } from "next";
import { SymbolDiePage } from "@/components/die/symbol-die-page";

export const metadata: Metadata = {
  title: "Symbol die — Vellum",
  description:
    "A die whose faces are the shapes of one through six: point, pair, triangle, square, star, hexagon.",
};

export default function DieRoute() {
  return <SymbolDiePage />;
}
