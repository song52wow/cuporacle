import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatGoals(n: number, digits = 2) {
  return n.toFixed(digits);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function relativeTime(iso: string) {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const future = diff > 0;
  let value: string;
  if (abs < hour) value = `${Math.round(abs / minute)} 分钟`;
  else if (abs < day) value = `${Math.round(abs / hour)} 小时`;
  else value = `${Math.round(abs / day)} 天`;
  return future ? `${value}后` : `${value}前`;
}

export function topScore(distribution: { home: number; away: number; p: number }[]) {
  if (!distribution?.length) return null;
  return [...distribution].sort((a, b) => b.p - a.p)[0];
}
