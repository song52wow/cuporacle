"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

const LOCALE_LABEL: Record<Locale, string> = {
  zh: "中文",
  en: "EN",
};

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 p-0.5 rounded-full hairline bg-white/[0.03]",
        className
      )}
      role="group"
      aria-label="Language"
    >
      <Globe className="w-3.5 h-3.5 text-white/40 ml-2 hidden sm:block" />
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchTo(loc)}
          className={cn(
            "px-2.5 py-1 text-[11px] font-mono rounded-full transition",
            locale === loc
              ? "bg-white/[0.08] text-white"
              : "text-white/50 hover:text-white/80"
          )}
        >
          {LOCALE_LABEL[loc]}
        </button>
      ))}
    </div>
  );
}
