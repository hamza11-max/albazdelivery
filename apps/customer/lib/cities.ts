/**
 * Cities used for store filtering and delivery fee quotes in the customer app.
 * Replace with API-driven list when backend exposes coverage zones.
 */
export const CUSTOMER_DELIVERY_CITIES = ['Alger', 'Ouargla', 'Ghardaïa', 'Tamanrasset'] as const

export type CustomerDeliveryCity = (typeof CUSTOMER_DELIVERY_CITIES)[number]

/** Mutable copy for UI (select values, state init). */
export const cities: string[] = [...CUSTOMER_DELIVERY_CITIES]
