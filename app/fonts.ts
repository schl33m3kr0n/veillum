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
  Audiowide,
  Bungee_Spice,
  Creepster,
  Foldit,
  Honk,
  Kablammo,
  Megrim,
  Monoton,
  Orbitron,
  Pixelify_Sans,
  Press_Start_2P,
  Rubik_Glitch,
  Shrikhand,
  Silkscreen,
  Solway,
  Nunito_Sans,
  Jost,
  Anton,
  Crimson_Pro,
  Lilita_One,
  Montserrat,
  Oswald,
  Barlow_Condensed,
  Bodoni_Moda,
  Questrial,
} from "next/font/google";
import localFont from "next/font/local";

export const instrument = Instrument_Sans({
  subsets: ["latin"],
  preload: true,
  variable: "--font-instrument",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  preload: false,
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  preload: false,
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  preload: false,
  variable: "--font-jetbrains",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  preload: false,
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const outfit = Outfit({
  subsets: ["latin"],
  preload: false,
  variable: "--font-outfit",
});

const avenir = Nunito_Sans({
  subsets: ["latin"],
  preload: false,
  style: ["normal", "italic"],
  variable: "--font-avenir",
});

const futura = Jost({
  subsets: ["latin"],
  preload: false,
  style: ["normal", "italic"],
  variable: "--font-futura",
});

const calisto = Crimson_Pro({
  subsets: ["latin"],
  preload: false,
  style: ["normal", "italic"],
  variable: "--font-calisto",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  preload: false,
  style: ["normal", "italic"],
  variable: "--font-bodoni",
});

const centuryGothic = Questrial({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-century-gothic",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  preload: false,
  style: ["normal", "italic"],
  variable: "--font-montserrat",
});

const cooper = Lilita_One({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-cooper",
});

const oswald = Oswald({
  subsets: ["latin"],
  preload: false,
  variable: "--font-oswald",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  preload: false,
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
});

const impact = Anton({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-impact",
});

const libre = Libre_Baskerville({
  subsets: ["latin"],
  preload: false,
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-bebas",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  preload: false,
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  preload: false,
  variable: "--font-space-grotesk",
});

const syne = Syne({
  subsets: ["latin"],
  preload: false,
  variable: "--font-syne",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  preload: false,
  variable: "--font-bricolage",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  preload: false,
  variable: "--font-cinzel",
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  preload: false,
  weight: ["400", "700"],
  variable: "--font-cinzel-decorative",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  preload: false,
  variable: "--font-unbounded",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-archivo-black",
});

const spectral = Spectral({
  subsets: ["latin"],
  preload: false,
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
});

const figtree = Figtree({
  subsets: ["latin"],
  preload: false,
  variable: "--font-figtree",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-great-vibes",
});

const youngSerif = Young_Serif({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-young-serif",
});

const campfire = Solway({
  subsets: ["latin"],
  preload: false,
  weight: ["400", "700"],
  variable: "--font-campfire",
});

const flames = localFont({
  src: "../fonts/Flames.ttf",
  variable: "--font-flames",
  display: "swap",
  preload: false,
});

const rubikGlitch = Rubik_Glitch({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-rubik-glitch",
});

const monoton = Monoton({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-monoton",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  preload: false,
  variable: "--font-orbitron",
});

const silkscreen = Silkscreen({
  subsets: ["latin"],
  preload: false,
  weight: ["400", "700"],
  variable: "--font-silkscreen",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-press-start",
});

const bungeeSpice = Bungee_Spice({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-bungee-spice",
});

const kablammo = Kablammo({
  subsets: ["latin"],
  preload: false,
  variable: "--font-kablammo",
});

const honk = Honk({
  subsets: ["latin"],
  preload: false,
  variable: "--font-honk",
});

const foldit = Foldit({
  subsets: ["latin"],
  preload: false,
  variable: "--font-foldit",
});

const megrim = Megrim({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-megrim",
});

const shrikhand = Shrikhand({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-shrikhand",
});

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  preload: false,
  variable: "--font-pixelify",
});

const audiowide = Audiowide({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-audiowide",
});

const creepster = Creepster({
  subsets: ["latin"],
  preload: false,
  weight: "400",
  variable: "--font-creepster",
});

export const fontVariables = [
  instrument.variable,
  fraunces.variable,
  newsreader.variable,
  jetbrains.variable,
  cormorant.variable,
  outfit.variable,
  avenir.variable,
  futura.variable,
  calisto.variable,
  bodoni.variable,
  centuryGothic.variable,
  montserrat.variable,
  cooper.variable,
  oswald.variable,
  barlowCondensed.variable,
  impact.variable,
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
  campfire.variable,
  flames.variable,
  rubikGlitch.variable,
  monoton.variable,
  orbitron.variable,
  silkscreen.variable,
  pressStart.variable,
  bungeeSpice.variable,
  kablammo.variable,
  honk.variable,
  foldit.variable,
  megrim.variable,
  shrikhand.variable,
  pixelify.variable,
  audiowide.variable,
  creepster.variable,
].join(" ");
