import type { FontFamily } from "./types";

const STACKS: Record<FontFamily, string> = {
  Newsreader: 'var(--font-newsreader), "Newsreader", serif',
  Fraunces: 'var(--font-fraunces), "Fraunces", serif',
  "Libre Baskerville": 'var(--font-libre), "Libre Baskerville", serif',
  "Cormorant Garamond": 'var(--font-cormorant), "Cormorant Garamond", serif',
  Spectral: 'var(--font-spectral), "Spectral", serif',
  "Young Serif": 'var(--font-young-serif), "Young Serif", serif',
  "Instrument Serif": 'var(--font-instrument-serif), "Instrument Serif", serif',
  "Playfair Display": 'var(--font-playfair), "Playfair Display", serif',
  "DM Serif Display": 'var(--font-dm-serif), "DM Serif Display", serif',
  "Instrument Sans": 'var(--font-instrument), "Instrument Sans", sans-serif',
  Outfit: 'var(--font-outfit), "Outfit", sans-serif',
  Figtree: 'var(--font-figtree), "Figtree", sans-serif',
  "Space Grotesk": 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
  "Bricolage Grotesque":
    'var(--font-bricolage), "Bricolage Grotesque", sans-serif',
  Syne: 'var(--font-syne), "Syne", sans-serif',
  "Bebas Neue": 'var(--font-bebas), "Bebas Neue", sans-serif',
  "Archivo Black": 'var(--font-archivo-black), "Archivo Black", sans-serif',
  Unbounded: 'var(--font-unbounded), "Unbounded", sans-serif',
  Cinzel: 'var(--font-cinzel), "Cinzel", serif',
  "Cinzel Decorative":
    'var(--font-cinzel-decorative), "Cinzel Decorative", serif',
  "Great Vibes": 'var(--font-great-vibes), "Great Vibes", cursive',
  "JetBrains Mono": 'var(--font-jetbrains), "JetBrains Mono", monospace',
};

export function cssFontFamily(family: string): string {
  return STACKS[family as FontFamily] ?? `"${family}", serif`;
}
