/**
 * Minimal transaction surface for POS stock checks (avoids Prisma.TransactionClient
 * mismatches when the schema client is generated to a custom output path).
 */
export type PosSaleInventoryTx = {
  inventoryProduct: {
    findFirst: (args: {
      where: { id: string; vendorId: string }
      select: { id: true; stock: true; name: true }
    }) => Promise<{ id: string; stock: number; name: string } | null>
  }
}

export type PosSaleLineInput = { productId?: string | null; quantity: number }

/**
 * Ensures each linked inventory row exists for the vendor and has enough stock before decrementing in a POS sale transaction.
 */
export async function assertPosSaleStockAvailable(
  tx: PosSaleInventoryTx,
  vendorId: string,
  items: PosSaleLineInput[]
): Promise<{ ok: true } | { ok: false; message: string; status: number }> {
  for (const item of items) {
    if (!item.productId) continue
    const row = await tx.inventoryProduct.findFirst({
      where: { id: item.productId, vendorId },
      select: { id: true, stock: true, name: true },
    })
    if (!row) {
      return {
        ok: false,
        status: 404,
        message: 'Inventory product not found for this vendor',
      }
    }
    if (row.stock < item.quantity) {
      return {
        ok: false,
        status: 409,
        message: `Insufficient stock for "${row.name}" (${row.stock} available, ${item.quantity} requested)`,
      }
    }
  }
  return { ok: true }
}
