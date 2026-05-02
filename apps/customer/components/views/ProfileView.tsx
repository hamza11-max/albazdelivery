import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, ChevronRight, CreditCard, Gift, Globe, Heart, LogOut, MapPin, MessageCircle, Shield, Star, User, AlertCircle, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@albaz/ui'
import type { ProfileViewProps } from '../../lib/types'
import { Skeleton } from '../ui/skeleton'
import { useErrorHandler } from '../../hooks/use-error-handler'

export function ProfileView({ user, selectedLanguage, onSelectLanguage, onBackHome, onSignOut, onOpenFavorites, t }: ProfileViewProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { handleError } = useErrorHandler()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await onSignOut()
    } catch (error) {
      handleError(error, { showToast: true })
      setIsSigningOut(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl flex items-center justify-center min-h-screen">
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {t("user-not-found", "Utilisateur non trouvé", "المستخدم غير موجود", "User not found")}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t(
                "user-not-found-desc",
                "Impossible de charger les informations utilisateur",
                "تعذر تحميل معلومات المستخدم",
                "Could not load user information",
              )}
            </p>
            <Button onClick={onBackHome}>
              {t("back-home", "Retour à l'accueil", "العودة إلى الصفحة الرئيسية", "Back to home")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="albaz-shell container mx-auto px-4 py-6 pb-24 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBackHome} className="hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {t("profile", "Profil", "الملف الشخصي", "Profile")}
        </h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-[var(--albaz-olive)] flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  {user?.name || t("user", "Utilisateur", "مستخدم", "User")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {user?.email || t("no-email", "Aucun email", "لا يوجد بريد إلكتروني", "No email")}
                </p>
              </div>
            </div>
            <Link href="/profile/edit">
              <Button variant="outline" className="w-full bg-transparent">
                {t("edit-profile", "Modifier le profil", "تعديل الملف الشخصي", "Edit profile")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings", "Paramètres", "الإعدادات", "Settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <button
              onClick={() => setShowLanguageMenu((prev) => !prev)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    {t("language", "Langue", "اللغة", "Language")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLanguage === 'fr' ? 'Français' : selectedLanguage === 'ar' ? 'العربية' : 'English'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {showLanguageMenu && (
              <div className="ml-12 space-y-1 pb-2">
                {(['fr', 'ar', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      onSelectLanguage(lang)
                      setShowLanguageMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedLanguage === lang ? 'bg-[#1a4d1a]/10 text-[#1a4d1a] font-semibold' : 'hover:bg-muted'
                    }`}
                  >
                    {lang === 'fr' ? 'Français' : lang === 'ar' ? 'العربية' : 'English'}
                  </button>
                ))}
              </div>
            )}

            <ProfileRow
              icon={Heart}
              title={t("favorites-title", "Mes favoris", "مفضلتي", "Favorites")}
              subtitle={t("favorites-sub", "Produits enregistrés sur cet appareil", "منتجات محفوظة على هذا الجهاز", "Products saved on this device")}
              onClick={() => onOpenFavorites?.()}
            />
            <ProfileRow
              icon={Bell}
              title={t("notifications", "Notifications", "الإشعارات", "Notifications")}
              subtitle={t("manage-notifications", "Gérer les notifications", "إدارة الإشعارات", "Manage notifications")}
            />
            <ProfileRow
              icon={MapPin}
              title={t("addresses", "Adresses", "العناوين", "Addresses")}
              subtitle={t("manage-addresses", "Gérer vos adresses", "إدارة عناوينك", "Manage your addresses")}
              href="/profile/addresses"
            />
            <ProfileRow
              icon={Gift}
              title={t("loyalty", "Fidélité", "الولاء", "Loyalty")}
              subtitle={t("loyalty-sub", "Points et récompenses", "النقاط والمكافآت", "Points and rewards")}
              href="/profile/loyalty"
            />
            <ProfileRow
              icon={CreditCard}
              title={t("payments", "Paiements", "المدفوعات", "Payments")}
              subtitle={t("payments-sub", "Historique des paiements", "سجل المدفوعات", "Payment history")}
              href="/profile/payments"
            />
            <ProfileRow
              icon={MessageCircle}
              title={t("support", "Support", "الدعم", "Support")}
              subtitle={t("support-sub", "Mes tickets", "تذاكري", "My tickets")}
              href="/profile/support"
            />
            <ProfileRow
              icon={Star}
              title={t("reviews", "Avis", "التقييمات", "Reviews")}
              subtitle={t("reviews-sub", "Noter une commande livrée", "تقييم طلب تم توصيله", "Rate a delivered order")}
              href="/profile/reviews"
            />
            <ProfileRow
              icon={Shield}
              title={t("privacy", "Données & confidentialité", "البيانات والخصوصية", "Data & privacy")}
              subtitle={t("privacy-sub", "Export et compte", "تصدير والحساب", "Export and account")}
              href="/profile/privacy"
            />
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent disabled:opacity-50"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t("signing-out", "Déconnexion...", "جاري تسجيل الخروج...", "Signing out...")}
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5 mr-2" />
              {t("logout", "Se déconnecter", "تسجيل الخروج", "Sign out")}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

interface ProfileRowProps {
  icon: LucideIcon
  title: string
  subtitle: string
  href?: string
  onClick?: () => void
}

function ProfileRow({ icon: Icon, title, subtitle, href, onClick }: ProfileRowProps) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <div className="text-left">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </>
  )
  const className = "w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors"
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    )
  }
  return <button type="button" className={className}>{content}</button>
}

