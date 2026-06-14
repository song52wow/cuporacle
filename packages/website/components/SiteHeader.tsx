"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { Activity, Trophy } from "lucide-react";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/matches", label: "赛事" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 glass-strong border-b border-white/5" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path?.startsWith(n.href);
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
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full hairline text-emerald-300/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
            LIVE · 2026
          </span>
          <Link
            href="/matches"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full bg-cyan-violet text-ink-950 hover:brightness-110 transition"
          >
            <Trophy className="w-4 h-4" />
            查看预测
          </Link>
        </div>
      </div>
    </header>
  );
}
