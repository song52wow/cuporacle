-- 把 admin SQLite 里的 competition / season 列补到 D1
-- (0001_init.sql 当时漏了,getTournament 需要这俩)

ALTER TABLE matches ADD COLUMN competition TEXT;
ALTER TABLE matches ADD COLUMN season INTEGER;

-- 回填 4 条测试数据
UPDATE matches SET competition='WC', season=2398 WHERE id IN ('537327','537345','537339','537409');
