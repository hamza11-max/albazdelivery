'use client'

import { useEffect } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@albaz/ui'
import { useProfileI18n } from '../hooks/use-profile-i18n'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useProfileI18n()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/10 to-orange-500/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {t('error-title', 'Une erreur est survenue', 'حدث خطأ', 'Something went wrong')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(
              'error-desc',
              'L\'application a rencontré un problème. Vous pouvez réessayer ou retourner à l\'accueil.',
              'واجه التطبيق مشكلة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.',
              'The app hit a problem. You can try again or go back home.',
            )}
          </p>
          <div className="flex flex-col gap-2">
            <Button type="button" className="w-full" onClick={() => reset()}>
              {t('error-retry', 'Réessayer', 'إعادة المحاولة', 'Try again')}
            </Button>
            <Button type="button" variant="outline" className="w-full" asChild>
              <a href="/">{t('error-home', 'Accueil', 'الرئيسية', 'Home')}</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
