import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Playfair_Display } from "next/font/google";
import ThemeSync from "./theme-sync";
import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const displayFont = Playfair_Display({
  variable: "--font-display",
  weight: ["500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanstoolow 小站",
  description: "Sanstoolow 的个人小站，包含 Blog 展示页与 Markdown Workspace。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${bodyFont.variable} ${monoFont.variable} ${displayFont.variable} app-body`}
      >
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
