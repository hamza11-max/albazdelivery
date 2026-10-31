import { PosError } from './errors'
import { assertMoney, type Money } from './money'

export type PaymentMethod = 'CASH' | 'CARD_EXTERNAL'

export interface Tender {
  method: PaymentMethod
  amount: Money
}

export interface Settlement {
  /** Σ tendered */
  paidTotal: Money
  cashTendered: Money
  cardTotal: Money
  /** Always given in cash. */
  change: Money
  /** Cash that stays in the drawer: cashTendered − change. */
  cashKept: Money
}

/**
 * Settles a sale. Rules:
 * - card payments (recorded from an external terminal) can never exceed the
 *   total, because change is only given in cash;
 * - cash + card must cover the total;
 * - change = paid − total, and cannot exceed the cash handed over.
 */
export function settle(total: Money, tenders: readonly Tender[]): Settlement {
  assertMoney(total, 'total')
  let cashTendered = 0
  let cardTotal = 0
  tenders.forEach((t, i) => {
    assertMoney(t.amount, `tenders[${i}].amount`)
    if (t.amount === 0) throw new PosError('INVALID_MONEY', `tenders[${i}].amount must be more than 0`)
    if (t.method === 'CASH') cashTendered += t.amount
    else if (t.method === 'CARD_EXTERNAL') cardTotal += t.amount
    else throw new PosError('INVALID_MONEY', `tenders[${i}] has unknown method`)
  })

  if (cardTotal > total) {
    throw new PosError('CARD_OVERPAYMENT', `Card payments ${cardTotal} exceed the total ${total}`)
  }
  const paidTotal = cashTendered + cardTotal
  if (paidTotal < total) {
    throw new PosError('INSUFFICIENT_PAYMENT', `Paid ${paidTotal} of ${total}`)
  }
  const change = paidTotal - total
  return { paidTotal, cashTendered, cardTotal, change, cashKept: cashTendered - change }
}
