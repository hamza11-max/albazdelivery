import { ReactNode } from 'react'
import { UpdaterModal } from '../../components/ui/update-modal/UpdaterModal'

// Force dynamic rendering for the entire vendor section
export const dynamic = 'force-dynamic'

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <UpdaterModal />
    </>
  )
}

