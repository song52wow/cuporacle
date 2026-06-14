// 与 packages/website/lib/types.ts 对齐的 TS 类型
// 备注：暂时两个包各存一份，避免跨包构建复杂度；后续会抽到 packages/shared-types/

export type MatchStatus =
  | "SCHEDULED"
  | "IN_PLAY"
  | "FINISHED"
  | "TIMED"
  | "POSTPONED";

export type PredictionStatus = "all" | "partial" | "none";

export interface Match {
  id: string;
  utc_date: string;
  status: MatchStatus;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  stage: string | null;
  group: string | null;
  venue: string | null;
  home_score: number | null;
  away_score: number | null;
  has_prediction: boolean;
  prediction_status: PredictionStatus;
  prediction_models_total: number;
  prediction_models_ok: number;
}

export interface MatchListResponse {
  matches: Match[];
  total: number;
}

export interface Tournament {
  competition: string;
  season: number;
  match_count: number;
  upcoming_count: number;
  finished_count: number;
}

export interface ScoreDistributionItem {
  home: number;
  away: number;
  p: number;
}

export type KeyFactorImpact =
  | "positive_home"
  | "negative_home"
  | "positive_away"
  | "negative_away"
  | "neutral";

export interface KeyFactor {
  factor: string;
  impact: KeyFactorImpact;
  weight: number;
}

export interface KeyPlayer {
  team: "home" | "away";
  name: string;
  position: string;
  strength: number;
  form_score: number;
  rationale: string;
  source: "roster" | "training_data" | "news" | "mixed";
}

export interface PlayerRating {
  team_id: string;
  player_name: string;
  position: string;
  shirt_number: number | null;
  overall: number;
  passing: number;
  shooting: number;
  defense: number;
  pace: number;
  rationale: string;
  as_of: string;
}

export interface PredictionResponse {
  match_id: string;
  expected_goals_home: number;
  expected_goals_away: number;
  win_prob: number;
  draw_prob: number;
  loss_prob: number;
  score_distribution: ScoreDistributionItem[];
  key_factors: KeyFactor[];
  key_players: KeyPlayer[];
  narrative: string;
  risk_factors: string[];
  degraded: boolean;
  parse_failed: boolean;
  llm_provider: string;
  llm_model: string;
  created_at: string;
}

export interface ModelResult {
  provider: string;
  model: string;
  status: "ok" | "failed";
  error: string | null;
  expected_goals_home: number | null;
  expected_goals_away: number | null;
  win_prob: number | null;
  draw_prob: number | null;
  loss_prob: number | null;
  score_distribution: ScoreDistributionItem[] | null;
  key_factors: KeyFactor[] | null;
  key_players: KeyPlayer[] | null;
  narrative: string | null;
  risk_factors: string[] | null;
  parse_failed: boolean;
  prompt_hash: string | null;
  created_at: string;
  updated_at: string;
  cached: boolean;
}

export interface PredictionBundle {
  primary: PredictionResponse | null;
  models: ModelResult[];
}

export interface MatchDetailResponse {
  match: Match;
  home_form: Record<string, unknown> | null;
  away_form: Record<string, unknown> | null;
  h2h: Record<string, unknown>[];
  home_squad: Record<string, unknown>[];
  away_squad: Record<string, unknown>[];
  home_ratings: PlayerRating[];
  away_ratings: PlayerRating[];
  prediction_status: Record<string, string>;
}
