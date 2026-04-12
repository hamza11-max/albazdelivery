import { readJsonFile, writeJsonFileAtomic, getGuestMenuProductStatePath } from "./restaurant-local-data"

export type GuestMenuProductStateFile = {
  /** Product IDs temporarily removed from the public QR menu (86). */
  hiddenIds: string[]
  updatedAt?: number
}

const EMPTY: GuestMenuProductStateFile = { hiddenIds: [] }

function readState(): GuestMenuProductStateFile {
  return readJsonFile<GuestMenuProductStateFile>(getGuestMenuProductStatePath(), EMPTY)
}

function writeState(state: GuestMenuProductStateFile) {
  writeJsonFileAtomic(getGuestMenuProductStatePath(), {
    ...state,
    hiddenIds: [...new Set(state.hiddenIds.map(String).filter(Boolean))],
    updatedAt: Date.now(),
  })
}

export function getGuestMenuHiddenIds(): string[] {
  const s = readState()
  return [...new Set((s.hiddenIds || []).map(String))]
}

export function getGuestMenuHiddenSet(): Set<string> {
  return new Set(getGuestMenuHiddenIds())
}

export function setGuestMenuProductHidden(productId: string, hidden: boolean): string[] {
  const id = String(productId || "").trim()
  if (!id) return getGuestMenuHiddenIds()
  const cur = new Set(getGuestMenuHiddenIds())
  if (hidden) cur.add(id)
  else cur.delete(id)
  const hiddenIds = [...cur]
  writeState({ hiddenIds })
  return hiddenIds
}
