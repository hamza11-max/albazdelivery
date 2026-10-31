import { useI18n } from '../i18n'

export function Placeholder({ text }: { text: string }) {
  const { t } = useI18n()
  return (
    <section className="empty">
      <p className="empty-badge">{t('empty.soon')}</p>
      <p>{text}</p>
    </section>
  )
}
