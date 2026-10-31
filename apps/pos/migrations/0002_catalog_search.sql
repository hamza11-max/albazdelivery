-- Full-text search over the catalog: one row per variant, kept in sync by triggers.
-- search_text() is registered by the app on every connection (src/main/db/database.ts)
-- and applies pos-core's normaliseSearchText, so Arabic and French match loosely.

CREATE VIRTUAL TABLE catalog_search USING fts5(
  variant_id UNINDEXED,
  product_id UNINDEXED,
  body,
  tokenize = 'unicode61'
);

CREATE TRIGGER catalog_search_variant_insert AFTER INSERT ON variants
BEGIN
  INSERT INTO catalog_search (variant_id, product_id, body)
  SELECT NEW.id, NEW.product_id,
         search_text(p.name, p.name_alt, p.brand, NEW.sku, NEW.barcode, NEW.option1_value, NEW.option2_value)
  FROM products p WHERE p.id = NEW.product_id;
END;

CREATE TRIGGER catalog_search_variant_update AFTER UPDATE OF sku, barcode, option1_value, option2_value, product_id ON variants
BEGIN
  DELETE FROM catalog_search WHERE variant_id = OLD.id;
  INSERT INTO catalog_search (variant_id, product_id, body)
  SELECT NEW.id, NEW.product_id,
         search_text(p.name, p.name_alt, p.brand, NEW.sku, NEW.barcode, NEW.option1_value, NEW.option2_value)
  FROM products p WHERE p.id = NEW.product_id;
END;

CREATE TRIGGER catalog_search_variant_delete AFTER DELETE ON variants
BEGIN
  DELETE FROM catalog_search WHERE variant_id = OLD.id;
END;

CREATE TRIGGER catalog_search_product_update AFTER UPDATE OF name, name_alt, brand ON products
BEGIN
  DELETE FROM catalog_search WHERE product_id = NEW.id;
  INSERT INTO catalog_search (variant_id, product_id, body)
  SELECT v.id, v.product_id,
         search_text(NEW.name, NEW.name_alt, NEW.brand, v.sku, v.barcode, v.option1_value, v.option2_value)
  FROM variants v WHERE v.product_id = NEW.id;
END;

-- Unique category names among active categories at the same level.
CREATE UNIQUE INDEX categories_name_active ON categories (coalesce(parent_id, ''), name) WHERE archived_at IS NULL;
