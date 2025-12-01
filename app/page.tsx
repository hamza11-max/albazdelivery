import dynamicImport from 'next/dynamic'
import { LoadingScreen } from '../components/LoadingScreen'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

// Dynamically import the client component to prevent static generation
const AlBazAppClient = dynamicImport(() => import('./page-client'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

export default function AlBazApp() {
  return <AlBazAppClient />
}
