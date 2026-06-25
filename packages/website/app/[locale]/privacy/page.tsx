import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PrivacyContent } from "@/components/PrivacyContent";

export const runtime = "edge";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <article className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
          {t("legal")}
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="mt-4 text-sm text-white/50">{t("updated")}</p>

        <PrivacyContent locale={locale === "en" ? "en" : "zh"} />

        <p className="mt-12 text-sm text-white/40">
          <Link href="/" className="hover:text-white/70 transition-colors">
            {t("backHome")}
          </Link>
        </p>
      </article>
    </div>
  );
}
