import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CupOracle · 世界杯 AI 预测平台",
  description:
    "基于多模型 LLM 的 2026 世界杯胜负、概率与比分预测，覆盖小组赛至决赛的全程赛事追踪。",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "CupOracle · 世界杯 AI 预测平台",
    description:
      "基于多模型 LLM 的 2026 世界杯胜负、概率与比分预测，覆盖小组赛至决赛的全程赛事追踪。",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
