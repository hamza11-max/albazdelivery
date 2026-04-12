/** Local preferences for Kitchen (KDS) — no server round-trip. */

export type KdsColumnKey = "pending" | "accepted" | "preparing" | "ready"

export const KDS_STATIONS_KEY = "vendor-kds-stations-v1"
export const KDS_LINE_STATIONS_KEY = "vendor-kds-line-stations-v1"
export const KDS_COLUMN_SOUNDS_KEY = "vendor-kds-column-sounds-v1"
export const KDS_WARN_MINUTES_KEY = "vendor-kds-warn-minutes-v1"

export type LineStationMap = Record<string, Record<string, string>>
/** orderId -> { "0": "Grill", "1": "Salades" } */

export type ColumnSoundPrefs = Record<KdsColumnKey, boolean>

const DEFAULT_SOUNDS: ColumnSoundPrefs = {
  pending: true,
  accepted: true,
  preparing: true,
  ready: true,
}

export function loadKdsStations(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KDS_STATIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim())
  } catch {
    return []
  }
}

export function saveKdsStations(stations: string[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KDS_STATIONS_KEY, JSON.stringify(stations))
}

export function loadLineStations(): LineStationMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(KDS_LINE_STATIONS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== "object" || parsed === null) return {}
    return parsed as LineStationMap
  } catch {
    return {}
  }
}

export function saveLineStations(map: LineStationMap): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KDS_LINE_STATIONS_KEY, JSON.stringify(map))
}

export function setLineStation(orderId: string, lineIndex: number, station: string | ""): LineStationMap {
  const map = { ...loadLineStations() }
  const prev = { ...(map[orderId] || {}) }
  const key = String(lineIndex)
  if (!station) delete prev[key]
  else prev[key] = station
  if (Object.keys(prev).length === 0) delete map[orderId]
  else map[orderId] = prev
  saveLineStations(map)
  return map
}

export function loadColumnSounds(): ColumnSoundPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_SOUNDS }
  try {
    const raw = localStorage.getItem(KDS_COLUMN_SOUNDS_KEY)
    if (!raw) return { ...DEFAULT_SOUNDS }
    const parsed = JSON.parse(raw) as Partial<ColumnSoundPrefs>
    return { ...DEFAULT_SOUNDS, ...parsed }
  } catch {
    return { ...DEFAULT_SOUNDS }
  }
}

export function saveColumnSounds(prefs: ColumnSoundPrefs): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KDS_COLUMN_SOUNDS_KEY, JSON.stringify(prefs))
}

export function loadWarnMinutes(): number {
  if (typeof window === "undefined") return 15
  try {
    const n = Number(localStorage.getItem(KDS_WARN_MINUTES_KEY))
    return Number.isFinite(n) && n > 0 ? Math.min(120, Math.floor(n)) : 15
  } catch {
    return 15
  }
}

export function saveWarnMinutes(min: number): void {
  if (typeof window === "undefined") return
  const n = Number.isFinite(min) && min > 0 ? Math.min(120, Math.floor(min)) : 15
  localStorage.setItem(KDS_WARN_MINUTES_KEY, String(n))
}
