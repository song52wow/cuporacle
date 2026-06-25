"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { resolveTeamKey } from "@/lib/teams";

// 中文 / 英文球队名 → ISO 3166-1 alpha-2
// 覆盖 2026 世界杯 48 强 + 备用（兼容中英文输入）
const TEAM_ISO: Record<string, string> = {
  // CONCACAF（3 个东道主 + 3 队）
  墨西哥: "mx",
  Mexico: "mx",
  美国: "us",
  "United States": "us",
  USA: "us",
  加拿大: "ca",
  Canada: "ca",
  巴拿马: "pa",
  Panama: "pa",
  海地: "ht",
  Haiti: "ht",
  库拉索: "cw",
  "Curaçao": "cw",
  Curacao: "cw",
  // CONMEBOL（6 队）
  巴西: "br",
  Brazil: "br",
  阿根廷: "ar",
  Argentina: "ar",
  乌拉圭: "uy",
  Uruguay: "uy",
  哥伦比亚: "co",
  Colombia: "co",
  厄瓜多尔: "ec",
  Ecuador: "ec",
  巴拉圭: "py",
  Paraguay: "py",
  // UEFA（16 队）—— 英/苏/威旗cdn不支持，下沉到 emoji
  英格兰: "gb-eng",
  England: "gb-eng",
  苏格兰: "gb-sct",
  Scotland: "gb-sct",
  威尔士: "gb-wls",
  Wales: "gb-wls",
  德国: "de",
  Germany: "de",
  西班牙: "es",
  Spain: "es",
  法国: "fr",
  France: "fr",
  葡萄牙: "pt",
  Portugal: "pt",
  荷兰: "nl",
  Netherlands: "nl",
  比利时: "be",
  Belgium: "be",
  意大利: "it",
  Italy: "it",
  克罗地亚: "hr",
  Croatia: "hr",
  瑞士: "ch",
  Switzerland: "ch",
  奥地利: "at",
  Austria: "at",
  丹麦: "dk",
  Denmark: "dk",
  瑞典: "se",
  Sweden: "se",
  挪威: "no",
  Norway: "no",
  波兰: "pl",
  Poland: "pl",
  乌克兰: "ua",
  Ukraine: "ua",
  土耳其: "tr",
  Turkey: "tr",
  捷克: "cz",
  "Czech Republic": "cz",
  Czechia: "cz",
  // AFC（8 队）
  日本: "jp",
  Japan: "jp",
  韩国: "kr",
  "South Korea": "kr",
  "Korea Republic": "kr",
  伊朗: "ir",
  Iran: "ir",
  澳大利亚: "au",
  Australia: "au",
  卡塔尔: "qa",
  Qatar: "qa",
  沙特: "sa",
  "Saudi Arabia": "sa",
  阿联酋: "ae",
  "United Arab Emirates": "ae",
  UAE: "ae",
  伊拉克: "iq",
  Iraq: "iq",
  约旦: "jo",
  Jordan: "jo",
  乌兹别克斯坦: "uz",
  Uzbekistan: "uz",
  // CAF（9 队）
  摩洛哥: "ma",
  Morocco: "ma",
  塞内加尔: "sn",
  Senegal: "sn",
  突尼斯: "tn",
  Tunisia: "tn",
  埃及: "eg",
  Egypt: "eg",
  加纳: "gh",
  Ghana: "gh",
  尼日利亚: "ng",
  Nigeria: "ng",
  喀麦隆: "cm",
  Cameroon: "cm",
  科特迪瓦: "ci",
  "Côte d'Ivoire": "ci",
  "Ivory Coast": "ci",
  阿尔及利亚: "dz",
  Algeria: "dz",
  佛得角: "cv",
  "Cape Verde": "cv",
  南非: "za",
  "South Africa": "za",
  // OFC（1 队）
  新西兰: "nz",
  "New Zealand": "nz",
};

// 英/苏/威分区旗：flagcdn 不支持 ISO 子代码，改用 emoji
const SUBDIVISION_FLAG: Record<string, string> = {
  英格兰: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  苏格兰: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  威尔士: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

// 预设尺寸（响应式断点：base 是手机，sm 是 ≥640px）
const SIZE_CLASSES: Record<string, string> = {
  sm: "w-8 h-8 sm:w-9 sm:h-9",
  md: "w-9 h-9 sm:w-10 sm:h-10",
  lg: "w-11 h-11 sm:w-12 sm:h-12",
  xl: "w-12 h-12 sm:w-14 sm:h-14",
};

// 淘汰赛占位符：A1 / B2 / 1A / 2B / TBD
const PLACEHOLDER_RE = /^[A-Z]\d+$|^\d[A-Z]$|^TBD$/;

interface TeamFlagProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function TeamFlag({ name, size = "md", className }: TeamFlagProps) {
  const t = useTranslations("common");
  const [imgFailed, setImgFailed] = useState(false);
  const safeName = name?.trim() ?? "";
  const isPlaceholder = !safeName || PLACEHOLDER_RE.test(safeName);

  // 1. 淘汰赛占位符：A1 / B2 / 1A / 2B / TBD / 空字符串 —— 显示虚线框 + 文本
  if (isPlaceholder) {
    const label = safeName || "TBD";
    return (
      <span
        className={cn(
          "inline-grid place-items-center rounded-md bg-white/[0.03] border border-dashed border-white/15 select-none",
          SIZE_CLASSES[size],
          className
        )}
        aria-label={`${t("tbd")} ${label}`}
        title={`${t("tbd")} ${label}`}
      >
        <span className="font-mono text-[10px] sm:text-xs tracking-wider text-white/45">
          {label}
        </span>
      </span>
    );
  }

  const key = resolveTeamKey(safeName);
  const iso = TEAM_ISO[safeName] ?? (key ? TEAM_ISO[key] : undefined);
  // 2. emoji 兜底：未收录球队 / 分区旗 / CDN 加载失败
  const useEmoji = !iso || SUBDIVISION_FLAG[safeName] !== undefined || imgFailed;

  if (useEmoji) {
    const emoji = SUBDIVISION_FLAG[safeName] ?? "🏳️";
    return (
      <span
        className={cn(
          "inline-grid place-items-center rounded-md bg-white/[0.04] border border-white/10 select-none",
          SIZE_CLASSES[size],
          className
        )}
        aria-label={safeName}
        title={safeName}
      >
        <span className="leading-none">{emoji}</span>
      </span>
    );
  }

  // 3. 主路径：flagcdn.com SVG（unoptimized —— SVG 自身已优化）
  return (
    <span
      className={cn(
        "relative inline-grid place-items-center rounded-md bg-white/[0.04] border border-white/10 select-none overflow-hidden",
        SIZE_CLASSES[size],
        className
      )}
      aria-label={safeName}
      title={safeName}
    >
      <Image
        src={`https://flagcdn.com/${iso}.svg`}
        alt={safeName}
        fill
        sizes="40px"
        className="object-cover"
        loading="lazy"
        onError={() => setImgFailed(true)}
        unoptimized
      />
    </span>
  );
}