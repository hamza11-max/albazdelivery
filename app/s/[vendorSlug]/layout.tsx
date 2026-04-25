import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { resolveStorefrontTenant } from '@/lib/domains/resolve-tenant-from-headers'
import { StorefrontCartProvider } from './_storefront/StorefrontCartProvider'
import { StorefrontHeader } from './_storefront/StorefrontHeader'
import { StorefrontFooter } from './_storefront/StorefrontFooter'

export const dynamic = 'force-dynamic'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ vendorSlug: string }>
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { vendorSlug } = await params
  const tenant = await resolveStorefrontTenant(vendorSlug)
  if (!tenant) {
    return {
      title: 'Storefront not found',
      description: 'This storefront does not exist or has not been activated.',
    }
  }
  const { vendor } = tenant
  return {
    title: vendor.storefrontTagline
      ? `${vendor.name} — ${vendor.storefrontTagline}`
      : vendor.name,
    description:
      vendor.storefrontTagline ||
      `Order from ${vendor.name} — fast delivery powered by AlBaz.`,
    openGraph: {
      title: vendor.name,
      description: vendor.storefrontTagline || '',
      images: vendor.storefrontHeroUrl ? [vendor.storefrontHeroUrl] : [],
    },
  }
}

export default async function StorefrontLayout({
  children,
  params,
}: LayoutProps) {
  const { vendorSlug } = await params
  const tenant = await resolveStorefrontTenant(vendorSlug)

  if (!tenant) {
    notFound()
  }

  const { vendor } = tenant
  const accent = vendor.storefrontAccentColor || '#0f172a'

  return (
    <div
      className="flex min-h-screen flex-col bg-white text-slate-900"
      style={{
        // Expose the vendor's accent color as a CSS var for styled accents
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        ['--storefront-accent' as unknown as string]: accent,
      }}
    >
      <StorefrontCartProvider vendorId={vendor.id} vendorSlug={vendorSlug}>
        <StorefrontHeader
          vendor={{
            id: vendor.id,
            name: vendor.name,
            logoUrl: vendor.storefrontLogoUrl,
            tagline: vendor.storefrontTagline,
            accent,
          }}
          vendorSlug={vendorSlug}
        />

        <main className="flex-1">
          <Suspense fallback={<StorefrontLoading />}>{children}</Suspense>
        </main>

        <StorefrontFooter
          vendor={{
            name: vendor.name,
            city: vendor.city,
            address: vendor.address,
            whatsappPhone:
              vendor.storefrontWhatsappPhone || vendor.phone || null,
          }}
        />
      </StorefrontCartProvider>

      {/* SEO: canonical link back to the storefront. */}
      <Link rel="canonical" href={tenant.previewUrl} className="hidden" />
    </div>
  )
}

function StorefrontLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-slate-500">
      Loading...
    </div>
  )
}
