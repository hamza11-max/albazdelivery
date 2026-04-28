import { describe, it, expect, jest, beforeEach } from '@jest/globals'

const mockFindUnique = jest.fn() as jest.MockedFunction<(args: unknown) => Promise<unknown>>
const mockPaymentFindUnique = jest.fn() as jest.MockedFunction<(args: unknown) => Promise<unknown>>
const mockPaymentUpdate = jest.fn() as jest.MockedFunction<(args: unknown) => Promise<unknown>>
const mockPaymentCreate = jest.fn() as jest.MockedFunction<(args: unknown) => Promise<unknown>>

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: (args: unknown) => mockFindUnique(args),
    },
    payment: {
      findUnique: (args: unknown) => mockPaymentFindUnique(args),
      update: (args: unknown) => mockPaymentUpdate(args),
      create: (args: unknown) => mockPaymentCreate(args),
    },
  },
}))

describe('applyPaymentIntentSucceeded', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('creates COMPLETED payment when order exists and no payment row yet', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'ord_1',
      customerId: 'cust_1',
      total: 10,
      payment: null,
    })
    mockPaymentCreate.mockResolvedValue({ id: 'pay_1' })

    const { applyPaymentIntentSucceeded } = await import('@/lib/stripe-webhook-order-payments')
    await applyPaymentIntentSucceeded({
      id: 'pi_test',
      amount_received: 1000,
      metadata: { orderId: 'ord_1' },
    } as any)

    expect(mockPaymentCreate).toHaveBeenCalledWith({
      data: {
        orderId: 'ord_1',
        customerId: 'cust_1',
        amount: 10,
        method: 'CARD',
        status: 'COMPLETED',
        transactionId: 'pi_test',
        completedAt: expect.any(Date),
      },
    })
  })

  it('updates existing payment to COMPLETED', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'ord_1',
      customerId: 'cust_1',
      total: 10,
      payment: { id: 'pay_1', status: 'PENDING' },
    })
    mockPaymentUpdate.mockResolvedValue({ id: 'pay_1' })

    const { applyPaymentIntentSucceeded } = await import('@/lib/stripe-webhook-order-payments')
    await applyPaymentIntentSucceeded({
      id: 'pi_test',
      amount_received: 1000,
      metadata: { orderId: 'ord_1' },
    } as any)

    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'pay_1' },
      data: {
        status: 'COMPLETED',
        transactionId: 'pi_test',
        completedAt: expect.any(Date),
        amount: 10,
      },
    })
  })
})

describe('applyPaymentIntentFailed', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('marks existing payment FAILED', async () => {
    mockPaymentFindUnique.mockResolvedValue({
      id: 'pay_1',
      orderId: 'ord_1',
    })
    mockPaymentUpdate.mockResolvedValue({})

    const { applyPaymentIntentFailed } = await import('@/lib/stripe-webhook-order-payments')
    await applyPaymentIntentFailed({
      id: 'pi_x',
      amount: 500,
      metadata: { orderId: 'ord_1' },
    } as any)

    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { orderId: 'ord_1' },
      data: {
        status: 'FAILED',
        transactionId: 'pi_x',
      },
    })
  })
})
