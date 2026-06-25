import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SwRegistrar } from "@/components/SwRegistrar";
import { routing } from "@/i18n/routing";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a14",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL("https://cuporacle.com"),
    manifest: "/manifest.webmanifest",
    icons: { icon: "/favicon.ico" },
    applicationName: "CupOracle",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "CupOracle",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      url: "https://cuporacle.com",
      siteName: "CupOracle",
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  if (!routing.locales.includes(locale as "zh" | "en")) {
    notFound();
  }
  const messages = await getMessages();
  const htmlLang = locale === "en" ? "en" : "zh-CN";

  return (
    <html lang={htmlLang} className="dark">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6520980306039403"
          crossOrigin="anonymous"
        />
        <NextIntlClientProvider messages={messages}>
          <SwRegistrar />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
