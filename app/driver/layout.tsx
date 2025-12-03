// Force dynamic rendering for driver section
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

