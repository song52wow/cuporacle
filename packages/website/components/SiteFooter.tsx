import Link from "next/link";
import { Logo } from "./Logo";
import { Github } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-white/5">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 text-sm text-white/55 max-w-md">
            CupOracle 是一款基于多模型大语言模型的世界杯赛事预测平台，
            通过汇总多家主流 LLM 的判断，为球迷提供概率化的胜负与比分参考。
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold tracking-widest text-white/50 uppercase">
            平台
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/" className="text-white/70 hover:text-white">首页</Link></li>
            <li><Link href="/matches" className="text-white/70 hover:text-white">全部赛事</Link></li>
            <li><Link href="/matches?status=TIMED" className="text-white/70 hover:text-white">未开赛</Link></li>
            <li><Link href="/matches?status=FINISHED" className="text-white/70 hover:text-white">已结束</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold tracking-widest text-white/50 uppercase">
            资源
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href="https://github.com"
                className="text-white/70 hover:text-white inline-flex items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5" /> 源码
              </a>
            </li>
            <li className="text-white/40">方法论 · 即将推出</li>
            <li className="text-white/40">准确度报告 · 即将推出</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40 font-mono">
            © 2026 CupOracle · 预测仅供研究与娱乐参考，不构成任何投注建议。
          </p>
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase font-mono">
            Power by Multi-LLM
          </p>
        </div>
      </div>
    </footer>
  );
}
