-- Stock counts (inventaire): snapshot what the system expects, enter what is on the shelf,
-- finish to record one ADJUST per difference. Uncounted items are left as they are.
CREATE TABLE stock_counts (
  id          TEXT PRIMARY KEY,
  status      TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FINISHED', 'CANCELLED')),
  note        TEXT,
  user_id     TEXT NOT NULL REFERENCES users (id),
  created_at  TEXT NOT NULL,
  finished_at TEXT,
  finished_by TEXT REFERENCES users (id)
) STRICT;

-- Only one count open at a time.
CREATE UNIQUE INDEX stock_counts_one_open ON stock_counts (status) WHERE status = 'OPEN';

CREATE TABLE stock_count_lines (
  count_id   TEXT NOT NULL REFERENCES stock_counts (id),
  variant_id TEXT NOT NULL REFERENCES variants (id),
  expected   INTEGER NOT NULL,
  counted    INTEGER CHECK (counted IS NULL OR counted >= 0),
  counted_at TEXT,
  PRIMARY KEY (count_id, variant_id)
) STRICT;
