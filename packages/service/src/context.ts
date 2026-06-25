// 从 D1 数据重建指定模型的 LLM 输入上下文

import type { KeyFactor, ModelContextResponse } from "./types";
import {
  buildLeaderUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  hashPrompt,
} from "./prompts";

interface MatchRow {
  id: string;
  utc_date: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  stage: string | null;
  group: string | null;
  venue: string | null;
}

interface TeamFormRow {
  last5_w: number;
  last5_d: number;
  last5_l: number;
  goals_for_avg: number;
  goals_against_avg: number;
}

interface TeamSquadRow {
  squad_json: string;
}

interface GroupStandingRow {
  team_id: string;
  team_name: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  qualification_status: string | null;
  qualification_note: string | null;
}

const QUALIFICATION_STATUS_ZH: Record<string, string> = {
  qualified: "已出线",
  pending: "待出线",
  eliminated: "已无缘出线",
};

function qualificationStatusZh(status: string | null | undefined): string {
  if (!status) return "";
  return QUALIFICATION_STATUS_ZH[status] ?? status;
}

function formatStandingsForPrompt(rows: GroupStandingRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    position: r.position,
    team_name: r.team_name,
    played: r.played,
    won: r.won,
    drawn: r.drawn,
    lost: r.lost,
    goals_for: r.goals_for,
    goals_against: r.goals_against,
    goal_diff: r.goal_diff,
    points: r.points,
    qualification_status: r.qualification_status,
    qualification_status_zh: qualificationStatusZh(r.qualification_status),
    qualification_note: r.qualification_note,
  }));
}

function teamQualificationSnapshot(
  rows: GroupStandingRow[],
  teamId: string
): Record<string, unknown> | null {
  const r = rows.find((row) => row.team_id === teamId);
  if (!r) return null;
  return {
    position: r.position,
    points: r.points,
    goal_diff: r.goal_diff,
    qualification_status: r.qualification_status,
    qualification_status_zh: qualificationStatusZh(r.qualification_status),
    qualification_note: r.qualification_note,
  };
}

async function fetchGroupStandingsContext(
  db: D1Database,
  group: string
): Promise<Record<string, unknown>> {
  const { results: rows } = await db
    .prepare(
      `SELECT team_id, team_name, position,
              played, won, drawn, lost,
              goals_for, goals_against, goal_diff, points,
              qualification_status, qualification_note
       FROM group_standings
       WHERE "group" = ?
       ORDER BY position`
    )
    .bind(group)
    .all<GroupStandingRow>();

  if (!rows.length) return {};

  return {
    group_standings: formatStandingsForPrompt(rows),
    _raw_standings: rows,
  };
}

interface PredictionModelRow {
  provider: string;
  model: string;
  status: string;
  expected_goals_home: number | null;
  expected_goals_away: number | null;
  win_prob: number | null;
  draw_prob: number | null;
  loss_prob: number | null;
  key_factors_json: string | null;
  narrative: string | null;
  risk_factors_json: string | null;
  prompt_hash: string | null;
}

function safeArr<T>(s: string | null | undefined): T[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

function formToDict(f: TeamFormRow | null): Record<string, unknown> {
  if (!f) return { available: false };
  return {
    available: true,
    last5: `${f.last5_w}W-${f.last5_d}D-${f.last5_l}L`,
    goals_for_avg: f.goals_for_avg,
    goals_against_avg: f.goals_against_avg,
  };
}

function squadToList(squadJson: string | null | undefined): Record<string, unknown>[] {
  if (!squadJson) return [];
  try {
    const raw = JSON.parse(squadJson) as Record<string, unknown>[];
    if (!Array.isArray(raw)) return [];
    return raw.map((p) => ({
      name: p.name,
      position: p.position ?? "Unknown",
      shirt_number: p.shirt_number ?? null,
      nationality: p.nationality ?? null,
    }));
  } catch {
    return [];
  }
}

async function buildUserData(
  db: D1Database,
  m: MatchRow
): Promise<Record<string, unknown>> {
  const [homeForm, awayForm, h2h, homeSquad, awaySquad] = await Promise.all([
    db.prepare("SELECT * FROM team_form WHERE team_id = ? ORDER BY as_of DESC LIMIT 1")
      .bind(m.home_team_id).first<TeamFormRow>(),
    db.prepare("SELECT * FROM team_form WHERE team_id = ? ORDER BY as_of DESC LIMIT 1")
      .bind(m.away_team_id).first<TeamFormRow>(),
    db.prepare("SELECT matches_json FROM h2h WHERE team_a_id = ? AND team_b_id = ?")
      .bind(m.home_team_id, m.away_team_id).first<{ matches_json: string }>(),
    db.prepare("SELECT squad_json FROM team_squad WHERE team_id = ? ORDER BY as_of DESC LIMIT 1")
      .bind(m.home_team_id).first<TeamSquadRow>(),
    db.prepare("SELECT squad_json FROM team_squad WHERE team_id = ? ORDER BY as_of DESC LIMIT 1")
      .bind(m.away_team_id).first<TeamSquadRow>(),
  ]);

  const data: Record<string, unknown> = {
    match: {
      id: m.id,
      stage: m.stage,
      group: m.group,
      venue: m.venue,
      utc_date: m.utc_date,
    },
    home_team: { id: m.home_team_id, name: m.home_team_name },
    away_team: { id: m.away_team_id, name: m.away_team_name },
    home_form: formToDict(homeForm),
    away_form: formToDict(awayForm),
    h2h: safeArr<Record<string, unknown>>(h2h?.matches_json),
    home_squad: squadToList(homeSquad?.squad_json),
    away_squad: squadToList(awaySquad?.squad_json),
  };

  if (m.group) {
    const groupCtx = await fetchGroupStandingsContext(db, m.group);
    const raw = groupCtx._raw_standings as GroupStandingRow[] | undefined;
    delete groupCtx._raw_standings;
    Object.assign(data, groupCtx);
    if (raw?.length) {
      const homeQ = teamQualificationSnapshot(raw, m.home_team_id);
      const awayQ = teamQualificationSnapshot(raw, m.away_team_id);
      if (homeQ) data.home_team_qualification = homeQ;
      if (awayQ) data.away_team_qualification = awayQ;
    }
  }

  return data;
}

export async function getModelContext(
  db: D1Database,
  matchId: string,
  provider: string
): Promise<ModelContextResponse | null> {
  const m = await db.prepare("SELECT * FROM matches WHERE id = ?")
    .bind(matchId).first<MatchRow>();
  if (!m) return null;

  const modelRow = await db.prepare(
    "SELECT * FROM prediction_models WHERE match_id = ? AND provider = ?"
  ).bind(matchId, provider).first<PredictionModelRow>();

  if (!modelRow) return null;

  const systemPrompt = buildSystemPrompt(provider);
  let userPrompt: string;

  if (provider === "leader") {
    const { results: allModels } = await db.prepare(
      "SELECT * FROM prediction_models WHERE match_id = ? AND provider != 'leader' ORDER BY provider"
    ).bind(matchId).all<PredictionModelRow>();

    const matchInfo: Record<string, unknown> = {
      home_team: m.home_team_name,
      away_team: m.away_team_name,
      utc_date: m.utc_date,
      venue: m.venue,
      stage: m.stage,
      group: m.group,
    };

    if (m.group) {
      const groupCtx = await fetchGroupStandingsContext(db, m.group);
      const raw = groupCtx._raw_standings as GroupStandingRow[] | undefined;
      delete groupCtx._raw_standings;
      Object.assign(matchInfo, groupCtx);
      if (raw?.length) {
        const homeQ = teamQualificationSnapshot(raw, m.home_team_id);
        const awayQ = teamQualificationSnapshot(raw, m.away_team_id);
        if (homeQ) matchInfo.home_team_qualification = homeQ;
        if (awayQ) matchInfo.away_team_qualification = awayQ;
      }
    }

    userPrompt = buildLeaderUserPrompt(
      matchInfo,
      allModels.map((r) => ({
        provider: r.provider,
        model: r.model,
        status: r.status,
        expected_goals_home: r.expected_goals_home,
        expected_goals_away: r.expected_goals_away,
        win_prob: r.win_prob,
        draw_prob: r.draw_prob,
        loss_prob: r.loss_prob,
        key_factors: safeArr<KeyFactor>(r.key_factors_json as unknown as string | null),
        narrative: r.narrative,
        risk_factors: safeArr<string>(r.risk_factors_json as unknown as string | null),
      }))
    );
  } else {
    const userData = await buildUserData(db, m);
    userPrompt = buildUserPrompt(userData);
  }

  const computedHash = await hashPrompt(userPrompt);

  return {
    match_id: matchId,
    provider: modelRow.provider,
    model: modelRow.model,
    prompt_hash: modelRow.prompt_hash,
    prompt_hash_match: modelRow.prompt_hash ? modelRow.prompt_hash === computedHash : null,
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    rebuilt: true,
  };
}
