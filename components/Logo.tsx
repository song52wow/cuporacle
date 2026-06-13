import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative w-8 h-8 grid place-items-center">
        <div className="absolute inset-0 rounded-md bg-cyan-violet shadow-neon" />
        <div className="absolute inset-[2px] rounded-[5px] bg-ink-900 grid place-items-center">
          <span className="text-base font-bold text-gradient-cyan-violet">⚽</span>
        </div>
      </div>
      <div className="leading-none">
        <div className="text-[15px] font-semibold tracking-tight text-white">
          CupOracle
        </div>
        <div className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          WC · 2026
        </div>
      </div>
    </div>
  );
}
