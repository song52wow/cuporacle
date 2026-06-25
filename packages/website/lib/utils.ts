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

export function dateLocale(locale: string) {
  return locale === "en" ? "en-US" : "zh-CN";
}

export function formatDate(iso: string, locale = "zh") {
  const d = new Date(iso);
  return d.toLocaleString(dateLocale(locale), {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateTime(iso: string, locale = "zh") {
  return new Date(iso).toLocaleString(dateLocale(locale));
}

export function relativeTime(iso: string, locale = "zh") {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const future = diff > 0;
  const en = locale === "en";
  let value: string;
  if (abs < hour) {
    const n = Math.round(abs / minute);
    value = en ? `${n} min` : `${n} 分钟`;
  } else if (abs < day) {
    const n = Math.round(abs / hour);
    value = en ? `${n} hr` : `${n} 小时`;
  } else {
    const n = Math.round(abs / day);
    value = en ? `${n} d` : `${n} 天`;
  }
  if (en) return future ? `in ${value}` : `${value} ago`;
  return future ? `${value}后` : `${value}前`;
}

export function topScore(distribution: { home: number; away: number; p: number }[]) {
  if (!distribution?.length) return null;
  return [...distribution].sort((a, b) => b.p - a.p)[0];
}

/** GROUP_A / A → 展示用组名 */
export function formatGroupLabel(group: string | null | undefined): string {
  if (!group) return "";
  const m = group.match(/^GROUP_([A-Z])$/i);
  if (m) return m[1]!.toUpperCase();
  return group.replace(/^GROUP_/i, "").toUpperCase() || group;
}
