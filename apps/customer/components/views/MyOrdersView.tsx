import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, Package, ShoppingCart } from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@albaz/ui'
import type { Order } from '@albaz/shared'
import type { MyOrdersViewProps } from '@/app/lib/types'

export function MyOrdersView({ customerId, onBack, onOrderSelect, t }: MyOrdersViewProps) {
  const [packageDeliveries, setPackageDeliveries] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'packages' | 'track'>('orders')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders?customerId=${customerId}`)
        const data = await response.json()
        if (data.success) {
          const orders = data.orders || []
          setAllOrders(orders.filter((o: Order) => !o.isPackageDelivery))
          setPackageDeliveries(orders.filter((o: Order) => o.isPackageDelivery))
        }
      } catch (error) {
        console.error('[v0] Error fetching orders:', error)
      }
    }

    fetchOrders()
  }, [customerId])

  const renderOrders = (
    orders: Order[],
    emptyIcon: ReactNode,
    emptyMessageKey: string,
    emptyMessageFr: string,
    emptyMessageAr: string,
  ) => {
    if (orders.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 text-muted-foreground">{emptyIcon}</div>
            <p className="text-muted-foreground">{t(emptyMessageKey, emptyMessageFr, emptyMessageAr)}</p>
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
                  <p className="font-bold text-primary">{order.total} DZD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-[57px] z-40 bg-background border-b border-border px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{t('my-orders', 'Mes Commandes', 'طلباتي')}</h1>
        </div>
      </div>

      <div className="sticky top-[105px] z-30 bg-background border-b border-border px-4 py-3 flex gap-2 overflow-x-auto">
        {['orders', 'packages', 'track'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab === 'orders'
              ? t('orders', 'Commandes', 'الطلبات')
              : tab === 'packages'
              ? t('my-packages', 'Mes Colis', 'حزمي')
              : t('track-order', 'Suivre Commande', 'تتبع الطلب')}
          </button>
        ))}
      </div>

      <div className="px-4 py-6">
        {activeTab === 'orders' &&
          renderOrders(allOrders, <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground" />, 'no-orders', 'Aucune commande', 'لا توجد طلبات')}

        {activeTab === 'packages' &&
          renderOrders(packageDeliveries, <Package className="w-12 h-12 mx-auto text-muted-foreground" />, 'no-packages', 'Aucun colis', 'لا توجد حزم')}

        {activeTab === 'track' && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t('enter-order-id', 'Entrez le numéro de commande', 'أدخل رقم الطلب')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('order-id-placeholder', 'Ex: ORD-123456', 'مثال: ORD-123456')}
                    className="bg-muted border-border w-full rounded-lg px-3 py-2"
                  />
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-primary-foreground font-bold py-6 rounded-full">
                  {t('track', 'Suivre', 'تتبع')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function formatStatus(status: string, t: MyOrdersViewProps['t']) {
  switch (status) {
    case 'DELIVERED':
      return t('delivered', 'Livrée', 'تم التوصيل')
    case 'IN_DELIVERY':
      return t('in-delivery', 'En Livraison', 'قيد التوصيل')
    default:
      return t('pending', 'En Attente', 'قيد الانتظار')
  }
}

function getStatusBadgeVariant(status: string) {
  if (status === 'DELIVERED') return 'bg-green-500'
  if (status === 'IN_DELIVERY') return 'bg-blue-500'
  return 'bg-yellow-500'
}

