import {
  Archivo_Black,
  Bebas_Neue,
  Bricolage_Grotesque,
  Cinzel,
  Cinzel_Decorative,
  Cormorant_Garamond,
  DM_Serif_Display,
  Figtree,
  Fraunces,
  Great_Vibes,
  Instrument_Sans,
  Instrument_Serif,
  JetBrains_Mono,
  Libre_Baskerville,
  Newsreader,
  Outfit,
  Playfair_Display,
  Space_Grotesk,
  Spectral,
  Syne,
  Unbounded,
  Young_Serif,
} from "next/font/google";

export const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-cinzel-decorative",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

const youngSerif = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-young-serif",
});

export const fontVariables = [
  instrument.variable,
  fraunces.variable,
  newsreader.variable,
  jetbrains.variable,
  cormorant.variable,
  outfit.variable,
  libre.variable,
  bebas.variable,
  playfair.variable,
  spaceGrotesk.variable,
  syne.variable,
  instrumentSerif.variable,
  dmSerif.variable,
  bricolage.variable,
  cinzel.variable,
  cinzelDecorative.variable,
  unbounded.variable,
  archivoBlack.variable,
  spectral.variable,
  figtree.variable,
  greatVibes.variable,
  youngSerif.variable,
].join(" ");
