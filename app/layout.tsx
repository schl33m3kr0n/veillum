import type { Metadata } from "next";
import { fontVariables, instrument } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vellum — design studio",
  description:
    "A page studio for type, drawing, photographs, layers, and animation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body
        className={`${fontVariables} ${instrument.className} h-full overflow-hidden`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
