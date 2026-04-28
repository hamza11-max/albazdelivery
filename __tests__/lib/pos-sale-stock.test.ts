import { assertPosSaleStockAvailable } from '@/lib/erp/pos-sale-stock'

describe('assertPosSaleStockAvailable', () => {
  const makeTx = (stockById: Record<string, { stock: number; name: string }>) => ({
    inventoryProduct: {
      findFirst: jest.fn(async ({ where }: { where: { id: string; vendorId: string } }) => {
        const row = stockById[where.id]
        if (!row) return null
        return { id: where.id, stock: row.stock, name: row.name }
      }),
    },
  })

  it('allows sale when stock is sufficient', async () => {
    const tx = makeTx({ p1: { stock: 10, name: 'A' } }) as any
    const r = await assertPosSaleStockAvailable(tx, 'v1', [{ productId: 'p1', quantity: 3 }])
    expect(r).toEqual({ ok: true })
  })

  it('rejects when product missing', async () => {
    const tx = makeTx({}) as any
    const r = await assertPosSaleStockAvailable(tx, 'v1', [{ productId: 'missing', quantity: 1 }])
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(404)
    }
  })

  it('rejects when stock too low', async () => {
    const tx = makeTx({ p1: { stock: 1, name: 'Low' } }) as any
    const r = await assertPosSaleStockAvailable(tx, 'v1', [{ productId: 'p1', quantity: 2 }])
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(409)
      expect(r.message).toMatch(/Insufficient stock/)
    }
  })

  it('ignores lines without productId', async () => {
    const tx = makeTx({}) as any
    const r = await assertPosSaleStockAvailable(tx, 'v1', [
      { productId: null, quantity: 99 },
      { quantity: 1 } as { productId?: string; quantity: number },
    ])
    expect(r).toEqual({ ok: true })
    expect(tx.inventoryProduct.findFirst).not.toHaveBeenCalled()
  })
})
