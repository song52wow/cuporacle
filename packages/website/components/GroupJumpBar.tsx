"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatGroupLabel } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type GroupJumpStatus = "decided" | "in_progress" | "not_started";

export interface GroupJumpItem {
  id: string;
  status: GroupJumpStatus;
}

interface Props {
  groups: GroupJumpItem[];
  className?: string;
}

export function GroupJumpBar({ groups, className }: Props) {
  const t = useTranslations("qualification");
  const [activeId, setActiveId] = useState<string | null>(groups[0]?.id ?? null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const targets = groups
      .map((g) => document.getElementById(`group-${g.id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.id.replace(/^group-/, "");
          setActiveId(id);
        }
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    targets.forEach((el) => observer.observe(el));
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [groups]);

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#group-${id}`);
      }
    }
  }

  function statusStyle(status: GroupJumpStatus): string {
    if (status === "decided") {
      return "border-white/15 text-white/65 hover:text-white";
    }
    if (status === "in_progress") {
      return "border-cyan-400/40 text-cyan-300 hover:text-cyan-200";
    }
    return "border-white/10 text-white/40 hover:text-white/70";
  }

  return (
    <div
      className={cn(
        "sticky top-16 z-20 -mx-4 sm:mx-0 px-4 sm:px-0",
        "bg-[#050816]/85 backdrop-blur supports-[backdrop-filter]:bg-[#050816]/65",
        "border-y border-white/[0.06] py-3",
        className
      )}
    >
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width]:none">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => handleClick(g.id)}
              className={cn(
                "shrink-0 w-10 h-10 rounded-lg border text-sm font-mono font-semibold transition-all",
                statusStyle(g.status),
                activeId === g.id &&
                  "bg-gradient-to-br from-cyan-400/20 to-violet-400/20 ring-1 ring-cyan-400/60 text-white"
              )}
              aria-label={`${formatGroupLabel(g.id)}${t("groupSuffix")}`}
              aria-current={activeId === g.id ? "true" : undefined}
            >
              {formatGroupLabel(g.id)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}