// D1 query functions - 替代 src/data.ts 的 mock
// 形状与 src/types.ts (== packages/website/lib/types.ts) 严格对齐
//
// 所有函数都接收 D1Database 作为第一个参数,
// 保持纯函数风格,方便在 index.ts 的 Hono handler 里 await 调用。

import type {
  Match, MatchDetailResponse, MatchListResponse, ModelResult,
  Player, PlayerRating, PredictionBundle, PredictionResponse, ScoreDistributionItem,
  Team, TeamDetailResponse, TeamListResponse, Tournament, KeyFactor, KeyPlayer,
} from "./types";

// ─── D1 row types (raw 形状,跟表 schema 一一对应) ───────────────────────
interface MatchRow {
  id: string; utc_date: string; status: string;
  home_team_id: string; away_team_id: string;
  home_team_name: string; away_team_name: string;
  stage: string | null; group: string | null; venue: string | null;
  winner: string | null; home_score: number | null; away_score: number | null;
}
interface PredStatsRow { match_id: string; total: number; ok: number }
interface PrimaryRow { match_id: string }
interface TeamFormRow {
  team_id: string; as_of: string;
  last5_w: number; last5_d: number; last5_l: number;
  goals_for_avg: number; goals_against_avg: number;
}
interface H2HRow { team_a_id: string; team_b_id: string; matches_json: string }
interface TeamSquadRow { team_id: string; as_of: string; squad_json: string }
interface SquadRatingRow {
  team_id: string; player_name: string; position: string;
  shirt_number: number | null;
  overall: number; passing: number; shooting: number;
  defense: number; pace: number; rationale: string; as_of: string;
}
interface PredictionRow {
  match_id: string; created_at: string;
  llm_provider: string; llm_model: string; prompt_hash: string | null;
  expected_goals_home: number | null; expected_goals_away: number | null;
  win_prob: number | null; draw_prob: number | null; loss_prob: number | null;
  score_distribution_json: string | null;
  key_factors_json: string | null;
  key_players_json: string | null;
  narrative: string | null;
  parse_failed: number;
}
interface PredictionModelRow {
  match_id: string; provider: string; model: string;
  created_at: string; updated_at: string; status: string;
  expected_goals_home: number | null; expected_goals_away: number | null;
  win_prob: number | null; draw_prob: number | null; loss_prob: number | null;
  score_distribution_json: string | null;
  key_factors_json: string | null;
  key_players_json: string | null;
  narrative: string | null;
  risk_factors_json: string | null;
  prompt_hash: string | null;
  parse_failed: number;
}

// ─── helpers ───────────────────────────────────────────────────────────
function safeArr<T>(s: string | null | undefined): T[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

function safeJson<T>(s: string | null | undefined): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

// 把 matches 行 + 预测统计 合并成 website 期望的 Match 形状
function enrichMatch(
  m: MatchRow,
  stats: Map<string, PredStatsRow>,
  primaries: Set<string>
): Match {
  const s = stats.get(m.id) ?? { match_id: m.id, total: 0, ok: 0 };
  const hasPrimary = primaries.has(m.id);
  return {
    id: m.id,
    utc_date: m.utc_date,
    status: m.status as Match["status"],
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
    home_team_name: m.home_team_name,
    away_team_name: m.away_team_name,
    stage: m.stage,
    group: m.group,
    venue: m.venue,
    home_score: m.home_score,
    away_score: m.away_score,
    has_prediction: hasPrimary,
    prediction_status: hasPrimary ? "all" : s.total > 0 ? "partial" : "none",
    prediction_models_total: s.total,
    prediction_models_ok: s.ok,
  };
}

function rowToPrimary(r: PredictionRow): PredictionResponse {
  return {
    match_id: r.match_id,
    expected_goals_home: r.expected_goals_home ?? 0,
    expected_goals_away: r.expected_goals_away ?? 0,
    win_prob: r.win_prob ?? 0,
    draw_prob: r.draw_prob ?? 0,
    loss_prob: r.loss_prob ?? 0,
    score_distribution: safeArr<ScoreDistributionItem>(r.score_distribution_json),
    key_factors: safeArr<KeyFactor>(r.key_factors_json as unknown as string | null),
    key_players: safeArr<KeyPlayer>(r.key_players_json as unknown as string | null),
    narrative: r.narrative ?? "",
    risk_factors: [],  // primary schema 没有 risk_factors 列
    degraded: false,
    parse_failed: !!r.parse_failed,
    llm_provider: r.llm_provider,
    llm_model: r.llm_model,
    created_at: r.created_at,
  };
}

function rowToModelResult(r: PredictionModelRow): ModelResult {
  return {
    provider: r.provider,
    model: r.model,
    status: r.status as "ok" | "failed",
    error: null,  // 同步时已剥离
    expected_goals_home: r.expected_goals_home,
    expected_goals_away: r.expected_goals_away,
    win_prob: r.win_prob,
    draw_prob: r.draw_prob,
    loss_prob: r.loss_prob,
    score_distribution: safeJson<ScoreDistributionItem[]>(r.score_distribution_json),
    key_factors: safeJson<KeyFactor[]>(r.key_factors_json as unknown as string | null),
    key_players: safeJson<KeyPlayer[]>(r.key_players_json as unknown as string | null),
    narrative: r.narrative,
    risk_factors: safeArr<string>(r.risk_factors_json as unknown as string | null),
    parse_failed: !!r.parse_failed,
    prompt_hash: r.prompt_hash,
    created_at: r.created_at,
    updated_at: r.updated_at,
    cached: false,
  };
}

// ─── public API ────────────────────────────────────────────────────────
export async function getTournament(db: D1Database): Promise<Tournament> {
  const counts = await db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('TIMED','SCHEDULED') THEN 1 ELSE 0 END) as upcoming,
      SUM(CASE WHEN status='FINISHED' THEN 1 ELSE 0 END) as finished
    FROM matches
  `).first<{ total: number; upcoming: number; finished: number }>();

  const sample = await db.prepare(
    "SELECT competition, season FROM matches LIMIT 1"
  ).first<{ competition: string; season: number }>();

  return {
    competition: sample?.competition ?? "WC",
    season: sample?.season ?? 2026,
    match_count: counts?.total ?? 0,
    upcoming_count: counts?.upcoming ?? 0,
    finished_count: counts?.finished ?? 0,
  };
}

export async function getMatches(
  db: D1Database,
  status?: string
): Promise<MatchListResponse> {
  // 一次性查所有 matches(最多 100 多行,无 IN 限制)
  const sql = status
    ? "SELECT * FROM matches WHERE status = ? ORDER BY utc_date"
    : "SELECT * FROM matches ORDER BY utc_date";
  const stmt = status ? db.prepare(sql).bind(status) : db.prepare(sql);
  const { results: rows } = await stmt.all<MatchRow>();
  if (rows.length === 0) return { matches: [], total: 0 };

  // 全表聚合(避免 IN 子句撞 D1 变量上限),然后 JS 端 join 到 matches
  const [statsRes, primRes] = await Promise.all([
    db.prepare(
      `SELECT match_id, COUNT(*) as total,
              SUM(CASE WHEN status='ok' THEN 1 ELSE 0 END) as ok
       FROM prediction_models GROUP BY match_id`
    ).all<PredStatsRow>(),
    db.prepare(`SELECT match_id FROM predictions`).all<PrimaryRow>(),
  ]);

  const statsMap = new Map(statsRes.results.map((s) => [s.match_id, s]));
  const primaries = new Set(primRes.results.map((p) => p.match_id));

  return {
    matches: rows.map((r) => enrichMatch(r, statsMap, primaries)),
    total: rows.length,
  };
}

export async function getMatchDetail(
  db: D1Database,
  id: string
): Promise<MatchDetailResponse | null> {
  const m = await db.prepare("SELECT * FROM matches WHERE id = ?")
    .bind(id).first<MatchRow>();
  if (!m) return null;

  const [homeForm, awayForm, h2h, homeSquad, awaySquad, homeRatings, awayRatings, pmStats, primRow] = await Promise.all([
    db.prepare("SELECT * FROM team_form WHERE team_id = ? ORDER BY as_of DESC LIMIT 1")
      .bind(m.home_team_id).first<TeamFormRow>(),
    db.prepare("SELECT * FROM team_form WHERE team_id = ? ORDER BY as_of DESC LIMIT 1")
      .bind(m.away_team_id).first<TeamFormRow>(),
    db.prepare("SELECT * FROM h2h WHERE team_a_id = ? AND team_b_id = ?")
      .bind(m.home_team_id, m.away_team_id).first<H2HRow>(),
    db.prepare("SELECT * FROM team_squad WHERE team_id = ? ORDER BY as_of DESC LIMIT 1")
      .bind(m.home_team_id).first<TeamSquadRow>(),
    db.prepare("SELECT * FROM team_squad WHERE team_id = ? ORDER BY as_of DESC LIMIT 1")
      .bind(m.away_team_id).first<TeamSquadRow>(),
    db.prepare("SELECT * FROM squad_ratings WHERE match_id = ? AND team_id = ?")
      .bind(id, m.home_team_id).all<SquadRatingRow>(),
    db.prepare("SELECT * FROM squad_ratings WHERE match_id = ? AND team_id = ?")
      .bind(id, m.away_team_id).all<SquadRatingRow>(),
    db.prepare("SELECT provider, status FROM prediction_models WHERE match_id = ?")
      .bind(id).all<{ provider: string; status: string }>(),
    db.prepare("SELECT match_id FROM predictions WHERE match_id = ?")
      .bind(id).first<PrimaryRow>(),
  ]);

  const statsMap = new Map<string, PredStatsRow>([[
    id,
    {
      match_id: id,
      total: pmStats.results.length,
      ok: pmStats.results.filter((s) => s.status === "ok").length,
    },
  ]]);
  const primaries = new Set(primRow ? [id] : []);

  return {
    match: enrichMatch(m, statsMap, primaries),
    home_form: (homeForm as unknown as Record<string, unknown>) ?? null,
    away_form: (awayForm as unknown as Record<string, unknown>) ?? null,
    h2h: h2h ? safeArr<Record<string, unknown>>(h2h.matches_json) : [],
    home_squad: getPlayersByTeamName(m.home_team_name),
    away_squad: getPlayersByTeamName(m.away_team_name),
    home_ratings: (homeRatings.results as PlayerRating[]),
    away_ratings: (awayRatings.results as PlayerRating[]),
    prediction_status: Object.fromEntries(pmStats.results.map((s) => [s.provider, s.status])),
  };
}

export async function getPredictionBundle(
  db: D1Database,
  matchId: string
): Promise<PredictionBundle | null> {
  // 比赛必须存在
  const m = await db.prepare("SELECT id FROM matches WHERE id = ?")
    .bind(matchId).first();
  if (!m) return null;

  const [primary, models] = await Promise.all([
    db.prepare("SELECT * FROM predictions WHERE match_id = ?")
      .bind(matchId).first<PredictionRow>(),
    db.prepare("SELECT * FROM prediction_models WHERE match_id = ? ORDER BY created_at")
      .bind(matchId).all<PredictionModelRow>(),
  ]);

  if (!primary && models.results.length === 0) return null;

  // If no primary prediction, use the first successful model as fallback
  let primaryResponse = primary ? rowToPrimary(primary) : null;
  if (!primaryResponse && models.results.length > 0) {
    const firstOk = models.results.find((r) => r.status === "ok");
    if (firstOk) {
      primaryResponse = {
        match_id: firstOk.match_id,
        expected_goals_home: firstOk.expected_goals_home ?? 0,
        expected_goals_away: firstOk.expected_goals_away ?? 0,
        win_prob: firstOk.win_prob ?? 0,
        draw_prob: firstOk.draw_prob ?? 0,
        loss_prob: firstOk.loss_prob ?? 0,
        score_distribution: safeJson<ScoreDistributionItem[]>(firstOk.score_distribution_json) ?? [],
        key_factors: safeJson<KeyFactor[]>(firstOk.key_factors_json as unknown as string | null) ?? [],
        key_players: safeJson<KeyPlayer[]>(firstOk.key_players_json as unknown as string | null) ?? [],
        narrative: firstOk.narrative ?? "",
        risk_factors: safeArr<string>(firstOk.risk_factors_json as unknown as string | null),
        degraded: false,
        parse_failed: !!firstOk.parse_failed,
        llm_provider: firstOk.provider,
        llm_model: firstOk.model,
        created_at: firstOk.created_at,
      };
    }
  }

  return {
    primary: primaryResponse,
    models: models.results.map(rowToModelResult),
  };
}

// ─── Players (from JSON files) ─────────────────────────────────
// 球员数据存储在 JSON 文件中，通过静态导入读取
import worldcupPlayers from "./data/world-cup-players.json";
import worldcupTeams from "./data/world-cup-teams.json";

// 计算队伍总身价
function calculateTeamTotalMarketValue(slug: string): { value: number; display: string } {
  const playersData = worldcupPlayers as Record<string, { players: Array<{ marketValue: { valueM: number } | null }> }>;
  const teamPlayers = playersData[slug]?.players ?? [];
  const totalValue = teamPlayers.reduce((sum, p) => sum + (p.marketValue?.valueM ?? 0), 0);

  // 统一格式：€XXXm
  return { value: totalValue, display: `€${totalValue.toFixed(1)}m` };
}

export async function getTeams(): Promise<TeamListResponse> {
  const teamsData = worldcupTeams as { teams: Array<{ id: string; name: string; shortName: string; abbreviation: string; logo: string; slug: string; color: string }> };
  const teams: Team[] = teamsData.teams.map((t) => {
    const totalMarketValue = calculateTeamTotalMarketValue(t.slug);
    return {
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      abbreviation: t.abbreviation,
      logo: t.logo,
      slug: t.slug,
      color: t.color,
      totalMarketValue: totalMarketValue.value,
      totalMarketValueDisplay: totalMarketValue.display,
    };
  });
  return { teams, total: teams.length };
}

export async function getTeamDetail(slug: string): Promise<TeamDetailResponse | null> {
  const teamsData = worldcupTeams as { teams: Array<{ id: string; name: string; shortName: string; abbreviation: string; logo: string; slug: string; color: string }> };
  const teamData = teamsData.teams.find((t) => t.slug === slug);
  if (!teamData) return null;

  const totalMarketValue = calculateTeamTotalMarketValue(slug);
  const team: Team = {
    id: teamData.id,
    name: teamData.name,
    shortName: teamData.shortName,
    abbreviation: teamData.abbreviation,
    logo: teamData.logo,
    slug: teamData.slug,
    color: teamData.color,
    totalMarketValue: totalMarketValue.value,
    totalMarketValueDisplay: totalMarketValue.display,
  };

  // 获取该队球员
  const playersData = worldcupPlayers as Record<string, { players: Array<{ id: string; fullName: string; position: string; image: string | null; age: number; citizenship: string; teamId: string; teamName: string; marketValue: { valueM: number; display: string } | null }> }>;
  const teamPlayers = playersData[slug]?.players ?? [];
  const players: Player[] = teamPlayers.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    position: p.position as Player["position"],
    image: p.image,
    age: p.age,
    citizenship: p.citizenship,
    teamId: p.teamId,
    teamName: p.teamName,
    marketValue: p.marketValue,
  }));

  return { team, players };
}

export async function getTeamPlayers(slug: string): Promise<Player[]> {
  const playersData = worldcupPlayers as Record<string, { players: Array<{ id: string; fullName: string; position: string; image: string | null; age: number; citizenship: string; teamId: string; teamName: string; marketValue: { valueM: number; display: string } | null }> }>;
  const teamPlayers = playersData[slug]?.players ?? [];
  return teamPlayers.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    position: p.position as Player["position"],
    image: p.image,
    age: p.age,
    citizenship: p.citizenship,
    teamId: p.teamId,
    teamName: p.teamName,
    marketValue: p.marketValue,
  }));
}

// 根据 teamId 从 teams JSON 中查找 slug
function getSlugByTeamId(teamId: string): string | null {
  const teamsData = worldcupTeams as { teams: Array<{ id: string; slug: string }> };
  const team = teamsData.teams.find((t) => t.id === teamId);
  return team?.slug ?? null;
}

// 根据 team name 从 teams JSON 中查找 slug
function getSlugByTeamName(teamName: string): string | null {
  const teamsData = worldcupTeams as { teams: Array<{ name: string; slug: string }> };
  const team = teamsData.teams.find((t) => t.name === teamName);
  return team?.slug ?? null;
}

// 根据 team name 获取球员列表
function getPlayersByTeamName(teamName: string): Player[] {
  const slug = getSlugByTeamName(teamName);
  if (!slug) return [];

  const playersData = worldcupPlayers as Record<string, { players: Array<{ id: string; fullName: string; position: string; image: string | null; age: number; citizenship: string; teamId: string; teamName: string; marketValue: { valueM: number; display: string } | null }> }>;
  const teamPlayers = playersData[slug]?.players ?? [];
  return teamPlayers.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    position: p.position as Player["position"],
    image: p.image,
    age: p.age,
    citizenship: p.citizenship,
    teamId: p.teamId,
    teamName: p.teamName,
    marketValue: p.marketValue,
  }));
}
