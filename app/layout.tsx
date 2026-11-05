import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const thai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-thai",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Aetheris — AI Assistant",
  description: "Aetheris คือผู้ช่วย AI อัจฉริยะ พูดคุย ถามตอบ เขียนโค้ด และช่วยงานได้ทุกเรื่อง",
  icons: { icon: "/favicon.svg", apple: "/aetheris-logo.png" },
  openGraph: { title: "Aetheris", description: "Your intelligent AI assistant", images: ["/aetheris-logo.png"] },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${inter.variable} ${thai.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
