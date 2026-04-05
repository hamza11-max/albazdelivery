/**
 * RFID in-memory store: read events buffer, readers, alerts.
 * Used by the RFID dashboard and device management UI.
 * When a tag is scanned (keyboard wedge or serial), main process calls pushReadEvent().
 */

const { ipcMain } = require('electron')

const MAX_EVENTS = 500
const DUPLICATE_WINDOW_MS = 2000
const DEFAULT_READER_ID = 'keyboard-wedge'

const readEvents = []
const readers = new Map()
const alerts = []
let readerIdCounter = 1
let alertIdCounter = 1
let mainWindowRef = null

function setMainWindow(win) {
  mainWindowRef = win
}

function pushReadEvent(tagId, readerId = DEFAULT_READER_ID) {
  const ts = new Date().toISOString()
  const event = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    tagId: String(tagId).trim(),
    readerId,
    gateId: null,
    zoneId: null,
    timestamp: ts,
    direction: 'none',
  }
  readEvents.unshift(event)
  if (readEvents.length > MAX_EVENTS) readEvents.pop()

  const lastSame = readEvents.find(e => e.tagId === event.tagId && e.readerId === event.readerId && e.id !== event.id)
  const lastTime = lastSame ? new Date(lastSame.timestamp).getTime() : 0
  if (lastSame && (Date.now() - lastTime) < DUPLICATE_WINDOW_MS) {
    const alert = {
      id: `alert-${alertIdCounter++}`,
      type: 'duplicate_read',
      tagId: event.tagId,
      readerId: event.readerId,
      payload: { eventId: event.id, previousId: lastSame.id },
      createdAt: ts,
      acknowledged: false,
    }
    alerts.unshift(alert)
    if (alerts.length > 200) alerts.pop()
  }

  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('rfid-events-batch', [event])
  }
  return event
}

function getRecentEvents(limit = 100) {
  return readEvents.slice(0, Math.min(limit, readEvents.length))
}

function getAlerts(acknowledged = null) {
  if (acknowledged === null) return [...alerts]
  return alerts.filter(a => a.acknowledged === acknowledged)
}

function ackAlert(alertId) {
  const a = alerts.find(x => x.id === alertId)
  if (a) a.acknowledged = true
  return !!a
}

function addUnknownTagAlert(tagId, readerId) {
  const ts = new Date().toISOString()
  const alert = {
    id: `alert-${alertIdCounter++}`,
    type: 'unknown_tag',
    tagId,
    readerId: readerId || DEFAULT_READER_ID,
    payload: {},
    createdAt: ts,
    acknowledged: false,
  }
  alerts.unshift(alert)
  if (alerts.length > 200) alerts.pop()
}

function getReaders() {
  return Array.from(readers.values())
}

function addReader({ name, type = 'keyboard', serialPath = null, baudRate = 9600, zoneId = null }) {
  const id = `reader-${readerIdCounter++}`
  const reader = {
    id,
    name: name || id,
    type,
    serialPath,
    baudRate,
    zoneId,
    lastSeenAt: null,
    status: type === 'keyboard' ? 'online' : 'offline',
  }
  readers.set(id, reader)
  return reader
}

function deleteReader(id) {
  return readers.delete(id)
}

function updateReaderLastSeen(id) {
  const r = readers.get(id)
  if (r) {
    r.lastSeenAt = new Date().toISOString()
    r.status = 'online'
  }
}

function getEventsByTag(tagId, limit = 50) {
  return readEvents.filter(e => e.tagId === tagId).slice(0, limit)
}

function registerRfidIPC() {
  ipcMain.handle('rfid-get-recent-events', (event, limit) => getRecentEvents(limit ?? 100))
  ipcMain.handle('rfid-get-alerts', (event, opts) => getAlerts(opts?.acknowledged ?? null))
  ipcMain.handle('rfid-ack-alert', (event, alertId) => ackAlert(alertId))
  ipcMain.handle('rfid-get-readers', () => getReaders())
  ipcMain.handle('rfid-add-reader', (event, data) => addReader(data || {}))
  ipcMain.handle('rfid-delete-reader', (event, id) => deleteReader(id))
  ipcMain.handle('rfid-get-events-by-tag', (event, tagId, limit) => getEventsByTag(tagId, limit))
  ipcMain.handle('rfid-add-unknown-tag-alert', (event, tagId, readerId) => addUnknownTagAlert(tagId || '', readerId || null))
}

module.exports = {
  setMainWindow,
  pushReadEvent,
  getRecentEvents,
  getAlerts,
  ackAlert,
  addUnknownTagAlert,
  getReaders,
  addReader,
  deleteReader,
  updateReaderLastSeen,
  getEventsByTag,
  registerRfidIPC,
}
