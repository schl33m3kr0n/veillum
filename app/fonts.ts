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
  Questrial,
} from "next/font/google";
import localFont from "next/font/local";

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

const avenir = Nunito_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-avenir",
});

const futura = Jost({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-futura",
});

const calisto = Crimson_Pro({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-calisto",
});

const centuryGothic = Questrial({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-century-gothic",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
});

const cooper = Lilita_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cooper",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
});

const impact = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-impact",
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

const campfire = Solway({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-campfire",
});

const flames = localFont({
  src: "../fonts/Flames.ttf",
  variable: "--font-flames",
  display: "swap",
});

const rubikGlitch = Rubik_Glitch({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-rubik-glitch",
});

const monoton = Monoton({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-monoton",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  preload: false,
  variable: "--font-orbitron",
});

const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
  variable: "--font-silkscreen",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-press-start",
});

const bungeeSpice = Bungee_Spice({
  subsets: ["latin"],
  weight: "400",
  preload: false,
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
  weight: "400",
  preload: false,
  variable: "--font-megrim",
});

const shrikhand = Shrikhand({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-shrikhand",
});

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  preload: false,
  variable: "--font-pixelify",
});

const audiowide = Audiowide({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-audiowide",
});

const creepster = Creepster({
  subsets: ["latin"],
  weight: "400",
  preload: false,
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
