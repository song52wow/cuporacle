import type { Locale } from "@/i18n/routing";

/** Canonical English team name (matches API / FIFA data) */
export type TeamKey =
  | "Algeria"
  | "Argentina"
  | "Australia"
  | "Austria"
  | "Belgium"
  | "Bosnia-Herzegovina"
  | "Brazil"
  | "Canada"
  | "Cape Verde"
  | "Colombia"
  | "Congo DR"
  | "Croatia"
  | "Curaçao"
  | "Czechia"
  | "Ecuador"
  | "Egypt"
  | "England"
  | "France"
  | "Germany"
  | "Ghana"
  | "Haiti"
  | "Iran"
  | "Iraq"
  | "Ivory Coast"
  | "Japan"
  | "Jordan"
  | "Mexico"
  | "Morocco"
  | "Netherlands"
  | "New Zealand"
  | "Norway"
  | "Panama"
  | "Paraguay"
  | "Portugal"
  | "Qatar"
  | "Saudi Arabia"
  | "Scotland"
  | "Senegal"
  | "South Africa"
  | "South Korea"
  | "Spain"
  | "Sweden"
  | "Switzerland"
  | "Tunisia"
  | "Türkiye"
  | "United States"
  | "Uruguay"
  | "Uzbekistan";

const TEAM_NAMES: Record<TeamKey, { zh: string; en: string }> = {
  Algeria: { zh: "阿尔及利亚", en: "Algeria" },
  Argentina: { zh: "阿根廷", en: "Argentina" },
  Australia: { zh: "澳大利亚", en: "Australia" },
  Austria: { zh: "奥地利", en: "Austria" },
  Belgium: { zh: "比利时", en: "Belgium" },
  "Bosnia-Herzegovina": { zh: "波黑", en: "Bosnia-Herzegovina" },
  Brazil: { zh: "巴西", en: "Brazil" },
  Canada: { zh: "加拿大", en: "Canada" },
  "Cape Verde": { zh: "佛得角", en: "Cape Verde" },
  Colombia: { zh: "哥伦比亚", en: "Colombia" },
  "Congo DR": { zh: "刚果（金）", en: "Congo DR" },
  Croatia: { zh: "克罗地亚", en: "Croatia" },
  Curaçao: { zh: "库拉索", en: "Curaçao" },
  Czechia: { zh: "捷克", en: "Czechia" },
  Ecuador: { zh: "厄瓜多尔", en: "Ecuador" },
  Egypt: { zh: "埃及", en: "Egypt" },
  England: { zh: "英格兰", en: "England" },
  France: { zh: "法国", en: "France" },
  Germany: { zh: "德国", en: "Germany" },
  Ghana: { zh: "加纳", en: "Ghana" },
  Haiti: { zh: "海地", en: "Haiti" },
  Iran: { zh: "伊朗", en: "Iran" },
  Iraq: { zh: "伊拉克", en: "Iraq" },
  "Ivory Coast": { zh: "科特迪瓦", en: "Ivory Coast" },
  Japan: { zh: "日本", en: "Japan" },
  Jordan: { zh: "约旦", en: "Jordan" },
  Mexico: { zh: "墨西哥", en: "Mexico" },
  Morocco: { zh: "摩洛哥", en: "Morocco" },
  Netherlands: { zh: "荷兰", en: "Netherlands" },
  "New Zealand": { zh: "新西兰", en: "New Zealand" },
  Norway: { zh: "挪威", en: "Norway" },
  Panama: { zh: "巴拿马", en: "Panama" },
  Paraguay: { zh: "巴拉圭", en: "Paraguay" },
  Portugal: { zh: "葡萄牙", en: "Portugal" },
  Qatar: { zh: "卡塔尔", en: "Qatar" },
  "Saudi Arabia": { zh: "沙特阿拉伯", en: "Saudi Arabia" },
  Scotland: { zh: "苏格兰", en: "Scotland" },
  Senegal: { zh: "塞内加尔", en: "Senegal" },
  "South Africa": { zh: "南非", en: "South Africa" },
  "South Korea": { zh: "韩国", en: "South Korea" },
  Spain: { zh: "西班牙", en: "Spain" },
  Sweden: { zh: "瑞典", en: "Sweden" },
  Switzerland: { zh: "瑞士", en: "Switzerland" },
  Tunisia: { zh: "突尼斯", en: "Tunisia" },
  Türkiye: { zh: "土耳其", en: "Türkiye" },
  "United States": { zh: "美国", en: "United States" },
  Uruguay: { zh: "乌拉圭", en: "Uruguay" },
  Uzbekistan: { zh: "乌兹别克斯坦", en: "Uzbekistan" },
};

/** Any known alias (EN / ZH / abbrev) → canonical key */
const ALIASES: Record<string, TeamKey> = {
  algeria: "Algeria",
  阿尔及利亚: "Algeria",
  argentina: "Argentina",
  阿根廷: "Argentina",
  australia: "Australia",
  澳大利亚: "Australia",
  austria: "Austria",
  奥地利: "Austria",
  belgium: "Belgium",
  比利时: "Belgium",
  "bosnia-herzegovina": "Bosnia-Herzegovina",
  波黑: "Bosnia-Herzegovina",
  brazil: "Brazil",
  巴西: "Brazil",
  canada: "Canada",
  加拿大: "Canada",
  "cape verde": "Cape Verde",
  "cape verde islands": "Cape Verde",
  佛得角: "Cape Verde",
  colombia: "Colombia",
  哥伦比亚: "Colombia",
  "congo dr": "Congo DR",
  刚果金: "Congo DR",
  "刚果（金）": "Congo DR",
  croatia: "Croatia",
  克罗地亚: "Croatia",
  curaçao: "Curaçao",
  curacao: "Curaçao",
  库拉索: "Curaçao",
  czechia: "Czechia",
  "czech republic": "Czechia",
  捷克: "Czechia",
  ecuador: "Ecuador",
  厄瓜多尔: "Ecuador",
  egypt: "Egypt",
  埃及: "Egypt",
  england: "England",
  英格兰: "England",
  france: "France",
  法国: "France",
  germany: "Germany",
  德国: "Germany",
  ghana: "Ghana",
  加纳: "Ghana",
  haiti: "Haiti",
  海地: "Haiti",
  iran: "Iran",
  伊朗: "Iran",
  iraq: "Iraq",
  伊拉克: "Iraq",
  "ivory coast": "Ivory Coast",
  "côte d'ivoire": "Ivory Coast",
  "cote d'ivoire": "Ivory Coast",
  科特迪瓦: "Ivory Coast",
  japan: "Japan",
  日本: "Japan",
  jordan: "Jordan",
  约旦: "Jordan",
  mexico: "Mexico",
  墨西哥: "Mexico",
  morocco: "Morocco",
  摩洛哥: "Morocco",
  netherlands: "Netherlands",
  荷兰: "Netherlands",
  "new zealand": "New Zealand",
  新西兰: "New Zealand",
  norway: "Norway",
  挪威: "Norway",
  panama: "Panama",
  巴拿马: "Panama",
  paraguay: "Paraguay",
  巴拉圭: "Paraguay",
  portugal: "Portugal",
  葡萄牙: "Portugal",
  qatar: "Qatar",
  卡塔尔: "Qatar",
  "saudi arabia": "Saudi Arabia",
  沙特: "Saudi Arabia",
  沙特阿拉伯: "Saudi Arabia",
  scotland: "Scotland",
  苏格兰: "Scotland",
  senegal: "Senegal",
  塞内加尔: "Senegal",
  "south africa": "South Africa",
  南非: "South Africa",
  "south korea": "South Korea",
  "korea republic": "South Korea",
  韩国: "South Korea",
  spain: "Spain",
  西班牙: "Spain",
  sweden: "Sweden",
  瑞典: "Sweden",
  switzerland: "Switzerland",
  瑞士: "Switzerland",
  tunisia: "Tunisia",
  突尼斯: "Tunisia",
  turkey: "Türkiye",
  türkiye: "Türkiye",
  土耳其: "Türkiye",
  "united states": "United States",
  usa: "United States",
  美国: "United States",
  uruguay: "Uruguay",
  乌拉圭: "Uruguay",
  uzbekistan: "Uzbekistan",
  乌兹别克斯坦: "Uzbekistan",
};

export function resolveTeamKey(name: string): TeamKey | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  if (trimmed in TEAM_NAMES) return trimmed as TeamKey;
  return ALIASES[trimmed.toLowerCase()] ?? ALIASES[trimmed] ?? null;
}

export function getTeamName(name: string, locale: Locale): string {
  const key = resolveTeamKey(name);
  if (!key) return name;
  return TEAM_NAMES[key][locale];
}

export function teamMatchesQuery(name: string, query: string, locale: Locale): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const localized = getTeamName(name, locale).toLowerCase();
  return (
    name.toLowerCase().includes(q) ||
    localized.includes(q) ||
    (resolveTeamKey(name)?.toLowerCase().includes(q) ?? false)
  );
}
