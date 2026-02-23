import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Cal_Sans } from "next/font/google";
import ThemeSync from "./theme-sync";
import ThemeToggle from "./theme-toggle";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Cal_Sans({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
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
        <nav className="nav-header">
          <div className="nav-logo">
            <span>./</span>sanstoolow
          </div>
          <div className="nav-actions">
            <ThemeToggle />
          </div>
        </nav>
        <div style={{ paddingTop: "80px" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
