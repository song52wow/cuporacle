import { Brain, Radar, Layers, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "多模型并行预测",
    desc: "MiMo / DeepSeek / GLM / MiniMax 同时生成判断，输出概率化结果，再以共识机制聚合。",
    accent: "from-cyan-400/30 to-cyan-500/0",
  },
  {
    icon: Radar,
    title: "数据驱动解释",
    desc: "每一条结论附带近期形态、H2H 历史、伤停与场地因素，概率来源可追溯。",
    accent: "from-violet-400/30 to-violet-500/0",
  },
  {
    icon: Layers,
    title: "全程赛事追踪",
    desc: "小组赛 64 场 + 淘汰赛 40 场，状态、xG、置信度实时同步，一站式查看。",
    accent: "from-emerald-400/30 to-emerald-500/0",
  },
];

export function Features() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 mt-28">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-violet-300/80 uppercase">
          <Sparkles className="w-3 h-3" /> why cuporacle
        </div>
        <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white text-balance">
          不止是预测，更是<span className="text-gradient-cyan-violet">决策辅助</span>
        </h2>
        <p className="mt-3 text-sm text-white/55">
          把 LLM 的概率判断和结构化赛事数据结合，把"玄学"变成可读、可对比、可验证的洞察。
        </p>
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
                <h3 className="mt-5 text-lg font-semibold text-white tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-white/55 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
