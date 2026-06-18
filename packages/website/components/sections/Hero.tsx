"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Activity, BarChart3, Trophy } from "lucide-react";
import { TeamFlag } from "@/components/TeamFlag";

// 2026 世界杯决赛开球时间（UTC）：7月19日 20:00 = 北京时间 7月20日 04:00
const FINAL_KICKOFF = new Date("2026-07-19T20:00:00Z");

function daysUntil(target: Date): number {
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86_400_000));
}

export function Hero() {
  // SSR 阶段不计算天数,避免水合不匹配；挂载后每 60 分钟刷新一次
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    setDaysLeft(daysUntil(FINAL_KICKOFF));
    const id = setInterval(() => setDaysLeft(daysUntil(FINAL_KICKOFF)), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="relative overflow-hidden">
      {/* 装饰：网格 + 光晕 */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full bg-cyan-violet opacity-25 blur-[120px]" />
      <div className="pointer-events-none absolute top-40 right-0 w-[420px] h-[420px] rounded-full bg-violet-500/30 blur-[100px]" />
      <div className="pointer-events-none absolute top-60 left-0 w-[360px] h-[360px] rounded-full bg-cyan-400/25 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-24">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
          {/* 左侧：文案 */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full hairline bg-white/[0.03] text-xs font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="text-emerald-300/90">LIVE</span>
              <span className="text-white/40">·</span>
              <span className="text-white/70">2026 美加墨世界杯 · 决赛 7月20日 · 剩 {daysLeft ?? "—"} 天</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-balance"
            >
              <span className="text-white">让多模型 AI</span>
              <br />
              <span className="text-gradient-cyan-violet">读懂世界杯</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-white/65 max-w-xl leading-relaxed"
            >
              汇总多家主流大模型的判断，给出每场比赛的胜平负概率、最可能比分与关键因素。
              从小组赛到决赛，<span className="text-white">每一次判断都有迹可循</span>。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/matches?status=TIMED"
                className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-cyan-violet text-ink-950 font-semibold text-sm shadow-neon hover:brightness-110 transition"
              >
                <Sparkles className="w-4 h-4" />
                关注即将开赛
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
              <Link
                href="/matches"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full glass text-white/85 font-medium text-sm hover:text-white"
              >
                <Trophy className="w-4 h-4" />
                查看全部赛事
              </Link>
            </motion.div>

            {/* 模型徽章 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-2"
            >
              {["MiMo-7B", "DeepSeek", "GLM-4", "MiniMax"].map((m) => (
                <span
                  key={m}
                  className="text-xs font-mono px-2.5 py-1 rounded-full hairline text-white/80 hover:text-white hover:bg-white/[0.04] transition"
                >
                  {m}
                </span>
              ))}
            </motion.div>
          </div>

          {/* 右侧：可视化卡片 */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative glass-strong rounded-3xl p-6 shadow-glass">
              <div className="flex items-center gap-3">
                <TeamFlag name="巴西" size="md" className="rounded-lg" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">巴西</div>
                  <div className="text-[10px] font-mono text-white/40">FIFA #3 · 小组赛 C</div>
                </div>
                <div className="text-white/30 text-sm font-mono">VS</div>
                <div className="flex-1 min-w-0 text-right">
                  <div className="text-sm font-semibold text-white truncate">摩洛哥</div>
                  <div className="text-[10px] font-mono text-white/40">FIFA #13 · 小组赛 C</div>
                </div>
                <TeamFlag name="摩洛哥" size="md" className="rounded-lg" />
              </div>

              <div className="mt-6 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-cyan-300">主胜</span>
                    <span className="text-white">61.4%</span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-700/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "61.4%" }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-violet-300">平局</span>
                    <span className="text-white">21.0%</span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-700/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "21%" }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-violet-400 to-violet-500"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-rose-300">客胜</span>
                    <span className="text-white">17.6%</span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-700/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "17.6%" }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-white/45">最可能比分</span>
                <span className="text-white font-semibold">2 - 0</span>
                <span className="text-emerald-300/90">置信度 14.2%</span>
              </div>
            </div>

            {/* 浮动小卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="absolute -bottom-5 -left-5 glass rounded-2xl px-4 py-3 shadow-glass hidden sm:block"
            >
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <Activity className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-white/60">xG</span>
                <span className="text-white font-semibold">2.31</span>
                <span className="text-white/30">·</span>
                <span className="text-white/60">xGA</span>
                <span className="text-white font-semibold">0.92</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -top-4 -right-3 glass rounded-2xl px-4 py-3 shadow-glass hidden sm:block"
            >
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <BarChart3 className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-white/60">全部模型</span>
                <span className="text-emerald-300/90">已就绪</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
