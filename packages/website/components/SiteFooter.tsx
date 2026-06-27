import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "./Logo";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="relative mt-24 border-t border-white/5">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 text-sm text-white/55 max-w-md">{t("about")}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold tracking-widest text-white/50 uppercase">
            {t("platform")}
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/" className="text-white/70 hover:text-white">{t("home")}</Link></li>
            <li><Link href="/matches" className="text-white/70 hover:text-white">{t("allMatches")}</Link></li>
            <li><Link href="/standings" className="text-white/70 hover:text-white">{t("standings")}</Link></li>
            <li><Link href="/matches#TIMED" className="text-white/70 hover:text-white">{t("upcoming")}</Link></li>
            <li><Link href="/matches#FINISHED" className="text-white/70 hover:text-white">{t("finished")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold tracking-widest text-white/50 uppercase">
            {t("legal")}
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/privacy" className="text-white/70 hover:text-white">{t("privacy")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex items-center justify-center">
          <p className="text-xs text-white/30 font-mono">© 2026 CupOracle</p>
        </div>
      </div>
    </footer>
  );
}
