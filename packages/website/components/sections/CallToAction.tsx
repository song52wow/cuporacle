import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export function CallToAction() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 mt-28">
      <div className="relative glass-strong rounded-3xl overflow-hidden p-10 sm:p-14">
        <div className="pointer-events-none absolute -top-32 -right-20 w-[480px] h-[480px] rounded-full bg-cyan-violet opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-[360px] h-[360px] rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-cyan-300/80 uppercase">
              <Zap className="w-3 h-3" /> ready to dive in
            </div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight text-white text-balance">
              下一场比赛的胜负
              <br />
              <span className="text-gradient-cyan-violet">AI 怎么看？</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-white/60 max-w-lg">
              浏览全部赛事的完整预测、关键因素与多模型对比，找到属于你的判断。
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
            <Link
              href="/matches"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-cyan-violet text-ink-950 font-semibold shadow-neon hover:brightness-110 transition"
            >
              进入赛事中心
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/matches?status=TIMED"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full glass text-white/85 font-medium hover:text-white"
            >
              关注未开赛
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
