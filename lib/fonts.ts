import type { BundledFont } from "./types";
import { hasCustomFont } from "./custom-fonts";

const STACKS: Record<BundledFont, string> = {
  Newsreader: 'var(--font-newsreader), "Newsreader", serif',
  Fraunces: 'var(--font-fraunces), "Fraunces", serif',
  "Libre Baskerville": 'var(--font-libre), "Libre Baskerville", serif',
  "Cormorant Garamond": 'var(--font-cormorant), "Cormorant Garamond", serif',
  Spectral: 'var(--font-spectral), "Spectral", serif',
  "Young Serif": 'var(--font-young-serif), "Young Serif", serif',
  "Instrument Serif": 'var(--font-instrument-serif), "Instrument Serif", serif',
  "Playfair Display": 'var(--font-playfair), "Playfair Display", serif',
  "DM Serif Display": 'var(--font-dm-serif), "DM Serif Display", serif',
  Calisto:
    '"Calisto MT", Calisto, "Calisto MT Std", var(--font-calisto), serif',
  "Instrument Sans": 'var(--font-instrument), "Instrument Sans", sans-serif',
  "Avenir Book":
    '"Avenir-Book", "Avenir Book", Avenir, "Avenir Next", var(--font-avenir), sans-serif',
  "Avenir Medium":
    '"Avenir-Medium", "Avenir Medium", Avenir, "Avenir Next", var(--font-avenir), sans-serif',
  "Avenir Heavy":
    '"Avenir-Heavy", "Avenir Heavy", Avenir, "Avenir Next", var(--font-avenir), sans-serif',
  "Avenir Next":
    '"Avenir Next", "AvenirNext-Regular", Avenir, var(--font-avenir), sans-serif',
  "Futura Light":
    '"Futura-Light", "Futura Light", Futura, var(--font-futura), sans-serif',
  "Futura Medium":
    '"Futura-Medium", "Futura Medium", Futura, var(--font-futura), sans-serif',
  "Futura Bold":
    '"Futura-Bold", "Futura Bold", Futura, var(--font-futura), sans-serif',
  Outfit: 'var(--font-outfit), "Outfit", sans-serif',
  Figtree: 'var(--font-figtree), "Figtree", sans-serif',
  "Space Grotesk": 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
  "Bricolage Grotesque":
    'var(--font-bricolage), "Bricolage Grotesque", sans-serif',
  Syne: 'var(--font-syne), "Syne", sans-serif',
  "Century Gothic":
    '"Century Gothic", CenturyGothic, AppleGothic, var(--font-century-gothic), sans-serif',
  Montserrat: 'var(--font-montserrat), "Montserrat", sans-serif',
  "Bebas Neue": 'var(--font-bebas), "Bebas Neue", sans-serif',
  "Archivo Black": 'var(--font-archivo-black), "Archivo Black", sans-serif',
  Unbounded: 'var(--font-unbounded), "Unbounded", sans-serif',
  Cinzel: 'var(--font-cinzel), "Cinzel", serif',
  "Cinzel Decorative":
    'var(--font-cinzel-decorative), "Cinzel Decorative", serif',
  Campfire: 'var(--font-campfire), "Campfire", "Solway", serif',
  "Cooper Black":
    '"Cooper Black", "Cooper Black Std", CooperBlack, var(--font-cooper), sans-serif',
  Oswald: 'var(--font-oswald), "Oswald", sans-serif',
  "Barlow Condensed":
    'var(--font-barlow-condensed), "Barlow Condensed", sans-serif',
  Impact:
    'Impact, Haettenschweiler, "Arial Narrow Bold", var(--font-impact), sans-serif',
  "Great Vibes": 'var(--font-great-vibes), "Great Vibes", cursive',
  "Rubik Glitch": 'var(--font-rubik-glitch), "Rubik Glitch", sans-serif',
  Monoton: 'var(--font-monoton), "Monoton", sans-serif',
  Orbitron: 'var(--font-orbitron), "Orbitron", sans-serif',
  Silkscreen: 'var(--font-silkscreen), "Silkscreen", sans-serif',
  "Press Start 2P": 'var(--font-press-start), "Press Start 2P", sans-serif',
  "Bungee Spice": 'var(--font-bungee-spice), "Bungee Spice", sans-serif',
  Kablammo: 'var(--font-kablammo), "Kablammo", sans-serif',
  Honk: 'var(--font-honk), "Honk", sans-serif',
  Foldit: 'var(--font-foldit), "Foldit", sans-serif',
  Megrim: 'var(--font-megrim), "Megrim", sans-serif',
  Shrikhand: 'var(--font-shrikhand), "Shrikhand", cursive',
  "Pixelify Sans": 'var(--font-pixelify), "Pixelify Sans", sans-serif',
  Audiowide: 'var(--font-audiowide), "Audiowide", sans-serif',
  Creepster: 'var(--font-creepster), "Creepster", cursive',
  Flames: 'var(--font-flames), "Flames", cursive',
  "JetBrains Mono": 'var(--font-jetbrains), "JetBrains Mono", monospace',
};

export function cssFontFamily(family: string): string {
  if (hasCustomFont(family)) return `"${family}", serif`;
  return STACKS[family as BundledFont] ?? `"${family}", serif`;
}

const FAMILY_WEIGHT: Record<string, { regular: number; bold: number }> = {
  "Avenir Book": { regular: 400, bold: 800 },
  "Avenir Medium": { regular: 500, bold: 800 },
  "Avenir Heavy": { regular: 800, bold: 900 },
  "Avenir Next": { regular: 400, bold: 700 },
  "Futura Light": { regular: 300, bold: 500 },
  "Futura Medium": { regular: 500, bold: 700 },
  "Futura Bold": { regular: 700, bold: 800 },
  "Cooper Black": { regular: 400, bold: 400 },
  Impact: { regular: 400, bold: 400 },
};

export function cssFontWeight(family: string, bold: boolean): number {
  const pair = FAMILY_WEIGHT[family] ?? { regular: 400, bold: 700 };
  return bold ? pair.bold : pair.regular;
}
