import type {
  Match,
  MatchDetailResponse,
  MatchListResponse,
  ModelResult,
  PredictionBundle,
  ScoreDistributionItem,
  Tournament,
} from "./types";

// ---------- Mock 数据（与 admin schema 完全对齐）----------
// 用途：后端未启动时，官网可以独立预览；联调时把 env.NEXT_PUBLIC_API_BASE 切到真实后端即可

const groupStage = (group: string, idx: number, kickoff: string, home: string, away: string, venue: string, homeScore: number | null = null, awayScore: number | null = null): Match => ({
  id: `g-${group.toLowerCase()}-${idx}`,
  utc_date: kickoff,
  status: homeScore === null ? "TIMED" : "FINISHED",
  home_team_id: home.toLowerCase().replace(/\s+/g, "-"),
  away_team_id: away.toLowerCase().replace(/\s+/g, "-"),
  home_team_name: home,
  away_team_name: away,
  stage: "GROUP_STAGE",
  group,
  venue,
  home_score: homeScore,
  away_score: awayScore,
  has_prediction: homeScore === null,
  prediction_status: homeScore === null ? "all" : "none",
  prediction_models_total: 4,
  prediction_models_ok: homeScore === null ? 4 : 0,
});

const koStage = (stage: string, idx: number, kickoff: string, home: string, away: string, venue: string): Match => ({
  id: `ko-${stage.toLowerCase().replace(/_/g, "-")}-${idx}`,
  utc_date: kickoff,
  status: "TIMED",
  home_team_id: home.toLowerCase().replace(/\s+/g, "-"),
  away_team_id: away.toLowerCase().replace(/\s+/g, "-"),
  home_team_name: home,
  away_team_name: away,
  stage,
  group: null,
  venue,
  home_score: null,
  away_score: null,
  has_prediction: true,
  prediction_status: "all",
  prediction_models_total: 4,
  prediction_models_ok: 4,
});

export const MOCK_MATCHES: Match[] = [
  // 小组赛
  groupStage("A", 1, "2026-06-12T03:00:00Z", "墨西哥", "瑞典", "Estadio Azteca, 墨西哥城", 1, 1),
  groupStage("A", 2, "2026-06-12T03:00:00Z", "韩国", "乌拉圭", "Estadio Akron, 瓜达拉哈拉"),
  groupStage("B", 1, "2026-06-13T00:00:00Z", "加拿大", "比利时", "BMO Field, 多伦多"),
  groupStage("B", 2, "2026-06-13T03:00:00Z", "卡塔尔", "瑞士", "Levi's Stadium, 圣克拉拉"),
  groupStage("C", 1, "2026-06-14T00:00:00Z", "巴西", "摩洛哥", "MetLife Stadium, 东卢瑟福"),
  groupStage("C", 2, "2026-06-14T03:00:00Z", "海地", "苏格兰", "Camping World Stadium, 奥兰多"),
  groupStage("D", 1, "2026-06-15T00:00:00Z", "美国", "巴拉圭", "SoFi Stadium, 洛杉矶"),
  groupStage("D", 2, "2026-06-15T03:00:00Z", "澳大利亚", "土耳其", "BC Place, 温哥华"),
  groupStage("E", 1, "2026-06-16T00:00:00Z", "德国", "库拉索", "NRG Stadium, 休斯顿"),
  groupStage("E", 2, "2026-06-16T03:00:00Z", "科特迪瓦", "厄瓜多尔", "Lincoln Financial Field, 费城"),
  groupStage("F", 1, "2026-06-17T00:00:00Z", "荷兰", "日本", "AT&T Stadium, 阿灵顿"),
  groupStage("F", 2, "2026-06-17T03:00:00Z", "突尼斯", "加纳", "GEHA Field, 堪萨斯城"),
  groupStage("G", 1, "2026-06-18T00:00:00Z", "比利时", "埃及", "Hard Rock Stadium, 迈阿密"),
  groupStage("G", 2, "2026-06-18T03:00:00Z", "伊朗", "新西兰", "Allegiant Stadium, 拉斯维加斯"),
  groupStage("H", 1, "2026-06-19T00:00:00Z", "西班牙", "佛得角", "Estadio BBVA, 蒙特雷"),
  groupStage("H", 2, "2026-06-19T03:00:00Z", "沙特", "乌兹别克斯坦", "Audi Field, 华盛顿"),
  groupStage("I", 1, "2026-06-20T00:00:00Z", "法国", "塞内加尔", "MetLife Stadium, 东卢瑟福"),
  groupStage("I", 2, "2026-06-20T03:00:00Z", "挪威", "阿根廷", "Mercedes-Benz Stadium, 亚特兰大"),
  groupStage("J", 1, "2026-06-21T00:00:00Z", "阿根廷", "阿尔及利亚", "SoFi Stadium, 洛杉矶"),
  groupStage("J", 2, "2026-06-21T03:00:00Z", "奥地利", "约旦", "TQL Stadium, 辛辛那提"),
  groupStage("K", 1, "2026-06-22T00:00:00Z", "葡萄牙", "巴拿马", "NRG Stadium, 休斯顿"),
  groupStage("K", 2, "2026-06-22T03:00:00Z", "乌兹别克斯坦", "哥伦比亚", "Inter&Co Stadium, 奥兰多"),
  groupStage("L", 1, "2026-06-23T00:00:00Z", "英格兰", "克罗地亚", "AT&T Stadium, 阿灵顿"),
  groupStage("L", 2, "2026-06-23T03:00:00Z", "加纳", "巴拿马", "Bank of America Stadium, 夏洛特"),
  // 淘汰赛
  koStage("ROUND_OF_32", 1, "2026-06-29T00:00:00Z", "A1", "B2", "SoFi Stadium, 洛杉矶"),
  koStage("ROUND_OF_16", 1, "2026-07-03T03:00:00Z", "1A", "2B", "MetLife Stadium, 东卢瑟福"),
  koStage("QUARTER_FINALS", 1, "2026-07-11T03:00:00Z", "TBD", "TBD", "AT&T Stadium, 阿灵顿"),
  koStage("SEMI_FINALS", 1, "2026-07-15T00:00:00Z", "TBD", "TBD", "Mercedes-Benz Stadium, 亚特兰大"),
  koStage("FINAL", 1, "2026-07-19T20:00:00Z", "TBD", "TBD", "MetLife Stadium, 东卢瑟福"),
];

export const MOCK_TOURNAMENT: Tournament = {
  competition: "WC",
  season: 2026,
  match_count: 104,
  upcoming_count: 72,
  finished_count: 32,
};

function buildScoreDistribution(win: number, draw: number, loss: number) {
  // 构造一个合理形态的分布（Poisson 风格）
  const homeXG = 1.5 + win * 1.6;
  const awayXG = 0.6 + loss * 1.4;
  const out: ScoreDistributionItem[] = [];
  for (let h = 0; h <= 4; h++) {
    for (let a = 0; a <= 3; a++) {
      // 简化：h-a 差值越接近 xG 差，p 越大
      const dg = h - a;
      const dExp = homeXG - awayXG;
      const p =
        Math.exp(-Math.pow(dg - dExp, 2) / 2.4) *
        (h === a ? draw + 0.05 : 1) *
        (h > a ? 1 + win * 0.3 : 1) *
        (h < a ? 1 + loss * 0.3 : 1);
      out.push({ home: h, away: a, p: Number(p.toFixed(4)) });
    }
  }
  const sum = out.reduce((a, b) => a + b.p, 0);
  return out
    .map((s) => ({ ...s, p: Number((s.p / sum).toFixed(4)) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 10);
}

const basePredictionDate = "2026-06-12T01:00:00Z";

function makePredictionFor(
  match: Match,
  win: number,
  draw: number,
  loss: number,
  provider = "mimo",
  model = "MiMo-7B"
) {
  return {
    match_id: match.id,
    expected_goals_home: Number((1.4 + win * 1.5).toFixed(2)),
    expected_goals_away: Number((0.7 + loss * 1.3).toFixed(2)),
    win_prob: Number(win.toFixed(3)),
    draw_prob: Number(draw.toFixed(3)),
    loss_prob: Number(loss.toFixed(3)),
    score_distribution: buildScoreDistribution(win, draw, loss),
    key_factors: [
      {
        factor: "近期主场战绩 5 战 4 胜 1 平，状态火热",
        impact: "positive_home" as const,
        weight: 0.32,
      },
      {
        factor: "主力前锋伤愈回归，进攻端威胁显著提升",
        impact: "positive_home" as const,
        weight: 0.24,
      },
      {
        factor: "客场连续 3 场失球超过 1.5 个",
        impact: "positive_home" as const,
        weight: 0.18,
      },
      {
        factor: "近 5 场 H2H 客队 2 胜 2 平 1 负，存在心理优势",
        impact: "positive_away" as const,
        weight: 0.16,
      },
      {
        factor: "天气：高温 33°C，可能影响主队体能",
        impact: "neutral" as const,
        weight: 0.10,
      },
    ],
    key_players: [
      {
        team: "home" as const,
        name: "Vinícius Jr.",
        position: "Forward",
        strength: 9.1,
        form_score: 8.7,
        rationale: "近 5 场贡献 4 球 2 助攻，盘带突破极具威胁",
        source: "mixed" as const,
      },
      {
        team: "home" as const,
        name: "Casemiro",
        position: "Midfielder",
        strength: 8.6,
        form_score: 8.2,
        rationale: "中场拦截与出球枢纽，防守贡献稳定",
        source: "roster" as const,
      },
      {
        team: "away" as const,
        name: "Achraf Hakimi",
        position: "Defence",
        strength: 8.8,
        form_score: 8.0,
        rationale: "右路攻防俱佳，速度与助攻能力突出",
        source: "news" as const,
      },
    ],
    narrative: `${match.home_team_name} 近期主场状态强势，进攻端有 ${match.home_team_name} 主力前锋的强势输出，整体预期进球 ${(1.4 + win * 1.5).toFixed(2)} 球；${match.away_team_name} 客场防线存在隐患，但右路反击仍具威胁。综合多模型判断，${match.home_team_name} 胜率显著占优，最可能比分为 2-0 / 2-1。`,
    risk_factors: [
      "若主队前锋被限制，胜率可能下移至 55% 区间",
      "加时赛/点球剧本存在 8% 概率",
    ],
    degraded: false,
    parse_failed: false,
    llm_provider: provider,
    llm_model: model,
    created_at: basePredictionDate,
  };
}

function makeOtherModel(
  matchId: string,
  provider: string,
  model: string,
  win: number,
  draw: number,
  loss: number
): ModelResult {
  return {
    provider,
    model,
    status: "ok",
    error: null,
    expected_goals_home: Number((1.4 + win * 1.5).toFixed(2)),
    expected_goals_away: Number((0.7 + loss * 1.3).toFixed(2)),
    win_prob: Number(win.toFixed(3)),
    draw_prob: Number(draw.toFixed(3)),
    loss_prob: Number(loss.toFixed(3)),
    score_distribution: buildScoreDistribution(win, draw, loss),
    key_factors: null,
    key_players: null,
    narrative: `${provider} 模型：综合近况与场地因素，倾向 ${win > loss ? "主胜" : win < loss ? "客胜" : "平局"}。`,
    risk_factors: null,
    parse_failed: false,
    prompt_hash: null,
    created_at: basePredictionDate,
    updated_at: basePredictionDate,
    cached: true,
  };
}

export function mockMatchList(): MatchListResponse {
  return { matches: MOCK_MATCHES, total: MOCK_MATCHES.length };
}

export function mockTournament(): Tournament {
  return MOCK_TOURNAMENT;
}

export function mockMatchDetail(id: string): MatchDetailResponse | null {
  const m = MOCK_MATCHES.find((x) => x.id === id);
  if (!m) return null;
  return {
    match: m,
    home_form: {
      team_id: m.home_team_id,
      as_of: "2026-06-10",
      last5_w: 4,
      last5_d: 1,
      last5_l: 0,
      goals_for_avg: 2.4,
      goals_against_avg: 0.6,
    },
    away_form: {
      team_id: m.away_team_id,
      as_of: "2026-06-10",
      last5_w: 2,
      last5_d: 1,
      last5_l: 2,
      goals_for_avg: 1.2,
      goals_against_avg: 1.4,
    },
    h2h: [
      { date: "2023-11-15", home_team_id: m.home_team_id, away_team_id: m.away_team_id, home_score: 2, away_score: 1, competition: "Friendly" },
      { date: "2022-09-23", home_team_id: m.away_team_id, away_team_id: m.home_team_id, home_score: 0, away_score: 2, competition: "Friendly" },
      { date: "2018-06-03", home_team_id: m.home_team_id, away_team_id: m.away_team_id, home_score: 1, away_score: 1, competition: "WC Group" },
    ],
    home_squad: [],
    away_squad: [],
    home_ratings: [
      { team_id: m.home_team_id, player_name: "Vinícius Jr.", position: "Forward", shirt_number: 7, overall: 9.1, passing: 8.4, shooting: 8.9, defense: 4.2, pace: 9.6, rationale: "边路爆破与终结能力顶级", as_of: "2026-06-10" },
      { team_id: m.home_team_id, player_name: "Casemiro", position: "Midfielder", shirt_number: 5, overall: 8.6, passing: 8.5, shooting: 7.0, defense: 8.8, pace: 6.5, rationale: "中场防守与节奏控制枢纽", as_of: "2026-06-10" },
      { team_id: m.home_team_id, player_name: "Alisson", position: "Goalkeeper", shirt_number: 1, overall: 8.8, passing: 7.5, shooting: 3.0, defense: 8.5, pace: 6.0, rationale: "门线技术稳定，扑救反应突出", as_of: "2026-06-10" },
    ],
    away_ratings: [
      { team_id: m.away_team_id, player_name: "Achraf Hakimi", position: "Defence", shirt_number: 2, overall: 8.8, passing: 8.2, shooting: 7.0, defense: 8.5, pace: 9.2, rationale: "右路攻防俱佳", as_of: "2026-06-10" },
      { team_id: m.away_team_id, player_name: "Youssef En-Nesyri", position: "Forward", shirt_number: 19, overall: 8.4, passing: 7.2, shooting: 8.6, defense: 4.0, pace: 8.5, rationale: "支点与抢点能力突出", as_of: "2026-06-10" },
    ],
    prediction_status: { mimo: "ok", deepseek: "ok", glm: "ok", minimax: "ok" },
  };
}

export function mockPredictionBundle(matchId: string): PredictionBundle | null {
  const m = MOCK_MATCHES.find((x) => x.id === matchId);
  if (!m) return null;
  // 不同 match 给出略不同的概率
  const seed = matchId.length;
  const win = 0.5 + ((seed * 7) % 30) / 100;
  const loss = 0.18 + ((seed * 11) % 22) / 100;
  const draw = +(1 - win - loss).toFixed(3);
  return {
    primary: makePredictionFor(m, win, draw, loss),
    models: [
      makeOtherModel(m.id, "mimo", "MiMo-7B", win, draw, loss),
      makeOtherModel(m.id, "deepseek", "deepseek-chat", win - 0.04, draw + 0.02, loss + 0.02),
      makeOtherModel(m.id, "glm", "glm-4-plus", win + 0.05, draw - 0.02, loss - 0.03),
      makeOtherModel(m.id, "minimax", "MiniMax-Text-01", win - 0.02, draw + 0.01, loss + 0.01),
    ],
  };
}
