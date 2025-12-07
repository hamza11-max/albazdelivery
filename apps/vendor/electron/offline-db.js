/**
 * Offline Database Module for Electron Vendor App
 * Uses better-sqlite3 for local data persistence and offline support
 */

const path = require('path')
const { app } = require('electron')

let db = null

function getDbPath() {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'vendor-offline.db')
}

function initDatabase() {
  if (db) return db
  
  const Database = require('better-sqlite3')
  const dbPath = getDbPath()
  
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  
  // Create tables
  db.exec(`
    -- Products table for offline inventory
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      costPrice REAL,
      sellingPrice REAL,
      stock INTEGER DEFAULT 0,
      lowStockThreshold INTEGER DEFAULT 10,
      barcode TEXT,
      image TEXT,
      vendorId TEXT,
      syncedAt INTEGER,
      localUpdatedAt INTEGER,
      needsSync INTEGER DEFAULT 0
    );

    -- Sales table for offline transactions
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      items TEXT NOT NULL,
      subtotal REAL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      paymentMethod TEXT,
      customerId TEXT,
      vendorId TEXT,
      createdAt INTEGER,
      syncedAt INTEGER,
      needsSync INTEGER DEFAULT 1
    );

    -- Customers table
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      vendorId TEXT,
      syncedAt INTEGER,
      localUpdatedAt INTEGER,
      needsSync INTEGER DEFAULT 0
    );

    -- Sync queue for pending operations
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tableName TEXT NOT NULL,
      operation TEXT NOT NULL,
      recordId TEXT NOT NULL,
      data TEXT,
      createdAt INTEGER,
      attempts INTEGER DEFAULT 0,
      lastError TEXT
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendorId);
    CREATE INDEX IF NOT EXISTS idx_sales_vendor ON sales(vendorId);
    CREATE INDEX IF NOT EXISTS idx_sales_needsSync ON sales(needsSync);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(tableName);
  `)
  
  console.log('[Offline DB] Database initialized at:', dbPath)
  return db
}

// Product operations
function getProducts(vendorId) {
  const stmt = db.prepare('SELECT * FROM products WHERE vendorId = ? OR vendorId IS NULL')
  return stmt.all(vendorId)
}

function getProductByBarcode(barcode) {
  const stmt = db.prepare('SELECT * FROM products WHERE barcode = ?')
  return stmt.get(barcode)
}

function upsertProduct(product) {
  const stmt = db.prepare(`
    INSERT INTO products (id, sku, name, description, category, costPrice, sellingPrice, stock, lowStockThreshold, barcode, image, vendorId, syncedAt, localUpdatedAt, needsSync)
    VALUES (@id, @sku, @name, @description, @category, @costPrice, @sellingPrice, @stock, @lowStockThreshold, @barcode, @image, @vendorId, @syncedAt, @localUpdatedAt, @needsSync)
    ON CONFLICT(id) DO UPDATE SET
      sku = @sku,
      name = @name,
      description = @description,
      category = @category,
      costPrice = @costPrice,
      sellingPrice = @sellingPrice,
      stock = @stock,
      lowStockThreshold = @lowStockThreshold,
      barcode = @barcode,
      image = @image,
      syncedAt = @syncedAt,
      localUpdatedAt = @localUpdatedAt,
      needsSync = @needsSync
  `)
  return stmt.run({
    ...product,
    syncedAt: product.syncedAt || Date.now(),
    localUpdatedAt: Date.now(),
    needsSync: product.needsSync || 0
  })
}

function syncProducts(products, vendorId) {
  const insertMany = db.transaction((items) => {
    for (const product of items) {
      upsertProduct({ ...product, vendorId, needsSync: 0 })
    }
  })
  insertMany(products)
  console.log(`[Offline DB] Synced ${products.length} products`)
}

// Sales operations
function saveSale(sale) {
  const stmt = db.prepare(`
    INSERT INTO sales (id, items, subtotal, discount, tax, total, paymentMethod, customerId, vendorId, createdAt, needsSync)
    VALUES (@id, @items, @subtotal, @discount, @tax, @total, @paymentMethod, @customerId, @vendorId, @createdAt, 1)
  `)
  return stmt.run({
    id: sale.id || `offline-${Date.now()}`,
    items: JSON.stringify(sale.items),
    subtotal: sale.subtotal,
    discount: sale.discount || 0,
    tax: sale.tax || 0,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    customerId: sale.customerId,
    vendorId: sale.vendorId,
    createdAt: Date.now()
  })
}

function getPendingSales() {
  const stmt = db.prepare('SELECT * FROM sales WHERE needsSync = 1')
  const sales = stmt.all()
  return sales.map(s => ({ ...s, items: JSON.parse(s.items) }))
}

function markSaleSynced(id) {
  const stmt = db.prepare('UPDATE sales SET needsSync = 0, syncedAt = ? WHERE id = ?')
  return stmt.run(Date.now(), id)
}

// Customer operations
function getCustomers(vendorId) {
  const stmt = db.prepare('SELECT * FROM customers WHERE vendorId = ? OR vendorId IS NULL')
  return stmt.all(vendorId)
}

function upsertCustomer(customer) {
  const stmt = db.prepare(`
    INSERT INTO customers (id, name, email, phone, address, vendorId, syncedAt, localUpdatedAt, needsSync)
    VALUES (@id, @name, @email, @phone, @address, @vendorId, @syncedAt, @localUpdatedAt, @needsSync)
    ON CONFLICT(id) DO UPDATE SET
      name = @name,
      email = @email,
      phone = @phone,
      address = @address,
      syncedAt = @syncedAt,
      localUpdatedAt = @localUpdatedAt,
      needsSync = @needsSync
  `)
  return stmt.run({
    ...customer,
    syncedAt: customer.syncedAt || Date.now(),
    localUpdatedAt: Date.now(),
    needsSync: customer.needsSync || 0
  })
}

function syncCustomers(customers, vendorId) {
  const insertMany = db.transaction((items) => {
    for (const customer of items) {
      upsertCustomer({ ...customer, vendorId, needsSync: 0 })
    }
  })
  insertMany(customers)
  console.log(`[Offline DB] Synced ${customers.length} customers`)
}

// Sync queue operations
function addToSyncQueue(tableName, operation, recordId, data) {
  const stmt = db.prepare(`
    INSERT INTO sync_queue (tableName, operation, recordId, data, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `)
  return stmt.run(tableName, operation, recordId, JSON.stringify(data), Date.now())
}

function getPendingSyncItems() {
  const stmt = db.prepare('SELECT * FROM sync_queue ORDER BY createdAt ASC LIMIT 50')
  return stmt.all().map(item => ({ ...item, data: JSON.parse(item.data) }))
}

function removeSyncItem(id) {
  const stmt = db.prepare('DELETE FROM sync_queue WHERE id = ?')
  return stmt.run(id)
}

function updateSyncItemError(id, error) {
  const stmt = db.prepare('UPDATE sync_queue SET attempts = attempts + 1, lastError = ? WHERE id = ?')
  return stmt.run(error, id)
}

// Utility functions
function getOfflineStats() {
  const products = db.prepare('SELECT COUNT(*) as count FROM products').get()
  const sales = db.prepare('SELECT COUNT(*) as count FROM sales').get()
  const pendingSales = db.prepare('SELECT COUNT(*) as count FROM sales WHERE needsSync = 1').get()
  const customers = db.prepare('SELECT COUNT(*) as count FROM customers').get()
  const syncQueue = db.prepare('SELECT COUNT(*) as count FROM sync_queue').get()
  
  return {
    products: products.count,
    sales: sales.count,
    pendingSales: pendingSales.count,
    customers: customers.count,
    pendingSyncItems: syncQueue.count
  }
}

function closeDatabase() {
  if (db) {
    db.close()
    db = null
    console.log('[Offline DB] Database closed')
  }
}

function isInitialized() {
  return db !== null
}

module.exports = {
  initDatabase,
  closeDatabase,
  isInitialized,
  getProducts,
  getProductByBarcode,
  upsertProduct,
  syncProducts,
  saveSale,
  getPendingSales,
  markSaleSynced,
  getCustomers,
  upsertCustomer,
  syncCustomers,
  addToSyncQueue,
  getPendingSyncItems,
  removeSyncItem,
  updateSyncItemError,
  getOfflineStats
}

