"use client"

import { useState } from "react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

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
        throw new Error('Payment failed to initialize')
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
          title: "Paiement réussi",
          description: "Votre commande a été confirmée.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Erreur de paiement",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors du paiement",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Paiement de commande</CardTitle>
        <CardDescription>Entrez vos détails de paiement pour finaliser votre commande.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} id="payment-form" className="space-y-6">
          <div className="space-y-2">
            <Label>Détails de la carte</Label>
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
              <span>Sous-total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frais de livraison</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
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
              Traitement en cours...
            </>
          ) : (
            `Payer ${formatPrice(order.total)}`
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}