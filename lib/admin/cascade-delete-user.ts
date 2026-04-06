import type { Prisma } from '@prisma/client'

/**
 * Deletes orders (and payment/review graphs), then other rows that reference
 * the user, so `user.delete` can succeed without FK violations.
 */
async function deleteOrdersLinkedToUser(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<void> {
  const stores = await tx.store.findMany({
    where: { vendorId: userId },
    select: { id: true },
  })
  const storeIds = stores.map((s) => s.id)

  const orConditions: Prisma.OrderWhereInput[] = [
    { customerId: userId },
    { vendorId: userId },
    { driverId: userId },
  ]
  if (storeIds.length > 0) {
    orConditions.push({ storeId: { in: storeIds } })
  }

  const ordersFromDirect = await tx.order.findMany({
    where: { OR: orConditions },
    select: { id: true },
  })

  // Orders whose line items reference catalog products from this vendor's stores
  // (vendorId/storeId on Order can be missing or inconsistent in legacy data).
  const ordersFromVendorCatalog =
    storeIds.length > 0
      ? await tx.order.findMany({
          where: {
            items: {
              some: {
                product: { storeId: { in: storeIds } },
              },
            },
          },
          select: { id: true },
        })
      : []

  const orderIds = [
    ...new Set([
      ...ordersFromDirect.map((o) => o.id),
      ...ordersFromVendorCatalog.map((o) => o.id),
    ]),
  ]
  if (orderIds.length === 0) return

  await tx.vendorResponse.deleteMany({
    where: { review: { orderId: { in: orderIds } } },
  })
  await tx.review.deleteMany({ where: { orderId: { in: orderIds } } })
  await tx.refund.deleteMany({ where: { orderId: { in: orderIds } } })
  await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } })
  await tx.order.deleteMany({ where: { id: { in: orderIds } } })
}

/**
 * Removes dependent rows for an admin-initiated hard delete. Does not delete
 * the user row — callers should do that after auth checks.
 */
export async function deleteUserRelatedData(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<void> {
  await deleteOrdersLinkedToUser(tx, userId)

  await tx.chatMessage.deleteMany({ where: { senderId: userId } })
  await tx.supportTicket.deleteMany({ where: { customerId: userId } })
  await tx.notification.deleteMany({ where: { recipientId: userId } })

  await tx.vendorResponse.deleteMany({
    where: { review: { OR: [{ customerId: userId }, { vendorId: userId }] } },
  })
  await tx.review.deleteMany({
    where: { OR: [{ customerId: userId }, { vendorId: userId }] },
  })

  const loc = await tx.driverLocation.findUnique({
    where: { driverId: userId },
    select: { id: true },
  })
  if (loc) {
    await tx.locationHistory.deleteMany({ where: { driverLocationId: loc.id } })
  }
  await tx.driverLocation.deleteMany({ where: { driverId: userId } })
  await tx.driverPerformance.deleteMany({ where: { driverId: userId } })

  const loyalty = await tx.loyaltyAccount.findUnique({
    where: { customerId: userId },
    select: { id: true },
  })
  if (loyalty) {
    await tx.customerRedemption.deleteMany({
      where: { loyaltyAccountId: loyalty.id },
    })
    await tx.loyaltyTransaction.deleteMany({
      where: { loyaltyAccountId: loyalty.id },
    })
    await tx.loyaltyAccount.deleteMany({ where: { customerId: userId } })
  }

  const wallet = await tx.wallet.findUnique({
    where: { customerId: userId },
    select: { id: true },
  })
  if (wallet) {
    await tx.walletTransaction.deleteMany({ where: { walletId: wallet.id } })
    await tx.wallet.deleteMany({ where: { customerId: userId } })
  }

  const sub = await tx.subscription.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (sub) {
    await tx.subscriptionPayment.deleteMany({
      where: { subscriptionId: sub.id },
    })
    await tx.subscriptionUsage.deleteMany({
      where: { subscriptionId: sub.id },
    })
    await tx.subscription.deleteMany({ where: { userId } })
  }

  await tx.sale.deleteMany({ where: { vendorId: userId } })
  await tx.eRPCustomer.deleteMany({ where: { vendorId: userId } })
  await tx.inventoryProduct.deleteMany({ where: { vendorId: userId } })
  await tx.supplier.deleteMany({ where: { vendorId: userId } })

  const vendorStores = await tx.store.findMany({
    where: { vendorId: userId },
    select: { id: true },
  })
  const vendorStoreIds = vendorStores.map((s) => s.id)
  if (vendorStoreIds.length > 0) {
    await tx.product.deleteMany({
      where: { storeId: { in: vendorStoreIds } },
    })
  }
  await tx.store.deleteMany({ where: { vendorId: userId } })
}
