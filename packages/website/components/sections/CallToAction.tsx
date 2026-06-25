import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

export async function CallToAction() {
  const t = await getTranslations("cta");

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 mt-28">
      <div className="relative glass-strong rounded-3xl overflow-hidden p-10 sm:p-14">
        <div className="pointer-events-none absolute -top-32 -right-20 w-[480px] h-[480px] rounded-full bg-cyan-violet opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-[360px] h-[360px] rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white text-balance">
              {t("title1")}
              <br />
              <span className="text-gradient-cyan-violet">{t("title2")}</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-white/60 max-w-lg">{t("subtitle")}</p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
            <Link
              href="/matches"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-cyan-violet text-ink-950 font-semibold shadow-neon hover:brightness-110 transition"
            >
              {t("enter")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/matches#TIMED"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full glass text-white/85 font-medium hover:text-white"
            >
              {t("upcoming")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
