export type PosErrorCode =
  | 'INVALID_MONEY'
  | 'INVALID_QUANTITY'
  | 'DISCOUNT_TOO_LARGE'
  | 'EMPTY_CART'
  | 'INSUFFICIENT_PAYMENT'
  | 'CARD_OVERPAYMENT'
  | 'RETURN_EXCEEDS_SOLD'
  | 'UNKNOWN_LINE'
  | 'NEGATIVE_STOCK'
  | 'INVALID_MOVEMENT'
  | 'REASON_REQUIRED'

/** Business-rule violation. `code` is stable for UI messages and tests; `message` is for logs. */
export class PosError extends Error {
  constructor(
    readonly code: PosErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'PosError'
  }
}
