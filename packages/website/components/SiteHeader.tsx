"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "./Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { cn } from "@/lib/utils";
import { AlertTriangle, Menu, Trophy, X } from "lucide-react";

export function SiteHeader() {
  const path = usePathname();
  const t = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV = [
    { href: "/" as const, label: t("home") },
    { href: "/matches" as const, label: t("matches") },
    { href: "/standings" as const, label: t("standings") },
  ];

  // Close menu whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  function isActive(href: "/" | "/matches" | "/standings") {
    return href === "/" ? path === "/" : !!path?.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Disclaimer banner — sits above the main nav row, sticky together with it */}
      <div
        role="note"
        className="relative border-b border-amber-400/15 bg-amber-500/[0.07] backdrop-blur-md"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-8 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-amber-100/85">
          <AlertTriangle className="w-3 h-3 shrink-0 text-amber-300/90" aria-hidden />
          <span className="truncate text-center">{t("disclaimer")}</span>
        </div>
      </div>

      {/* Main nav row */}
      <div className="relative">
        <div className="absolute inset-0 glass-strong border-b border-white/5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* LEFT: logo + (PC) nav */}
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <Logo />
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {NAV.map((n) => {
                const active = isActive(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cn(
                      "px-3.5 py-2 rounded-full transition-colors",
                      active
                        ? "text-white bg-white/[0.06]"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* RIGHT: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hamburger (mobile only) */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full hairline text-white/80 hover:text-white hover:bg-white/[0.04] transition"
              aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu-panel"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden />
              ) : (
                <Menu className="w-5 h-5" aria-hidden />
              )}
            </button>
            <LocaleSwitcher className="hidden sm:inline-flex" />
            <NotificationBell />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full hairline text-emerald-300/90">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              {t("live")}
            </span>
            <Link
              href="/matches"
              aria-label={t("viewPredictions")}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 sm:px-3.5 py-2 rounded-full bg-cyan-violet text-ink-950 hover:brightness-110 transition"
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">{t("viewPredictions")}</span>
            </Link>
          </div>
        </div>

        {/* Mobile backdrop — click to close */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-x-0 bottom-0 top-24 z-30 bg-black/55 backdrop-blur-sm animate-fade-up"
            aria-hidden
          />
        )}

        {/* Mobile dropdown panel — full nav + locale (since locale is hidden < sm) */}
        <div
          id="mobile-menu-panel"
          className={cn(
            "md:hidden relative z-40",
            "grid transition-[grid-template-rows] duration-200 ease-out",
            mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-white/5 bg-[#070716]/95 backdrop-blur-md">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col gap-3">
                {/* Nav links */}
                <nav className="flex flex-col">
                  {NAV.map((n) => {
                    const active = isActive(n.href);
                    return (
                      <Link
                        key={n.href}
                        href={n.href}
                        className={cn(
                          "flex items-center px-3 py-3.5 rounded-lg text-base transition-colors",
                          active
                            ? "text-white bg-white/[0.06]"
                            : "text-white/75 hover:text-white hover:bg-white/[0.04]"
                        )}
                      >
                        {n.label}
                      </Link>
                    );
                  })}
                </nav>

                {/* Locale switcher — surfaced here because the top-bar switcher is hidden below sm */}
                <div className="sm:hidden pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                    {t("language")}
                  </span>
                  <LocaleSwitcher />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}