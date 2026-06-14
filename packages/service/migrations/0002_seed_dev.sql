-- 开发测试数据 - 覆盖所有状态和关键场景
-- 一条 INSERT 失败就让整个文件失败,要么全成功要么全回滚

-- 4 场比赛,涵盖 4 种状态
INSERT INTO matches VALUES
  ('537327','WC',2398,'2026-06-11T19:00:00Z','FINISHED','769','774','Mexico','South Africa','GROUP_STAGE','GROUP_A','Estadio Azteca, Mexico City',NULL,2,0),
  ('537345','WC',2398,'2026-06-13T01:00:00Z','IN_PLAY','771','761','United States','Paraguay','GROUP_STAGE','GROUP_D','SoFi Stadium, Los Angeles',NULL,1,1),
  ('537339','WC',2398,'2026-06-13T22:00:00Z','TIMED','764','815','Brazil','Morocco','GROUP_STAGE','GROUP_C','MetLife Stadium, East Rutherford',NULL,NULL,NULL),
  ('537409','WC',2398,'2026-06-17T20:00:00Z','SCHEDULED','770','799','England','Croatia','GROUP_STAGE','GROUP_L','Wembley Stadium, London',NULL,NULL,NULL);

-- Brazil 主场胜率高,Morocco 客场一般
INSERT INTO team_form VALUES
  ('764','2026-06-10',4,1,0,2.4,0.6),
  ('815','2026-06-10',2,1,2,1.2,1.4);

-- Brazil vs Morocco 历史交锋
INSERT INTO h2h VALUES
  ('764','815','[{"date":"2022-12-10","home_team_id":"764","away_team_id":"815","home_score":2,"away_score":0,"competition":"WC Group"}]');

-- Brazil 阵容
INSERT INTO team_squad VALUES
  ('764','2026-06-10','[{"name":"Vinícius Jr.","position":"Forward","shirt_number":7},{"name":"Casemiro","position":"Midfielder","shirt_number":5},{"name":"Alisson","position":"Goalkeeper","shirt_number":1}]');

-- 537339 比赛的两队球员评分
INSERT INTO squad_ratings VALUES
  ('537339','764','Vinícius Jr.','Forward',7,9.1,8.4,8.9,4.2,9.6,'边路爆破与终结能力顶级','2026-06-10'),
  ('537339','764','Casemiro','Midfielder',5,8.6,8.5,7.0,8.8,6.5,'中场防守与节奏控制枢纽','2026-06-10'),
  ('537339','815','Achraf Hakimi','Defence',2,8.8,8.2,7.0,8.5,9.2,'右路攻防俱佳','2026-06-10');

-- 537339 的主预测(merged/best)
INSERT INTO predictions VALUES
  ('537339','2026-06-12T01:00:00Z','mimo','MiMo-7B','abc123',2.1,0.8,0.62,0.22,0.16,
   '[{"home":2,"away":0,"p":0.15},{"home":2,"away":1,"p":0.12}]',
   '[{"factor":"近期主场战绩 5 战 4 胜","impact":"positive_home","weight":0.32}]',
   '[{"team":"home","name":"Vinícius Jr.","position":"Forward","strength":9.1,"form_score":8.7,"rationale":"近 5 场贡献 4 球 2 助攻","source":"mixed"}]',
   'Brazil 近期主场状态强势,进攻端有 Vinícius Jr. 强势输出,综合判断主胜概率显著占优。',
   0);

-- 537339 的 3 个模型:2 个 ok + 1 个 failed(测试 partial 状态)
INSERT INTO prediction_models VALUES
  ('537339','mimo','MiMo-7B','2026-06-12T01:00:00Z','2026-06-12T01:00:00Z','ok',2.1,0.8,0.62,0.22,0.16,
   '[{"home":2,"away":0,"p":0.15}]',
   '[{"factor":"主场优势","impact":"positive_home","weight":0.30}]',
   '[{"team":"home","name":"Vinícius Jr.","position":"Forward","strength":9.1,"form_score":8.7,"rationale":"核心","source":"mixed"}]',
   'mimo 模型:倾向主胜,最可能比分为 2-0。',
   '["主队前锋伤愈"]',
   'abc123',0),
  ('537339','deepseek','deepseek-chat','2026-06-12T01:00:00Z','2026-06-12T01:00:00Z','ok',1.9,0.9,0.55,0.25,0.20,
   '[{"home":1,"away":0,"p":0.18}]',
   '[{"factor":"防守稳固","impact":"positive_home","weight":0.25}]',NULL,
   'deepseek 模型:综合判断,Brazil 小胜。',
   '["客场反击"]',
   'def456',0),
  ('537339','glm','glm-4-plus','2026-06-12T01:00:00Z','2026-06-12T01:00:00Z','failed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0);
