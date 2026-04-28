# ERP vs storefront product models

## Storefront catalog `Product`

Tied to a **`Store`** (customer-visible menu). Used by storefront flows and **`OrderItem`**. Pricing from `Product.price` — see `Product` in `prisma/schema.prisma`.

## ERP `InventoryProduct`

Separate **SKU-based** ERP model for costing, **`Supplier`**, barcode, reorder thresholds (`lowStockThreshold`), and **`Sale` / `SaleItem`** (POS/back-office sales).

There is **no foreign key** linking `InventoryProduct.id` ↔ `Product.id`. Many deployments manually align entries (same SKU in both) or run internal migration scripts. **Automated sync** should be one explicit product decision per vertical.

## Sync guidance (when catalog and ERP overlap)

- Prefer **`sku`** or barcode as a reconciliation key **if both sides encode it**.
- Prefer a single authoring flow (e.g. publish from ERP → catalog) instead of uncontrolled duplication.
