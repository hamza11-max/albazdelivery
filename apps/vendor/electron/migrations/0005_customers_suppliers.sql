-- Customers with a credit book (carnet de crédit), suppliers, credit sales and the manager role.

CREATE TABLE customers (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL CHECK (length(trim(name)) > 0),
  phone        TEXT,
  note         TEXT,
  -- NULL = no limit on what the customer may owe.
  credit_limit INTEGER CHECK (credit_limit IS NULL OR credit_limit >= 0),
  archived_at  TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
) STRICT;
CREATE UNIQUE INDEX customers_phone ON customers (phone) WHERE phone IS NOT NULL AND archived_at IS NULL;

-- What each customer owes is SUM(amount): positive = they owe more, negative = they paid or got credit back.
CREATE TABLE customer_ledger (
  id          TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers (id),
  type        TEXT NOT NULL CHECK (type IN ('CREDIT_SALE', 'PAYMENT', 'CREDIT_RETURN', 'ADJUST')),
  amount      INTEGER NOT NULL CHECK (amount <> 0),
  sale_id     TEXT REFERENCES sales (id),
  -- How a PAYMENT was made.
  method      TEXT CHECK (method IS NULL OR method IN ('CASH', 'CARD_EXTERNAL')),
  note        TEXT,
  user_id     TEXT NOT NULL REFERENCES users (id),
  created_at  TEXT NOT NULL,
  CHECK (type NOT IN ('CREDIT_SALE') OR amount > 0),
  CHECK (type NOT IN ('PAYMENT', 'CREDIT_RETURN') OR amount < 0),
  CHECK (type <> 'PAYMENT' OR method IS NOT NULL),
  CHECK (type <> 'ADJUST' OR length(trim(coalesce(note, ''))) > 0)
) STRICT;
CREATE INDEX customer_ledger_customer ON customer_ledger (customer_id, created_at);

CREATE TRIGGER customer_ledger_no_update BEFORE UPDATE ON customer_ledger
BEGIN SELECT RAISE(ABORT, 'customer_ledger is append-only'); END;
CREATE TRIGGER customer_ledger_no_delete BEFORE DELETE ON customer_ledger
BEGIN SELECT RAISE(ABORT, 'customer_ledger is append-only'); END;

CREATE TABLE suppliers (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL CHECK (length(trim(name)) > 0),
  phone       TEXT,
  note        TEXT,
  archived_at TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
) STRICT;
CREATE UNIQUE INDEX suppliers_name ON suppliers (lower(name)) WHERE archived_at IS NULL;

ALTER TABLE stock_receipts ADD COLUMN supplier_id TEXT REFERENCES suppliers (id);
ALTER TABLE sales ADD COLUMN customer_id TEXT REFERENCES customers (id);

-- A manager is a cashier account with the manager's rights (catalog, stock, customers, suppliers).
ALTER TABLE users ADD COLUMN is_manager INTEGER NOT NULL DEFAULT 0 CHECK (is_manager IN (0, 1));

-- Payments gain CREDIT (on the customer's account). Nothing references payments, so it is rebuilt.
CREATE TABLE payments_new (
  id      TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales (id),
  method  TEXT NOT NULL CHECK (method IN ('CASH', 'CARD_EXTERNAL', 'CREDIT')),
  -- Negative for refunds on returns.
  amount  INTEGER NOT NULL CHECK (amount <> 0)
) STRICT;
INSERT INTO payments_new (id, sale_id, method, amount) SELECT id, sale_id, method, amount FROM payments;
DROP TABLE payments;
ALTER TABLE payments_new RENAME TO payments;
CREATE INDEX payments_sale ON payments (sale_id);

-- The customer of a sale is fixed once recorded, like everything else but the void fields.
DROP TRIGGER sales_only_void;
CREATE TRIGGER sales_only_void BEFORE UPDATE ON sales
WHEN OLD.status <> 'COMPLETED'
  OR NEW.status <> 'VOIDED'
  OR NEW.id IS NOT OLD.id OR NEW.number IS NOT OLD.number OR NEW.type IS NOT OLD.type
  OR NEW.original_sale_id IS NOT OLD.original_sale_id OR NEW.shift_id IS NOT OLD.shift_id
  OR NEW.user_id IS NOT OLD.user_id OR NEW.subtotal IS NOT OLD.subtotal
  OR NEW.discount_total IS NOT OLD.discount_total OR NEW.tax_total IS NOT OLD.tax_total
  OR NEW.total IS NOT OLD.total OR NEW.paid_total IS NOT OLD.paid_total
  OR NEW.change_given IS NOT OLD.change_given OR NEW.created_at IS NOT OLD.created_at
  OR NEW.customer_id IS NOT OLD.customer_id
BEGIN SELECT RAISE(ABORT, 'a completed sale can only be voided'); END;
