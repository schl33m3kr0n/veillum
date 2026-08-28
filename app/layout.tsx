import type { Metadata } from "next";
import {
  Bebas_Neue,
  Cormorant_Garamond,
  Fraunces,
  Instrument_Sans,
  JetBrains_Mono,
  Libre_Baskerville,
  Newsreader,
  Outfit,
} from "next/font/google";
import "./globals.css";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: "Vellum — design studio",
  description:
    "A page studio for type, drawing, photographs, layers, and animation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${instrument.variable} ${fraunces.variable} ${newsreader.variable} ${jetbrains.variable} ${cormorant.variable} ${outfit.variable} ${libre.variable} ${bebas.variable} h-full antialiased`}
    >
      <body className={`${instrument.className} h-full overflow-hidden`}>
        <span
          aria-hidden
          className={`${fraunces.className} ${newsreader.className} ${jetbrains.className} ${cormorant.className} ${outfit.className} ${libre.className} ${bebas.className} hidden`}
        >
          Aa
        </span>
        {children}
      </body>
    </html>
  );
}
