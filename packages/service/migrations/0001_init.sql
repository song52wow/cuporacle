CREATE TABLE matches (
    id TEXT PRIMARY KEY,
    competition TEXT,         -- 例 "WC"
    season INTEGER,           -- 例 2398(football-data 的 season id)
    utc_date TEXT,
    status TEXT,
    home_team_id TEXT,
    away_team_id TEXT,
    home_team_name TEXT,
    away_team_name TEXT,
    stage TEXT,
    "group" TEXT,           -- SQL 关键字,引号
    venue TEXT,
    winner TEXT,
    home_score INTEGER,
    away_score INTEGER
  );
  CREATE INDEX idx_matches_status ON matches(status);
  CREATE INDEX idx_matches_utc ON matches(utc_date);

  CREATE TABLE team_form (
    team_id TEXT, as_of TEXT,
    last5_w INTEGER, last5_d INTEGER, last5_l INTEGER,
    goals_for_avg REAL, goals_against_avg REAL,
    PRIMARY KEY (team_id, as_of)
  );

  CREATE TABLE h2h (
    team_a_id TEXT, team_b_id TEXT, matches_json TEXT,
    PRIMARY KEY (team_a_id, team_b_id)
  );

  CREATE TABLE team_squad (
    team_id TEXT, as_of TEXT, squad_json TEXT,
    PRIMARY KEY (team_id, as_of)
  );

  CREATE TABLE squad_ratings (
    match_id TEXT, team_id TEXT, player_name TEXT, position TEXT,
    shirt_number INTEGER, overall REAL, passing REAL, shooting REAL,
    defense REAL, pace REAL, rationale TEXT, as_of TEXT,
    PRIMARY KEY (match_id, team_id, player_name)
  );

  CREATE TABLE predictions (
    match_id TEXT PRIMARY KEY,
    created_at TEXT, llm_provider TEXT, llm_model TEXT, prompt_hash TEXT,
    expected_goals_home REAL, expected_goals_away REAL,
    win_prob REAL, draw_prob REAL, loss_prob REAL,
    score_distribution_json TEXT, key_factors_json TEXT,
    key_players_json TEXT, narrative TEXT,
    parse_failed INTEGER DEFAULT 0
  );

  CREATE TABLE prediction_models (
    match_id TEXT, provider TEXT, model TEXT,
    created_at TEXT, updated_at TEXT, status TEXT,
    expected_goals_home REAL, expected_goals_away REAL,
    win_prob REAL, draw_prob REAL, loss_prob REAL,
    score_distribution_json TEXT, key_factors_json TEXT,
    key_players_json TEXT, narrative TEXT, risk_factors_json TEXT,
    prompt_hash TEXT, parse_failed INTEGER DEFAULT 0,
    PRIMARY KEY (match_id, provider)
  );
  CREATE INDEX idx_pm_match ON prediction_models(match_id);