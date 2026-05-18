import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AlBaz — Livraison, POS vendeur et boutiques en ligne',
  description:
    'Plateforme de livraison pour l’Algérie : commandes clients, tableau de bord vendeur, vitrines en ligne et flotte livreurs.',
  openGraph: {
    title: 'AlBaz — Livraison & commerce local',
    description:
      'Commandez, vendez et livrez avec une seule plateforme. Essai Pro 14 jours pour les commerçants.',
    type: 'website',
  },
}

export default function LiveMarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div lang="fr" className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {children}
    </div>
  )
}

