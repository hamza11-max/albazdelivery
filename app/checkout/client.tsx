'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface CheckoutOrderItem {
  id: number
  name: string
  price: number
  quantity: number
}

export interface CheckoutOrder {
  id: string
  items: CheckoutOrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
}

interface CheckoutPageProps {
  order: CheckoutOrder | null
}

export function CheckoutPage({ order }: CheckoutPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: '',
  })
  const { toast } = useToast()
  const router = useRouter()

  // ✅ Null check for order
  if (!order) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground">Commande introuvable.</p>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de la création de la commande')
      }

      toast({
        title: 'Commande confirmée',
        description: 'Votre commande a été enregistrée avec succès.',
      })

      // ✅ Redirect to success page with orderId
      router.push(`/checkout/success?orderId=${result.order?.id ?? order.id}`)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Une erreur s'est produite lors de l'enregistrement de la commande.",
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Finaliser la commande</CardTitle>
        <CardDescription>
          Remplissez les détails ci-dessous pour compléter votre commande.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              name="name"
              placeholder="Entrez votre nom complet"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Ex: +213 6 12 34 56 78"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse de livraison</Label>
            <Input
              id="address"
              name="address"
              placeholder="Entrez votre adresse complète"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Méthode de paiement</Label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              title="Sélectionnez une méthode de paiement"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full border rounded-md p-2 bg-background text-foreground"
              required
            >
              <option value="">Choisir une méthode</option>
              <option value="cash">Paiement à la livraison</option>
              <option value="bank">Virement bancaire</option>
            </select>
          </div>

          <div className="space-y-1.5 pt-4 border-t">
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              `Confirmer la commande (${formatPrice(order.total)})`
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="text-center text-sm text-muted-foreground">
        Votre commande sera confirmée et payée à la livraison.
      </CardFooter>
    </Card>
  )
}
