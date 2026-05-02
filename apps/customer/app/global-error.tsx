'use client'

import { useEffect } from 'react'
import { useProfileI18n } from '../hooks/use-profile-i18n'

/**
 * Root-level error UI when the root layout fails. Must define html + body.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <GlobalErrorInner error={error} reset={reset} />
      </body>
    </html>
  )
}

function GlobalErrorInner({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useProfileI18n()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-semibold mb-2">{t('error-title', 'Une erreur est survenue', 'حدث خطأ', 'Something went wrong')}</h1>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        {t(
          'global-error-desc',
          'Le chargement de l\'application a échoué. Réessayez ou rechargez la page.',
          'فشل تحميل التطبيق. حاول مرة أخرى أو أعد تحميل الصفحة.',
          'The app failed to load. Try again or reload the page.',
        )}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          type="button"
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          onClick={() => reset()}
        >
          {t('error-retry', 'Réessayer', 'إعادة المحاولة', 'Try again')}
        </button>
        <button
          type="button"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
          onClick={() => typeof window !== 'undefined' && window.location.reload()}
        >
          {t('global-error-reload', 'Recharger', 'إعادة التحميل', 'Reload')}
        </button>
      </div>
    </div>
  )
}
