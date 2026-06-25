import { getTranslations } from "next-intl/server";
import { getMatches, getPrediction } from "@/lib/api";
import { MatchesExplorer } from "@/components/MatchesExplorer";
import { Suspense } from "react";

export const runtime = "edge";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "matches" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function MatchesPage() {
  const t = await getTranslations("matches");
  const list = await getMatches();
  const preds = await Promise.all(
    list.matches.map((m) =>
      ["TIMED", "SCHEDULED", "IN_PLAY"].includes(m.status)
        ? getPrediction(m.id).catch(() => null)
        : Promise.resolve(null)
    )
  );
  const predictions: Record<string, ReturnType<typeof getPrediction> extends Promise<infer U> ? U : never> = {};
  list.matches.forEach((m, i) => {
    predictions[m.id] = preds[i];
  });

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-20 right-0 w-[600px] h-[420px] rounded-full bg-violet-500/20 blur-[100px]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white text-balance">
            {t("title")}{" "}
            <span className="text-gradient-cyan-violet">{t("titleHighlight")}</span>
          </h1>
          <p className="mt-3 text-sm text-white/55 max-w-xl">{t("subtitle")}</p>
        </div>
        <Suspense fallback={null}>
          <MatchesExplorer matches={list.matches} predictions={predictions} />
        </Suspense>
      </div>
    </div>
  );
}
