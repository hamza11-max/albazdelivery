import { useState, useEffect, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Package, ShoppingCart, AlertCircle, Bell } from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@albaz/ui'
import type { Order } from '@albaz/shared'
import { customerCopy } from '@albaz/shared'
import type { MyOrdersViewProps } from '../../lib/types'
import { OrderListSkeleton } from '../ui/skeleton-loaders'
import { useOrdersQuery } from '../../hooks/use-orders-query'
import { useNotificationsQuery, type CustomerNotificationRow } from '../../hooks/use-notifications-query'
import { notificationsAPI } from '../../lib/api-client'

export function MyOrdersView({ customerId, onBack, onOrderSelect, t, ordersEntry = 'default' }: MyOrdersViewProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'packages' | 'track' | 'notifications'>('orders')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (ordersEntry === 'notifications') {
      setActiveTab('notifications')
    }
  }, [ordersEntry])

  const notificationsEnabled = activeTab === 'notifications'
  const {
    data: notifPayload,
    isLoading: notifLoading,
    error: notifError,
    refetch: refetchNotifications,
  } = useNotificationsQuery(notificationsEnabled, customerId)

  const invalidateNotificationQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }
  const [trackOrderId, setTrackOrderId] = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackError, setTrackError] = useState<string | null>(null)

  // Fetch orders using React Query
  const { data: orders = [], isLoading, error } = useOrdersQuery()

  // Separate orders by type
  const allOrders = orders.filter((o: Order) => !o.isPackageDelivery)
  const packageDeliveries = orders.filter((o: Order) => o.isPackageDelivery)

  const renderOrders = (
    orders: Order[],
    emptyIcon: ReactNode,
    emptyMessageKey: string,
    emptyMessageFr: string,
    emptyMessageAr: string,
    emptyMessageEn: string,
  ) => {
    if (orders.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 text-muted-foreground">{emptyIcon}</div>
            <p className="text-muted-foreground">{t(emptyMessageKey, emptyMessageFr, emptyMessageAr, emptyMessageEn)}</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {orders.map((order) => (
          <Card
            key={order.id}
            className="border-border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onOrderSelect(order)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusBadgeVariant(order.status)}>
                      {formatStatus(order.status, t)}
                    </Badge>
                    <span className="text-sm font-mono text-muted-foreground">#{order.id}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1a4d1a]">{order.total} DZD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="albaz-shell min-h-screen pb-20">
      <div className="sticky top-[57px] z-40 bg-[var(--albaz-surface)] border-b border-border px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">
            {t('my-orders', customerCopy.titles.dats, 'طلباتي', 'My orders')}
          </h1>
        </div>
      </div>

      <div className="sticky top-[105px] z-30 bg-[var(--albaz-surface)] border-b border-border px-4 py-3 flex gap-2 overflow-x-auto">
        {(['orders', 'packages', 'notifications', 'track'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === tab ? 'bg-[var(--albaz-olive)] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab === 'orders'
              ? t('orders', 'Commandes', 'الطلبات', 'Orders')
              : tab === 'packages'
                ? t('my-packages', 'Mes Colis', 'حزمي', 'My packages')
                : tab === 'notifications'
                  ? t('notifications-tab', 'Notifications', 'الإشعارات', 'Notifications')
                  : t('track-order', 'Suivre Commande', 'تتبع الطلب', 'Track order')}
          </button>
        ))}
      </div>

      <div className="px-4 py-6">
        {activeTab === 'track' ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t('enter-order-id', 'Entrez le numéro de commande', 'أدخل رقم الطلب', 'Enter order ID')}
                  </label>
                  <input
                    type="text"
                    placeholder={t(
                      'order-id-placeholder',
                      "Collez l'ID de la commande",
                      'الصق معرف الطلب',
                      'Paste order ID',
                    )}
                    value={trackOrderId}
                    onChange={(e) => {
                      setTrackOrderId(e.target.value.trim())
                      setTrackError(null)
                    }}
                    className="bg-muted border-border w-full rounded-lg px-3 py-2"
                  />
                </div>
                {trackError && (
                  <p className="text-sm text-destructive">{trackError}</p>
                )}
                <Button
                  className="w-full bg-[#1a4d1a] hover:bg-[#1a5d1a] text-white font-bold py-6 rounded-full"
                  disabled={!trackOrderId || trackLoading}
                  onClick={async () => {
                    if (!trackOrderId) return
                    setTrackError(null)
                    setTrackLoading(true)
                    try {
                      const res = await fetch(`/api/orders/${trackOrderId}`)
                      const data = await res.json()
                      if (data.success && data.order) {
                        onOrderSelect(data.order)
                      } else {
                        setTrackError(data.error?.message || t('order-not-found', 'Commande non trouvée', 'الطلب غير موجود', 'Order not found'))
                      }
                    } catch {
                      setTrackError(t('error', 'Erreur', 'خطأ', 'Error'))
                    } finally {
                      setTrackLoading(false)
                    }
                  }}
                >
                  {trackLoading ? t('loading', 'Chargement...', 'جاري التحميل...', 'Loading...') : t('track', 'Suivre', 'تتبع', 'Track')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : activeTab === 'notifications' ? (
          <>
            <div className="flex items-center justify-between gap-2 mb-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Bell className="w-4 h-4" aria-hidden />
                {(notifPayload?.unreadCount ?? 0) > 0
                  ? t(
                      'notifications-unread-count',
                      `${notifPayload?.unreadCount} non lue(s)`,
                      `${notifPayload?.unreadCount} غير مقروءة`,
                      `${notifPayload?.unreadCount} unread`,
                    )
                  : t('notifications-all-read', 'Aucune non lue', 'لا يوجد غير مقروء', 'All caught up')}
              </p>
              {(notifPayload?.notifications.some((n) => !n.isRead) ?? false) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={async () => {
                    try {
                      await notificationsAPI.markAllAsRead()
                      invalidateNotificationQueries()
                      refetchNotifications()
                    } catch {
                      /* optional toast */
                    }
                  }}
                >
                  {t('notifications-mark-all', 'Tout marquer lu', 'تعليم الكل كمقروء', 'Mark all read')}
                </Button>
              )}
            </div>
            {notifLoading ? (
              <OrderListSkeleton />
            ) : notifError ? (
              <Card>
                <CardContent className="p-8 text-center space-y-3">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <p className="text-muted-foreground">{notifError instanceof Error ? notifError.message : String(notifError)}</p>
                  <Button onClick={() => refetchNotifications()}>{t('retry', 'Réessayer', 'إعادة المحاولة', 'Retry')}</Button>
                </CardContent>
              </Card>
            ) : !notifPayload?.notifications.length ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {t('notifications-empty', 'Aucune notification', 'لا توجد إشعارات', 'No notifications yet')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifPayload.notifications.map((n) => (
                  <NotificationRowCard
                    key={n.id}
                    n={n}
                    t={t}
                    onOpen={async () => {
                      await openNotification(n, onOrderSelect, invalidateNotificationQueries, refetchNotifications)
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : isLoading ? (
          <OrderListSkeleton />
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">{t('error', 'Erreur', 'خطأ', 'Error')}</h3>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => window.location.reload()}>{t('retry', 'Réessayer', 'إعادة المحاولة', 'Retry')}</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeTab === 'orders' &&
              renderOrders(
                allOrders,
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground" />,
                'no-orders',
                customerCopy.empty.noOrders,
                'لا توجد طلبات',
                'No orders yet',
              )}

            {activeTab === 'packages' &&
              renderOrders(packageDeliveries, <Package className="w-12 h-12 mx-auto text-muted-foreground" />, 'no-packages', 'Aucun colis', 'لا توجد حزم', 'No packages yet')}
          </>
        )}
      </div>
    </div>
  )
}

async function openNotification(
  n: CustomerNotificationRow,
  onOrderSelect: (order: Order) => void,
  invalidateNotificationQueries: () => void,
  refetchNotifications: () => void,
) {
  if (!n.isRead && n.id) {
    try {
      await notificationsAPI.markAsRead(n.id)
      invalidateNotificationQueries()
      refetchNotifications()
    } catch {
      /* still allow opening order */
    }
  }
  if (n.relatedOrderId) {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(n.relatedOrderId)}`)
      const data = await res.json()
      if (data.success && data.order) {
        onOrderSelect(data.order)
      }
    } catch {
      /* ignore */
    }
  }
}

function NotificationRowCard({
  n,
  t,
  onOpen,
}: {
  n: CustomerNotificationRow
  t: MyOrdersViewProps['t']
  onOpen: () => void | Promise<void>
}) {
  return (
    <Card
      className={`border-border transition-shadow cursor-pointer ${n.isRead ? 'opacity-90' : 'ring-1 ring-[var(--albaz-olive)]/40'}`}
      onClick={() => void onOpen()}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{n.title}</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{n.message}</p>
            <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
          {!n.isRead ? (
            <span className="shrink-0 h-2 w-2 rounded-full bg-[var(--albaz-orange)]" aria-hidden />
          ) : null}
        </div>
        {n.relatedOrderId ? (
          <p className="text-xs text-[var(--albaz-olive)] mt-2 font-medium">
            {t('notifications-tap-order', 'Appuyez pour voir la commande', 'اضغط لعرض الطلب', 'Tap to view order')}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function formatStatus(status: string, t: MyOrdersViewProps['t']) {
  const s = String(status).toUpperCase()
  switch (s) {
    case 'DELIVERED':
      return t('delivered', 'Livrée', 'تم التوصيل', 'Delivered')
    case 'IN_DELIVERY':
      return t('in-delivery', 'En Livraison', 'قيد التوصيل', 'Out for delivery')
    case 'CANCELLED':
      return t('cancelled', 'Annulée', 'ملغاة', 'Cancelled')
    case 'PENDING':
      return t('pending', 'En Attente', 'قيد الانتظار', 'Pending')
    case 'ACCEPTED':
      return t('accepted', 'Acceptée', 'مقبولة', 'Accepted')
    case 'PREPARING':
      return t('preparing', 'En Préparation', 'قيد التحضير', 'Preparing')
    case 'READY':
      return t('ready', 'Prête', 'جاهزة', 'Ready')
    case 'ASSIGNED':
      return t('assigned', 'Assignée', 'معينة', 'Assigned')
    default:
      return t('pending', 'En Attente', 'قيد الانتظار', 'Pending')
  }
}

function getStatusBadgeVariant(status: string) {
  const s = String(status).toUpperCase()
  if (s === 'DELIVERED') return 'bg-green-500'
  if (s === 'IN_DELIVERY' || s === 'ASSIGNED') return 'bg-blue-500'
  if (s === 'CANCELLED') return 'bg-red-500'
  if (s === 'ACCEPTED' || s === 'PREPARING' || s === 'READY') return 'bg-amber-500'
  return 'bg-yellow-500'
}

