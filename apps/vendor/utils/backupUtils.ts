"use client"

import type { Sale } from "@/root/lib/types"
import type { InventoryProduct } from "@/root/lib/types"

export interface BackupData {
  version: string
  timestamp: string
  sales: Sale[]
  products: InventoryProduct[]
  customers: any[]
  suppliers: any[]
  staff: any[]
  coupons: any[]
  settings: {
    shopInfo: any
    operatingHours: any
  }
}

export function createBackup(): BackupData {
  const sales: Sale[] = JSON.parse(localStorage.getItem('electron-sales') || '[]')
  const products: InventoryProduct[] = JSON.parse(localStorage.getItem('electron-products') || '[]')
  const customers: any[] = []
  const suppliers: any[] = []
  const staff: any[] = JSON.parse(localStorage.getItem('vendor-staff') || '[]')
  const coupons: any[] = JSON.parse(localStorage.getItem('vendor-coupons') || '[]')
  
  // Get shop info
  const shopInfo = JSON.parse(localStorage.getItem('vendor-shop-info') || '{}')
  
  // Get operating hours
  const operatingHours: any = {}
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  days.forEach((day) => {
    const stored = localStorage.getItem(`vendor-hours-${day}`)
    if (stored) {
      operatingHours[day] = JSON.parse(stored)
    }
  })

  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    sales,
    products,
    customers,
    suppliers,
    staff,
    coupons,
    settings: {
      shopInfo,
      operatingHours,
    },
  }
}

export function restoreBackup(backupData: BackupData): { success: boolean; message: string } {
  try {
    // Validate backup structure
    if (!backupData.version || !backupData.timestamp) {
      return { success: false, message: 'Invalid backup file format' }
    }

    // Restore sales
    if (backupData.sales && Array.isArray(backupData.sales)) {
      localStorage.setItem('electron-sales', JSON.stringify(backupData.sales))
    }

    // Restore products
    if (backupData.products && Array.isArray(backupData.products)) {
      localStorage.setItem('electron-products', JSON.stringify(backupData.products))
    }

    // Restore staff
    if (backupData.staff && Array.isArray(backupData.staff)) {
      localStorage.setItem('vendor-staff', JSON.stringify(backupData.staff))
    }

    // Restore coupons
    if (backupData.coupons && Array.isArray(backupData.coupons)) {
      localStorage.setItem('vendor-coupons', JSON.stringify(backupData.coupons))
    }

    // Restore shop info
    if (backupData.settings?.shopInfo) {
      localStorage.setItem('vendor-shop-info', JSON.stringify(backupData.settings.shopInfo))
    }

    // Restore operating hours
    if (backupData.settings?.operatingHours) {
      Object.entries(backupData.settings.operatingHours).forEach(([day, hours]) => {
        localStorage.setItem(`vendor-hours-${day}`, JSON.stringify(hours))
      })
    }

    return { success: true, message: 'Backup restored successfully' }
  } catch (error) {
    console.error('Backup restore error:', error)
    return { success: false, message: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

export function downloadBackup(backupData: BackupData, filename?: string): void {
  const jsonString = JSON.stringify(backupData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `vendor-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function uploadBackup(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string) as BackupData
        resolve(backupData)
      } catch (error) {
        reject(new Error('Invalid backup file format'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read backup file'))
    reader.readAsText(file)
  })
}

export function getBackupInfo(): { lastBackup: string | null; backupCount: number } {
  const lastBackup = localStorage.getItem('vendor-last-backup')
  const backupHistory = JSON.parse(localStorage.getItem('vendor-backup-history') || '[]')
  return {
    lastBackup,
    backupCount: backupHistory.length,
  }
}

export function saveBackupHistory(backupData: BackupData): void {
  const history = JSON.parse(localStorage.getItem('vendor-backup-history') || '[]')
  history.push({
    timestamp: backupData.timestamp,
    version: backupData.version,
    dataSize: JSON.stringify(backupData).length,
  })
  // Keep only last 10 backups in history
  if (history.length > 10) {
    history.shift()
  }
  localStorage.setItem('vendor-backup-history', JSON.stringify(history))
  localStorage.setItem('vendor-last-backup', backupData.timestamp)
}

