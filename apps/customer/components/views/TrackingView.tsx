import { CheckCircle2, Package, Truck } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@albaz/ui'
import type { TrackingViewProps } from '@/app/lib/types'

export function TrackingView({ currentOrder, orderId, onBackHome, t }: TrackingViewProps) {
  const getStepFromStatus = (status: string) => {
    switch (status) {
      case 'pending':
      case 'accepted':
        return 1
      case 'preparing':
        return 2
      case 'ready':
      case 'assigned':
      case 'IN_DELIVERY':
        return 3
      case 'DELIVERED':
        return 4
      default:
        return 1
    }
  }

  const currentStep = currentOrder ? getStepFromStatus(currentOrder.status) : 1

  const stepDefinitions = [
    { id: 1, label: t('order-accepted', 'Commande Acceptée', 'تم قبول الطلب'), icon: CheckCircle2 },
    { id: 2, label: t('preparing', 'En Préparation', 'قيد التحضير'), icon: Package },
    { id: 3, label: t('in-delivery', 'En Livraison', 'قيد التوصيل'), icon: Truck },
    { id: 4, label: t('delivered', 'Livrée', 'تم التوصيل'), icon: CheckCircle2 },
  ]

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl pb-24">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-[#1a4d1a]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#1a4d1a]" />
          </div>
          <CardTitle className="text-2xl mb-2 text-foreground">
            {currentOrder?.status === 'DELIVERED'
              ? t('order-delivered', 'Commande Livrée!', 'تم توصيل الطلب!')
              : t('order-confirmed', 'Commande Confirmée!', 'تم تأكيد الطلب!')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('order-number', 'Numéro de commande', 'رقم الطلب')}: <span className="font-mono font-semibold">{orderId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {currentOrder && (
            <div className="bg-[#1a4d1a]/5 border border-[#1a4d1a]/20 rounded-lg p-4 text-center">
              <p className="text-sm font-semibold text-[#1a4d1a]">{getStatusText(currentOrder.status, t)}</p>
            </div>
          )}

          <div className="space-y-6">
            {stepDefinitions.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep >= step.id
              const isCurrent = currentStep === step.id
              const isLast = index === stepDefinitions.length - 1

              return (
                <div key={step.id} className="relative">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive ? 'bg-[#1a4d1a] text-white scale-110' : 'bg-muted text-muted-foreground'
                      } ${isCurrent ? 'ring-4 ring-[#1a4d1a]/20' : ''}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'} ${isCurrent ? 'text-[#1a4d1a]' : ''}`}>
                        {step.label}
                      </p>
                      {isCurrent && <p className="text-xs text-muted-foreground mt-1">{t('in-progress', 'En cours...', 'جاري...')}</p>}
                    </div>
                  </div>
                  {!isLast && <div className={`absolute left-6 top-12 w-0.5 h-6 transition-all ${isActive ? 'bg-[#1a4d1a]' : 'bg-border'}`} />}
                </div>
              )
            })}
          </div>

          {currentOrder && (
            <div className="bg-muted rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-foreground">{t('order-details', 'Détails de la commande', 'تفاصيل الطلب')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('total', 'Total', 'المجموع')}</span>
                  <span className="font-semibold text-foreground">{currentOrder.total} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payment', 'Paiement', 'الدفع')}</span>
                  <span className="font-semibold text-foreground">
                    {currentOrder.paymentMethod === 'CASH' ? t('cash', 'Espèces', 'نقدي') : t('card', 'Carte', 'بطاقة')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('delivery', 'Livraison', 'التوصيل')}</span>
                  <span className="font-semibold text-foreground">{currentOrder.city}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-muted rounded-lg p-6 text-center">
            <p className="text-lg font-semibold mb-2 text-foreground">{t('thank-you', 'Merci pour votre commande!', 'شكرا لطلبك!')}</p>
            <p className="text-muted-foreground">
              {t(
                'delivery-message',
                'Votre commande sera livrée dans les plus brefs délais. Vous pouvez payer en espèces à la livraison.',
                'سيتم توصيل طلبك في أقرب وقت ممكن. يمكنك الدفع نقدًا عند الاستلام.'
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onBackHome}>
              {t('back-home', "Retour à l'accueil", 'العودة إلى الصفحة الرئيسية')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getStatusText(status: string, t: TrackingViewProps['t']) {
  switch (status) {
    case 'pending':
      return t('status-pending', "En attente d'acceptation par le restaurant", 'في انتظار قبول المطعم')
    case 'accepted':
      return t('status-accepted', 'Commande acceptée par le restaurant', 'تم قبول الطلب من قبل المطعم')
    case 'preparing':
      return t('status-preparing', 'Votre commande est en cours de préparation', 'طلبك قيد التحضير')
    case 'ready':
      return t('status-ready', 'Commande prête, en attente d’un livreur', 'الطلب جاهز، في انتظار السائق')
    case 'assigned':
      return t('status-assigned', 'Un livreur a été assigné à votre commande', 'تم تعيين سائق لطلبك')
    case 'IN_DELIVERY':
      return t('status-in-delivery', 'Votre commande est en cours de livraison', 'طلبك قيد التوصيل')
    case 'DELIVERED':
      return t('status-delivered', 'Commande livrée avec succès', 'تم توصيل الطلب بنجاح')
    default:
      return t('status-unknown', 'Statut inconnu', 'حالة غير معروفة')
  }
}

