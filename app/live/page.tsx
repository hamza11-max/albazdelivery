import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Bike,
  Globe,
  MessageCircle,
  ShoppingBag,
  Store,
  Truck,
  Users,
} from 'lucide-react'

const PLATFORM_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'https://al-baz.app'

const audiences = [
  {
    title: 'Clients',
    description:
      'Parcourez les commerces, passez commande et suivez la livraison depuis l’application.',
    icon: Users,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    title: 'Commerçants',
    description:
      'POS, stock, commandes WhatsApp et vitrine publique sur votre sous-domaine.',
    icon: Store,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    title: 'Livreurs',
    description:
      'Rejoignez la flotte, acceptez les courses et connectez-vous aux vendeurs partenaires.',
    icon: Bike,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
] as const

const highlights = [
  {
    title: 'Boutique en ligne',
    description: 'Chaque vendeur publie sa vitrine sur {slug}.al-baz.app.',
    icon: Globe,
  },
  {
    title: 'Commandes WhatsApp',
    description: 'Notifications et flux commande intégrés au tableau de bord vendeur.',
    icon: MessageCircle,
  },
  {
    title: 'Essai Pro 14 jours',
    description: 'Fonctions avancées sans carte — idéal pour tester avant engagement.',
    icon: ShoppingBag,
  },
  {
    title: 'Livraison locale',
    description: 'Une plateforme pensée pour le commerce et la livraison en Algérie.',
    icon: Truck,
  },
] as const

export default function LiveLandingPage() {
  return (
    <>
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/live" className="flex items-center gap-2 font-semibold tracking-tight">
            <img
              src="/logo.png"
              alt="AlBaz"
              className="h-9 w-auto"
              width={120}
              height={36}
            />
            <span className="hidden text-slate-800 sm:inline">AlBaz</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href={PLATFORM_APP_URL}>Application</Link>
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/signup">Devenir vendeur</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-emerald-50/80 via-white to-white px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-700">
              Commerce & livraison
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Une plateforme pour vendre, commander et livrer
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              AlBaz relie clients, commerçants et livreurs : point de vente,
              vitrine en ligne sur{' '}
              <span className="font-mono text-sm text-emerald-800">
                votre-boutique.al-baz.app
              </span>
              , et gestion des commandes au même endroit.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
                asChild
              >
                <Link href="/signup">Créer un compte vendeur</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href={PLATFORM_APP_URL}>Ouvrir l&apos;application</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-2xl font-semibold text-slate-900 sm:text-3xl">
            Pour qui ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Trois parcours, une infrastructure commune.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {audiences.map(({ title, description, icon: Icon, color, bg }) => (
              <Card key={title} className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div
                    className={`mb-2 inline-flex rounded-lg p-2.5 ${bg}`}
                    aria-hidden
                  >
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription className="text-base">{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-semibold text-slate-900 sm:text-3xl">
              Fonctionnalités clés
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map(({ title, description, icon: Icon }) => (
                <Card key={title} className="border-slate-200">
                  <CardContent className="pt-6">
                    <Icon className="mb-3 h-8 w-8 text-emerald-600" aria-hidden />
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="mt-4 text-slate-600">
            Inscrivez-vous en tant que commerçant. Après validation admin, configurez
            votre sous-domaine et partagez votre lien de commande.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-emerald-600 hover:bg-emerald-700"
            asChild
          >
            <Link href="/signup">Commencer l&apos;inscription</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-100/80 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-600 sm:flex-row">
          <p>© {new Date().getFullYear()} AlBaz. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href={PLATFORM_APP_URL} className="hover:text-emerald-700">
              al-baz.app
            </Link>
            <Link href="/signup" className="hover:text-emerald-700">
              Inscription
            </Link>
            <Link href="/login" className="hover:text-emerald-700">
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}
