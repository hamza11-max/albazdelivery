-- AL-baz POS local schema v1 (docs/PRODUCT_SPEC_AND_ANALYSIS.md §7).
-- Rules for every migration:
--   * never edit a migration after it has shipped; add a new one
--   * money is INTEGER whole dinars, timestamps are ISO-8601 UTC TEXT
--   * ids are TEXT UUIDv7 generated on the device

CREATE TABLE kv (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

CREATE TABLE shop (
  id             TEXT PRIMARY KEY CHECK (id = 'shop'),
  name           TEXT NOT NULL,
  phone          TEXT,
  address        TEXT,
  logo_path      TEXT,
  receipt_footer TEXT,
  locale         TEXT NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'fr')),
  settings_json  TEXT NOT NULL DEFAULT '{}',
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
) STRICT;

CREATE TABLE users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL CHECK (role IN ('OWNER', 'CASHIER')),
  pin_hash   TEXT NOT NULL,
  is_active  INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  parent_id   TEXT REFERENCES categories (id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT
) STRICT;

CREATE TABLE products (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL CHECK (length(trim(name)) > 0),
  name_alt     TEXT,
  category_id  TEXT REFERENCES categories (id),
  brand        TEXT,
  description  TEXT,
  image_path   TEXT,
  cost_price   INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  sale_price   INTEGER NOT NULL CHECK (sale_price > 0),
  track_stock  INTEGER NOT NULL DEFAULT 1 CHECK (track_stock IN (0, 1)),
  option1_name TEXT,
  option2_name TEXT,
  archived_at  TEXT,
  version      INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
) STRICT;
CREATE INDEX products_category ON products (category_id);

CREATE TABLE variants (
  id                  TEXT PRIMARY KEY,
  product_id          TEXT NOT NULL REFERENCES products (id),
  option1_value       TEXT,
  option2_value       TEXT,
  sku                 TEXT NOT NULL UNIQUE,
  barcode             TEXT UNIQUE,
  sale_price          INTEGER CHECK (sale_price IS NULL OR sale_price > 0),
  cost_price          INTEGER CHECK (cost_price IS NULL OR cost_price >= 0),
  -- Cache of SUM(stock_movements.qty_delta); rebuilt and checked by pos-core.
  stock_qty           INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0),
  archived_at         TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
) STRICT;
CREATE INDEX variants_product ON variants (product_id);

CREATE TABLE stock_receipts (
  id            TEXT PRIMARY KEY,
  supplier_name TEXT,
  reference     TEXT,
  note          TEXT,
  user_id       TEXT NOT NULL REFERENCES users (id),
  total_cost    INTEGER NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  created_at    TEXT NOT NULL
) STRICT;

CREATE TABLE stock_movements (
  id         TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES variants (id),
  type       TEXT NOT NULL CHECK (type IN ('SALE', 'RETURN', 'RECEIVE', 'ADJUST', 'DAMAGE')),
  qty_delta  INTEGER NOT NULL CHECK (qty_delta <> 0),
  unit_cost  INTEGER CHECK (unit_cost IS NULL OR unit_cost >= 0),
  ref_type   TEXT CHECK (ref_type IS NULL OR ref_type IN ('sale', 'receipt', 'adjust')),
  ref_id     TEXT,
  reason     TEXT,
  user_id    TEXT NOT NULL REFERENCES users (id),
  created_at TEXT NOT NULL,
  CHECK (type <> 'ADJUST' OR length(trim(coalesce(reason, ''))) > 0),
  CHECK (type NOT IN ('SALE', 'DAMAGE') OR qty_delta < 0),
  CHECK (type NOT IN ('RETURN', 'RECEIVE') OR qty_delta > 0)
) STRICT;
CREATE INDEX stock_movements_variant ON stock_movements (variant_id, created_at);

CREATE TABLE shifts (
  id                TEXT PRIMARY KEY,
  opened_by         TEXT NOT NULL REFERENCES users (id),
  opened_at         TEXT NOT NULL,
  opening_float     INTEGER NOT NULL CHECK (opening_float >= 0),
  closed_by         TEXT REFERENCES users (id),
  closed_at         TEXT,
  expected_cash     INTEGER,
  counted_cash      INTEGER CHECK (counted_cash IS NULL OR counted_cash >= 0),
  difference        INTEGER,
  difference_reason TEXT,
  denominations_json TEXT,
  -- 1 while open, NULL once closed: the unique index allows one open shift at a time.
  is_open           INTEGER GENERATED ALWAYS AS (CASE WHEN closed_at IS NULL THEN 1 END) VIRTUAL,
  CHECK ((closed_at IS NULL) = (closed_by IS NULL)),
  CHECK (closed_at IS NULL OR (expected_cash IS NOT NULL AND counted_cash IS NOT NULL AND difference = counted_cash - expected_cash)),
  CHECK (coalesce(difference, 0) = 0 OR length(trim(coalesce(difference_reason, ''))) > 0)
) STRICT;
CREATE UNIQUE INDEX shifts_one_open ON shifts (is_open);

CREATE TABLE cash_movements (
  id         TEXT PRIMARY KEY,
  shift_id   TEXT NOT NULL REFERENCES shifts (id),
  type       TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  amount     INTEGER NOT NULL CHECK (amount > 0),
  reason     TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  user_id    TEXT NOT NULL REFERENCES users (id),
  created_at TEXT NOT NULL
) STRICT;
CREATE INDEX cash_movements_shift ON cash_movements (shift_id);

CREATE TABLE sales (
  id               TEXT PRIMARY KEY,
  number           TEXT NOT NULL UNIQUE,
  type             TEXT NOT NULL CHECK (type IN ('SALE', 'RETURN')),
  original_sale_id TEXT REFERENCES sales (id),
  shift_id         TEXT NOT NULL REFERENCES shifts (id),
  user_id          TEXT NOT NULL REFERENCES users (id),
  status           TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'VOIDED')),
  subtotal         INTEGER NOT NULL,
  discount_total   INTEGER NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  tax_total        INTEGER NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  total            INTEGER NOT NULL,
  paid_total       INTEGER NOT NULL,
  change_given     INTEGER NOT NULL DEFAULT 0 CHECK (change_given >= 0),
  note             TEXT,
  created_at       TEXT NOT NULL,
  voided_at        TEXT,
  void_reason      TEXT,
  voided_by        TEXT REFERENCES users (id),
  CHECK ((type = 'RETURN') = (original_sale_id IS NOT NULL)),
  CHECK (type <> 'SALE' OR (subtotal >= 0 AND total >= 0 AND paid_total >= total)),
  CHECK (type <> 'RETURN' OR (total <= 0 AND change_given = 0)),
  CHECK (total = subtotal - discount_total + tax_total),
  CHECK ((status = 'VOIDED') = (voided_at IS NOT NULL)),
  CHECK (status <> 'VOIDED' OR (length(trim(coalesce(void_reason, ''))) > 0 AND voided_by IS NOT NULL))
) STRICT;
CREATE INDEX sales_created ON sales (created_at);
CREATE INDEX sales_shift ON sales (shift_id);
CREATE INDEX sales_original ON sales (original_sale_id);

CREATE TABLE sale_lines (
  id                      TEXT PRIMARY KEY,
  sale_id                 TEXT NOT NULL REFERENCES sales (id),
  variant_id              TEXT NOT NULL REFERENCES variants (id),
  original_line_id        TEXT REFERENCES sale_lines (id),
  name_snapshot           TEXT NOT NULL,
  variant_label_snapshot  TEXT,
  qty                     INTEGER NOT NULL CHECK (qty <> 0),
  unit_price              INTEGER NOT NULL CHECK (unit_price >= 0),
  unit_cost               INTEGER NOT NULL CHECK (unit_cost >= 0),
  line_discount           INTEGER NOT NULL DEFAULT 0 CHECK (line_discount >= 0),
  allocated_sale_discount INTEGER NOT NULL DEFAULT 0 CHECK (allocated_sale_discount >= 0),
  tax_rate                INTEGER NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
  line_total              INTEGER NOT NULL
) STRICT;
CREATE INDEX sale_lines_sale ON sale_lines (sale_id);
CREATE INDEX sale_lines_variant ON sale_lines (variant_id);

CREATE TABLE payments (
  id      TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales (id),
  method  TEXT NOT NULL CHECK (method IN ('CASH', 'CARD_EXTERNAL')),
  -- Negative for refunds on returns.
  amount  INTEGER NOT NULL CHECK (amount <> 0)
) STRICT;
CREATE INDEX payments_sale ON payments (sale_id);

CREATE TABLE held_carts (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id),
  payload_json TEXT NOT NULL,
  created_at   TEXT NOT NULL
) STRICT;

CREATE TABLE audit_events (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users (id),
  action      TEXT NOT NULL,
  entity      TEXT,
  entity_id   TEXT,
  before_json TEXT,
  after_json  TEXT,
  created_at  TEXT NOT NULL
) STRICT;
CREATE INDEX audit_events_created ON audit_events (created_at);

-- Local changes waiting to be pushed to the cloud (spec §6.4). seq is the device sequence.
CREATE TABLE outbox (
  seq          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id     TEXT NOT NULL UNIQUE,
  entity       TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  op           TEXT NOT NULL CHECK (op IN ('UPSERT', 'DELETE')),
  payload_json TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  synced_at    TEXT,
  attempts     INTEGER NOT NULL DEFAULT 0,
  last_error   TEXT
);
CREATE INDEX outbox_pending ON outbox (synced_at, seq);

-- History is append-only: corrections are new rows (void, return, adjustment), never edits.
CREATE TRIGGER audit_events_no_update BEFORE UPDATE ON audit_events
BEGIN SELECT RAISE(ABORT, 'audit_events is append-only'); END;
CREATE TRIGGER audit_events_no_delete BEFORE DELETE ON audit_events
BEGIN SELECT RAISE(ABORT, 'audit_events is append-only'); END;

CREATE TRIGGER stock_movements_no_update BEFORE UPDATE ON stock_movements
BEGIN SELECT RAISE(ABORT, 'stock_movements is append-only'); END;
CREATE TRIGGER stock_movements_no_delete BEFORE DELETE ON stock_movements
BEGIN SELECT RAISE(ABORT, 'stock_movements is append-only'); END;

CREATE TRIGGER sales_no_delete BEFORE DELETE ON sales
BEGIN SELECT RAISE(ABORT, 'sales are never deleted; void or return instead'); END;
CREATE TRIGGER sale_lines_no_delete BEFORE DELETE ON sale_lines
BEGIN SELECT RAISE(ABORT, 'sale lines are never deleted'); END;
CREATE TRIGGER sale_lines_no_update BEFORE UPDATE ON sale_lines
BEGIN SELECT RAISE(ABORT, 'sale lines are immutable'); END;

-- A sale can only change by being voided (status, voided_at, void_reason, voided_by).
CREATE TRIGGER sales_only_void BEFORE UPDATE ON sales
WHEN OLD.status <> 'COMPLETED'
  OR NEW.status <> 'VOIDED'
  OR NEW.id IS NOT OLD.id OR NEW.number IS NOT OLD.number OR NEW.type IS NOT OLD.type
  OR NEW.original_sale_id IS NOT OLD.original_sale_id OR NEW.shift_id IS NOT OLD.shift_id
  OR NEW.user_id IS NOT OLD.user_id OR NEW.subtotal IS NOT OLD.subtotal
  OR NEW.discount_total IS NOT OLD.discount_total OR NEW.tax_total IS NOT OLD.tax_total
  OR NEW.total IS NOT OLD.total OR NEW.paid_total IS NOT OLD.paid_total
  OR NEW.change_given IS NOT OLD.change_given OR NEW.created_at IS NOT OLD.created_at
BEGIN SELECT RAISE(ABORT, 'a completed sale can only be voided'); END;
