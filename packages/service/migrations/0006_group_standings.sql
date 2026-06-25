CREATE TABLE IF NOT EXISTS group_standings (
    "group" TEXT NOT NULL,
    team_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    position INTEGER NOT NULL,
    played INTEGER NOT NULL,
    won INTEGER NOT NULL,
    drawn INTEGER NOT NULL,
    lost INTEGER NOT NULL,
    goals_for INTEGER NOT NULL,
    goals_against INTEGER NOT NULL,
    goal_diff INTEGER NOT NULL,
    points INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY ("group", team_id)
);
CREATE INDEX IF NOT EXISTS idx_group_standings_group ON group_standings("group");
