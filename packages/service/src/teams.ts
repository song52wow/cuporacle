// 2026 世界杯 48 支参赛队伍
// 数据来源：world-cup-teams.json

import teamsData from "./data/world-cup-teams.json";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logo: string;
  image: string;
  slug: string;
  color: string;
  teamPhoto: string;
}

// 从 JSON 文件导入的原始数据
export const TEAMS_DATA = teamsData;

// 去重后的唯一队伍列表（48 队）
export const UNIQUE_TEAMS: Team[] = teamsData.teams.map((t) => ({
  id: t.id,
  name: t.name,
  shortName: t.shortName,
  abbreviation: t.abbreviation,
  logo: t.logo,
  image: t.image,
  slug: t.slug,
  color: t.color,
  teamPhoto: t.teamPhoto,
}));

// 根据 abbreviation 获取队伍（如 "BRA" -> Brazil）
export function getTeamByAbbreviation(abbreviation: string): Team | undefined {
  return UNIQUE_TEAMS.find((t) => t.abbreviation === abbreviation);
}

// 根据 slug 获取队伍（如 "bra" -> Brazil）
export function getTeamBySlug(slug: string): Team | undefined {
  return UNIQUE_TEAMS.find((t) => t.slug === slug);
}

// 根据 ID 获取队伍
export function getTeamById(id: string): Team | undefined {
  return UNIQUE_TEAMS.find((t) => t.id === id);
}

// 根据名称获取队伍（支持中英文）
export function getTeamByName(name: string): Team | undefined {
  return UNIQUE_TEAMS.find(
    (t) => t.name === name || t.shortName === name
  );
}
