import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SITE } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: "kesakarachi — the city, right now",
  description: SITE.description,
  applicationName: "kesakarachi",
  keywords: ["Karachi", "weather", "air quality", "city", "map", "Open-Meteo", "MapLibre"],
  openGraph: {
    title: "kesakarachi",
    description: SITE.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#071014",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-phase="NIGHT" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
