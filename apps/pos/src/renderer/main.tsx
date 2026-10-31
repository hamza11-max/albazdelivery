import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { call } from './api'
import { App } from './App'
import { AuthGate } from './auth'
import { I18nProvider } from './i18n'
import { PinScreen } from './pages/PinScreen'
import { Setup } from './pages/Setup'
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
        <AuthGate
          setup={(done) => <Setup onDone={done} />}
          signIn={(shopName, done) => <PinScreen shopName={shopName} onDone={done} />}
        >
          <App />
        </AuthGate>
      </I18nProvider>
    </StrictMode>,
  )
}

void start()
