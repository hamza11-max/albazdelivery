interface FooterProps {
  vendor: {
    name: string
    city: string | null
    address: string | null
    whatsappPhone: string | null
  }
}

export function StorefrontFooter({ vendor }: FooterProps) {
  const waHref = vendor.whatsappPhone
    ? `https://wa.me/${vendor.whatsappPhone.replace(/\D/g, '')}`
    : null

  return (
    <footer className="mt-12 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-600">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium text-slate-900">{vendor.name}</p>
            {vendor.address || vendor.city ? (
              <p className="mt-0.5 text-xs text-slate-500">
                {[vendor.address, vendor.city].filter(Boolean).join(', ')}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-700 underline-offset-2 hover:underline"
              >
                Contact via WhatsApp
              </a>
            ) : null}
            <a
              href="https://al-baz.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700"
            >
              Powered by AlBaz Delivery
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
