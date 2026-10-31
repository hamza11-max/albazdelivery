import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { call } from './api'
import { App } from './App'
import { I18nProvider } from './i18n'
import './styles.css'

async function start() {
  const root = createRoot(document.getElementById('root')!)
  let lang: 'ar' | 'fr' = 'ar'
  try {
    lang = (await call('settings:get')).lang
  } catch (err) {
    console.error('settings:get failed', err)
  }
  root.render(
    <StrictMode>
      <I18nProvider initial={lang}>
        <App />
      </I18nProvider>
    </StrictMode>,
  )
}

void start()
