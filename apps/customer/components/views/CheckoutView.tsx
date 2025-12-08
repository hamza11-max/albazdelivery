import { useState } from 'react'
import { ShoppingCart, Trash2, Minus, Plus, Loader2 } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@albaz/ui'
import type { CheckoutViewProps } from '../../lib/types'
import { CartItemSkeleton } from '../ui/skeleton-loaders'
import { useErrorHandler } from '../../hooks/use-error-handler'
import { validateRequired } from '../../lib/validation'

export function CheckoutView({
  cart,
  products,
  subtotal,
  deliveryFee,
  total,
  promoCode,
  promoDiscount,
  promoError,
  paymentMethod,
  onPaymentMethodChange,
  onUpdateQuantity,
  onRemoveFromCart,
  onPlaceOrder,
  onContinueShopping,
  onApplyPromo,
  onClearPromo,
  t,
}: CheckoutViewProps) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const { handleError, handleValidationError } = useErrorHandler()
  const [promoInput, setPromoInput] = useState(promoCode || '')

  const handlePlaceOrder = async () => {
    // Validate cart
    if (cart.length === 0) {
      handleValidationError({ errors: [{ message: t('cart-empty', 'Votre panier est vide', 'سلتك فارغة') }] })
      return
    }

    // Validate payment method
    const paymentValidation = validateRequired(paymentMethod, t('payment-method', 'Mode de paiement', 'طريقة الدفع'))
    if (!paymentValidation.isValid) {
      handleValidationError(paymentValidation)
      return
    }

    setIsPlacingOrder(true)
    try {
      await onPlaceOrder()
    } catch (error) {
      handleError(error, { showToast: true })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  return (
    <div className="albaz-shell container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-3xl">
      <Button variant="ghost" onClick={onContinueShopping} className="mb-4">
        ← {t('continue-shopping', 'Continuer les achats', 'متابعة التسوق')}
      </Button>

      <h2 className="text-2xl font-bold mb-6 text-foreground">{t('my-cart', 'Mon Panier', 'سلتي')}</h2>

      {cart.length === 0 ? (
          <Card className="albaz-card">
            <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              {t('empty-cart', 'Votre panier est vide', 'سلتك فارغة')}
            </p>
            <Button onClick={onContinueShopping}>{t('start-shopping', 'Commencer vos achats', 'ابدأ التسوق')}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="albaz-card">
            <CardContent className="p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <CartItemSkeleton key={i} />
                  ))}
                </div>
              ) : (
                cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId)
                  if (!product) return null

                  return (
                  <div key={item.productId} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img src={product.image || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1 truncate text-foreground">{product.name}</h4>
                      <p className="text-sm text-[#1a4d1a] font-semibold">{product.price} DZD</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-transparent border-[#1a4d1a] text-[#1a4d1a] hover:bg-[#1a4d1a] hover:text-white"
                        onClick={() => onUpdateQuantity(item.productId, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-foreground">{item.quantity}</span>
                      <Button 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-[#1a4d1a] hover:bg-[#1a5d1a] text-white" 
                        onClick={() => onUpdateQuantity(item.productId, 1)}
                        aria-label={t('increase-quantity', 'Augmenter la quantité', 'زيادة الكمية')}
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold whitespace-nowrap text-foreground">{product.price * item.quantity} DZD</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveFromCart(item.productId)}
                        aria-label={t('remove-from-cart', 'Retirer du panier', 'إزالة من السلة')}
                        className="text-destructive hover:text-destructive h-auto p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="albaz-card">
            <CardHeader>
              <CardTitle>{t('order-summary', 'Résumé de la commande', 'ملخص الطلب')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('items-total', 'Total des articles', 'مجموع العناصر')}</span>
                <span>{subtotal} DZD</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('tax', 'Taxe', 'ضريبة')}</span>
                <span>0 DZD</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('delivery-fee', 'Frais de livraison', 'رسوم التوصيل')}</span>
                <span>{deliveryFee} DZD</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>{t('discount', 'Remise', 'خصم')}</span>
                  <span>-{promoDiscount} DZD</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-3 border-t">
                <span>{t('total', 'Total', 'المجموع')}</span>
                <span className="text-[#1a4d1a]">{total} DZD</span>
              </div>
            </CardContent>
          </Card>

          <Card className="albaz-card">
            <CardHeader>
              <CardTitle>{t('promo-code', 'Code promo', 'رمز ترويجي')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="flex-1 border rounded-md px-3 py-2 text-sm"
                  placeholder={t('enter-promo', 'Saisissez votre code promo', 'أدخل الرمز الترويجي')}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                />
                <Button onClick={() => onApplyPromo(promoInput.trim())} variant="default">
                  {t('apply', 'Appliquer', 'تطبيق')}
                </Button>
                {promoCode && (
                  <Button variant="outline" onClick={onClearPromo}>
                    {t('remove', 'Retirer', 'إزالة')}
                  </Button>
                )}
              </div>
              {promoError && <p className="text-sm text-destructive">{promoError}</p>}
              {promoCode && !promoError && promoDiscount > 0 && (
                <p className="text-sm text-green-700">
                  {t('promo-applied', `Code ${promoCode} appliqué`, `تم تطبيق الرمز ${promoCode}`)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="albaz-card">
            <CardHeader>
              <CardTitle>{t('payment-method', 'Mode de paiement', 'طريقة الدفع')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 p-4 border-2 border-[#1a4d1a] rounded-lg cursor-pointer bg-[#1a4d1a]/5">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => onPaymentMethodChange(e.target.value)}
                  className="w-4 h-4 text-[#1a4d1a]"
                />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {t('cash-on-delivery', 'Paiement à la Livraison', 'الدفع عند الاستلام')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('pay-cash', 'Payez en espèces lors de la réception', 'ادفع نقدًا عند الاستلام')}
                  </p>
                </div>
                <Badge className="bg-[#1a4d1a] text-white">{t('recommended', 'Recommandé', 'موصى به')}</Badge>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-not-allowed opacity-50">
                <input type="radio" name="payment" value="card" disabled className="w-4 h-4" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{t('credit-card', 'Carte Bancaire', 'بطاقة ائتمان')}</p>
                  <p className="text-sm text-muted-foreground">{t('coming-soon', 'Bientôt disponible', 'قريبًا')}</p>
                </div>
              </label>
            </CardContent>
          </Card>

          <Button 
            size="lg" 
            className="w-full text-lg rounded-full bg-[#1a4d1a] hover:bg-[#1a5d1a] text-white disabled:opacity-50" 
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || cart.length === 0}
          >
            {isPlacingOrder ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('processing', 'Traitement...', 'جاري المعالجة...')}
              </>
            ) : (
              `${t('pay-now', 'Payer Maintenant', 'ادفع الآن')} - ${total} DZD`
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

