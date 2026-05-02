import type { TranslationFn } from './types'

function norm(s?: string | null): string {
  return String(s ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
}

export function formatSupportTicketStatus(t: TranslationFn, raw?: string | null): string {
  const u = norm(raw)
  if (!u) return '—'
  switch (u) {
    case 'OPEN':
      return t('ticket-status-open', 'Ouvert', 'مفتوح', 'Open')
    case 'IN_PROGRESS':
      return t('ticket-status-progress', 'En cours', 'قيد المعالجة', 'In progress')
    case 'RESOLVED':
      return t('ticket-status-resolved', 'Résolu', 'تم الحل', 'Resolved')
    case 'CLOSED':
      return t('ticket-status-closed', 'Fermé', 'مغلق', 'Closed')
    default:
      return raw ?? u
  }
}

export function formatSupportTicketPriority(t: TranslationFn, raw?: string | null): string {
  const u = norm(raw)
  if (!u) return '—'
  switch (u) {
    case 'LOW':
      return t('ticket-priority-low', 'Basse', 'منخفضة', 'Low')
    case 'MEDIUM':
      return t('ticket-priority-medium', 'Normale', 'متوسطة', 'Medium')
    case 'HIGH':
      return t('ticket-priority-high', 'Haute', 'عالية', 'High')
    case 'URGENT':
      return t('ticket-priority-urgent', 'Urgente', 'عاجلة', 'Urgent')
    default:
      return raw ?? u
  }
}

export function formatPaymentStatus(t: TranslationFn, raw?: string | null): string {
  const u = norm(raw)
  if (!u) return '—'
  switch (u) {
    case 'PENDING':
      return t('pay-status-pending', 'En attente', 'قيد الانتظار', 'Pending')
    case 'COMPLETED':
      return t('pay-status-completed', 'Complété', 'مكتمل', 'Completed')
    case 'FAILED':
      return t('pay-status-failed', 'Échoué', 'فشل', 'Failed')
    case 'REFUNDED':
      return t('pay-status-refunded', 'Remboursé', 'مسترد', 'Refunded')
    default:
      return raw ?? u
  }
}

export function formatPaymentMethod(t: TranslationFn, raw?: string | null): string {
  const u = norm(raw)
  if (!u) return '—'
  switch (u) {
    case 'CASH':
      return t('pay-method-cash', 'Espèces', 'نقداً', 'Cash')
    case 'CARD':
      return t('pay-method-card', 'Carte', 'بطاقة', 'Card')
    case 'WALLET':
      return t('pay-method-wallet', 'Portefeuille', 'محفظة', 'Wallet')
    default:
      return raw ?? u
  }
}

export function formatLoyaltyTransactionType(t: TranslationFn, raw?: string | null): string {
  const u = norm(raw)
  if (!u) return '—'
  switch (u) {
    case 'EARN':
      return t('loyalty-tx-earn', 'Gagné', 'مكتسب', 'Earned')
    case 'REDEEM':
      return t('loyalty-tx-redeem', 'Utilisé', 'مُسترد', 'Redeemed')
    default:
      return raw ?? u
  }
}

export function formatMembershipTier(t: TranslationFn, raw?: string | null): string {
  const u = norm(raw)
  if (!u) return '—'
  switch (u) {
    case 'BRONZE':
      return t('tier-bronze', 'Bronze', 'برونزي', 'Bronze')
    case 'SILVER':
      return t('tier-silver', 'Argent', 'فضي', 'Silver')
    case 'GOLD':
      return t('tier-gold', 'Or', 'ذهبي', 'Gold')
    case 'PLATINUM':
      return t('tier-platinum', 'Platine', 'بلاتيني', 'Platinum')
    default:
      return raw ?? u
  }
}
