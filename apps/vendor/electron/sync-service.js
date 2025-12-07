/**
 * Sync Service for Electron Vendor App
 * Handles background synchronization between local SQLite and remote API
 */

let offlineDb = null
try {
  offlineDb = require('./offline-db')
} catch (e) {
  console.warn('[Sync Service] Offline DB not available:', e.message)
}

let syncInterval = null
let isOnline = true
let baseUrl = 'http://localhost:3001'

function setBaseUrl(url) {
  baseUrl = url
}

function setOnlineStatus(online) {
  isOnline = online
  console.log(`[Sync Service] Online status: ${online}`)
}

async function syncToServer() {
  if (!isOnline) {
    console.log('[Sync Service] Offline - skipping sync')
    return { success: false, reason: 'offline' }
  }

  if (!offlineDb || !offlineDb.isInitialized?.()) {
    return { success: false, reason: 'database not available' }
  }

  try {
    // Sync pending sales
    const pendingSales = offlineDb.getPendingSales()
    let syncedSales = 0
    
    for (const sale of pendingSales) {
      try {
        const response = await fetch(`${baseUrl}/api/erp/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale)
        })
        
        if (response.ok) {
          offlineDb.markSaleSynced(sale.id)
          syncedSales++
        } else {
          console.error(`[Sync Service] Failed to sync sale ${sale.id}:`, await response.text())
        }
      } catch (error) {
        console.error(`[Sync Service] Error syncing sale ${sale.id}:`, error.message)
      }
    }

    // Process sync queue
    const queueItems = offlineDb.getPendingSyncItems()
    let processedItems = 0
    
    for (const item of queueItems) {
      try {
        let response
        const endpoint = `${baseUrl}/api/erp/${item.tableName}`
        
        switch (item.operation) {
          case 'CREATE':
            response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            })
            break
          case 'UPDATE':
            response = await fetch(endpoint, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            })
            break
          case 'DELETE':
            response = await fetch(`${endpoint}?id=${item.recordId}`, {
              method: 'DELETE'
            })
            break
        }
        
        if (response && response.ok) {
          offlineDb.removeSyncItem(item.id)
          processedItems++
        } else {
          offlineDb.updateSyncItemError(item.id, response ? await response.text() : 'Unknown error')
        }
      } catch (error) {
        offlineDb.updateSyncItemError(item.id, error.message)
      }
    }

    console.log(`[Sync Service] Synced ${syncedSales} sales, ${processedItems} queue items`)
    return { success: true, syncedSales, processedItems }
  } catch (error) {
    console.error('[Sync Service] Sync error:', error)
    return { success: false, error: error.message }
  }
}

async function syncFromServer(vendorId) {
  if (!isOnline) {
    console.log('[Sync Service] Offline - using local data')
    return { success: false, reason: 'offline' }
  }

  if (!offlineDb || !offlineDb.isInitialized?.()) {
    return { success: false, reason: 'database not available' }
  }

  try {
    // Fetch and sync products
    const productsResponse = await fetch(`${baseUrl}/api/erp/inventory${vendorId ? `?vendorId=${vendorId}` : ''}`)
    if (productsResponse.ok) {
      const data = await productsResponse.json()
      if (data.products) {
        offlineDb.syncProducts(data.products, vendorId)
      }
    }

    // Fetch and sync customers
    const customersResponse = await fetch(`${baseUrl}/api/erp/customers${vendorId ? `?vendorId=${vendorId}` : ''}`)
    if (customersResponse.ok) {
      const data = await customersResponse.json()
      if (data.customers) {
        offlineDb.syncCustomers(data.customers, vendorId)
      }
    }

    console.log('[Sync Service] Downloaded latest data from server')
    return { success: true }
  } catch (error) {
    console.error('[Sync Service] Download error:', error)
    return { success: false, error: error.message }
  }
}

function startAutoSync(intervalMs = 30000) {
  if (syncInterval) {
    clearInterval(syncInterval)
  }
  
  syncInterval = setInterval(async () => {
    await syncToServer()
  }, intervalMs)
  
  console.log(`[Sync Service] Auto-sync started (every ${intervalMs / 1000}s)`)
}

function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    console.log('[Sync Service] Auto-sync stopped')
  }
}

module.exports = {
  setBaseUrl,
  setOnlineStatus,
  syncToServer,
  syncFromServer,
  startAutoSync,
  stopAutoSync
}

