import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const nunito = Nunito({ subsets: ["latin", "latin-ext"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Habla – learn Spanish, one bite at a time", template: "%s · Habla" },
  description: "A playful, gamified way to learn Spanish.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#58CC02", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
