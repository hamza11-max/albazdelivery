/**
 * Single source of truth for customer app labels (web + mobile).
 * Mobile app syncs from here via: npm run sync:customer-copy (from repo root).
 */
import data from './customer-copy.json';

export type CustomerCopy = typeof data;
export const customerCopy: CustomerCopy = data;
export default customerCopy;
