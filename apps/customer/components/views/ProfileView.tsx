import { useState } from 'react'
import { ArrowLeft, Bell, ChevronRight, Globe, HelpCircle, LogOut, MapPin, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@albaz/ui'
import type { ProfileViewProps } from '@/app/lib/types'

export function ProfileView({ user, selectedLanguage, onSelectLanguage, onBackHome, onSignOut, t }: ProfileViewProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  return (
    <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBackHome} className="hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{t('profile', 'Profil', 'الملف الشخصي')}</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{user?.name || t('user', 'Utilisateur', 'مستخدم')}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              {t('edit-profile', 'Modifier le profil', 'تعديل الملف الشخصي')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings', 'Paramètres', 'الإعدادات')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <button
              onClick={() => setShowLanguageMenu((prev) => !prev)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">{t('language', 'Langue', 'اللغة')}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLanguage === 'fr' ? 'Français' : selectedLanguage === 'ar' ? 'العربية' : 'English'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {showLanguageMenu && (
              <div className="ml-12 space-y-1 pb-2">
                {['fr', 'ar'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      onSelectLanguage(lang)
                      setShowLanguageMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedLanguage === lang ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                    }`}
                  >
                    {lang === 'fr' ? 'Français' : 'العربية'}
                  </button>
                ))}
              </div>
            )}

            <ProfileRow icon={Bell} title={t('notifications', 'Notifications', 'الإشعارات')} subtitle={t('manage-notifications', 'Gérer les notifications', 'إدارة الإشعارات')} />
            <ProfileRow icon={MapPin} title={t('addresses', 'Adresses', 'العناوين')} subtitle={t('manage-addresses', 'Gérer vos adresses', 'إدارة عناوينك')} />
            <ProfileRow icon={HelpCircle} title={t('help', 'Aide & Support', 'المساعدة والدعم')} subtitle={t('faq', 'FAQ et contact', 'الأسئلة الشائعة والاتصال')} />
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent"
          onClick={onSignOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t('logout', 'Se déconnecter', 'تسجيل الخروج')}
        </Button>
      </div>
    </div>
  )
}

interface ProfileRowProps {
  icon: LucideIcon
  title: string
  subtitle: string
}

function ProfileRow({ icon: Icon, title, subtitle }: ProfileRowProps) {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <div className="text-left">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  )
}

