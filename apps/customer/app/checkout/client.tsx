"use client"

import { useState } from "react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Label, useToast } from "@albaz/ui"
import { Loader2 } from "lucide-react"
import { formatPrice } from "@albaz/shared/utils"
import { useProfileI18n } from "../../hooks/use-profile-i18n"

interface CheckoutOrder {
  id: string;
  items: {
    id: number;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

interface CheckoutPageProps {
  order: CheckoutOrder;
}

export function CheckoutPage({ order }: CheckoutPageProps) {
  const t = useProfileI18n()
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      // Get client secret from server
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.total,
        }),
      })

      const { clientSecret } = await response.json()

      if (!clientSecret) {
        throw new Error(
          t(
            "checkout-init-failed",
            "Impossible d'initialiser le paiement",
            "تعذّر بدء الدفع",
            "Payment failed to initialize",
          ),
        )
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (paymentIntent.status === "succeeded") {
        toast({
          title: t("checkout-success-title", "Paiement réussi", "تم الدفع بنجاح", "Payment successful"),
          description: t(
            "checkout-success-desc",
            "Votre commande a été confirmée.",
            "تم تأكيد طلبك.",
            "Your order has been confirmed.",
          ),
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: t("checkout-error-title", "Erreur de paiement", "خطأ في الدفع", "Payment error"),
        description:
          error instanceof Error
            ? error.message
            : t(
                "checkout-error-generic",
                "Une erreur s'est produite lors du paiement",
                "حدث خطأ أثناء الدفع",
                "Something went wrong while processing payment",
              ),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>
          {t("checkout-stripe-title", "Paiement de commande", "دفع الطلب", "Order payment")}
        </CardTitle>
        <CardDescription>
          {t(
            "checkout-stripe-desc",
            "Entrez vos détails de paiement pour finaliser votre commande.",
            "أدخل بيانات الدفع لإتمام طلبك.",
            "Enter your payment details to complete your order.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} id="payment-form" className="space-y-6">
          <div className="space-y-2">
            <Label>
              {t("checkout-card-details", "Détails de la carte", "تفاصيل البطاقة", "Card details")}
            </Label>
            <CardElement 
              id="card-element"
              className="p-3 border rounded-md"
              onChange={(e) => setCardComplete(e.complete)}
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    fontSmoothing: 'antialiased',
                  },
                },
              }}
              data-testid="card-number-input"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>{t("checkout-subtotal", "Sous-total", "المجموع الفرعي", "Subtotal")}</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t("checkout-delivery-fee", "Frais de livraison", "رسوم التوصيل", "Delivery fee")}</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>{t("checkout-total", "Total", "الإجمالي", "Total")}</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          type="submit"
          form="payment-form"
          className="w-full"
          disabled={!stripe || !cardComplete || isLoading}
          data-testid="pay-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("checkout-processing", "Traitement en cours...", "جاري المعالجة...", "Processing...")}
            </>
          ) : (
            `${t("checkout-pay", "Payer", "ادفع", "Pay")} ${formatPrice(order.total)}`
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}