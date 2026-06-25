import { getTranslations } from "next-intl/server";
import { Brain, Radar, Layers } from "lucide-react";

export async function Features() {
  const t = await getTranslations("features");

  const FEATURES = [
    { icon: Brain, title: t("multiModel.title"), desc: t("multiModel.desc"), accent: "from-cyan-400/30 to-cyan-500/0" },
    { icon: Radar, title: t("dataDriven.title"), desc: t("dataDriven.desc"), accent: "from-violet-400/30 to-violet-500/0" },
    { icon: Layers, title: t("fullTournament.title"), desc: t("fullTournament.desc"), accent: "from-emerald-400/30 to-emerald-500/0" },
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 mt-28">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white text-balance">
          {t("title")}
          <span className="text-gradient-cyan-violet">{t("titleHighlight")}</span>
        </h2>
        <p className="mt-3 text-sm text-white/55">{t("subtitle")}</p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="group relative glass rounded-2xl p-6 overflow-hidden hover:border-white/20 transition"
            >
              <div
                className={`pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br ${f.accent} blur-3xl opacity-60 group-hover:opacity-100 transition`}
              />
              <div className="relative">
                <div className="w-10 h-10 rounded-lg grid place-items-center bg-white/[0.05] border border-white/10">
                  <Icon className="w-5 h-5 text-cyan-300" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm text-white/55 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
