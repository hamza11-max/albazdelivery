'use client';

export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Commande réussie',
  description: 'Votre commande a été confirmée avec succès',
};

interface SuccessPageProps {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Page({ searchParams }: SuccessPageProps) {
  const router = useRouter();

  // Example placeholder order (replace with actual API fetch if needed)
  const orderId = searchParams.orderId as string || 'test_order_123';
  const orderTotal = 26.98;
  const paymentMethod = 'Paiement à la livraison';
  const status = 'En attente de livraison';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-semibold">Commande confirmée 🎉</CardTitle>
          <CardDescription>
            Merci pour votre achat ! Votre commande <strong>{orderId}</strong> est en cours de traitement.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="border rounded-md p-3 text-left text-sm space-y-1 bg-muted/30">
            <p><strong>Montant total :</strong> {orderTotal.toFixed(2)} €</p>
            <p><strong>Mode de paiement :</strong> {paymentMethod}</p>
            <p><strong>Statut :</strong> {status}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Vous recevrez une confirmation par email ou SMS lorsque votre commande sera prête à être livrée.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button onClick={() => router.push('/')} className="w-full">
            Retour à l’accueil
          </Button>
          <Button onClick={() => router.push('/orders')} variant="outline" className="w-full">
            Voir mes commandes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
