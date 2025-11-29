import { readFileSync } from 'fs'
import { join } from 'path'

describe('Vendor page structure validation', () => {
  it('uses modular tab components', () => {
    const pagePath = join(__dirname, '..', 'app', 'vendor', 'page.tsx')
    const content = readFileSync(pagePath, 'utf8')

    // Verify modular components are imported
    expect(content).toContain('import { DashboardTab }')
    expect(content).toContain('import { InventoryTab }')
    expect(content).toContain('import { POSView }')
    expect(content).toContain('import { SalesTab }')
    expect(content).toContain('import { CustomersTab }')
    expect(content).toContain('import { SuppliersTab }')
    expect(content).toContain('import { AITab }')
    expect(content).toContain('import { SettingsTab }')
  })

  it('uses modular dialog components', () => {
    const pagePath = join(__dirname, '..', 'app', 'vendor', 'page.tsx')
    const content = readFileSync(pagePath, 'utf8')

    expect(content).toContain('import { ProductDialog }')
    expect(content).toContain('import { CustomerDialog }')
    expect(content).toContain('import { SupplierDialog }')
    expect(content).toContain('import { ReceiptDialog }')
    expect(content).toContain('import { SaleSuccessDialog }')
    expect(content).toContain('import { ImageUploadDialog }')
    // Barcode scanner is handled by hook, not a dialog component
  })

  it('uses the barcode scanner hook', () => {
    const pagePath = join(__dirname, '..', 'app', 'vendor', 'page.tsx')
    const content = readFileSync(pagePath, 'utf8')

    expect(content).toContain('import { useBarcodeScanner }')
    expect(content).toContain('useBarcodeScanner(')
  })

  it('has proper authentication handling for Electron', () => {
    const pagePath = join(__dirname, '..', 'app', 'vendor', 'page.tsx')
    const content = readFileSync(pagePath, 'utf8')

    // Should detect Electron runtime
    expect(content).toContain('isElectronRuntime')
    expect(content).toContain('electronAPI')
  })
})

