import Link from 'next/link'

export default function StorefrontNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold text-slate-900">
          Storefront not found
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          This storefront is inactive, hasn&apos;t been claimed, or its custom
          domain is not yet verified. Check the URL or come back soon.
        </p>
        <Link
          href="https://al-baz.app"
          className="mt-6 inline-block rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Visit AlBaz Delivery
        </Link>
      </div>
    </div>
  )
}
