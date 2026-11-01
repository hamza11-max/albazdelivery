import { useEffect, useRef } from 'react'

// A USB/Bluetooth barcode scanner is a keyboard: it "types" the code in a burst
// and usually ends with Enter. People type far slower than this.
const BURST_MS = 80 // max gap between keys of one scan
const MIN_LEN = 4 // shorter bursts are treated as typing
const IDLE_FLUSH_MS = 200 // scanners set up without the Enter suffix

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)

/**
 * Catches scans while focus is NOT in a text field (on a button, the cart, nowhere),
 * so a scan is never lost because the cashier clicked something.
 * Typing into fields is left alone: the scan field handles its own Enter.
 */
export function useKeyboardWedge(onCode: (code: string) => void, enabled: boolean) {
  const handler = useRef(onCode)
  handler.current = onCode

  useEffect(() => {
    if (!enabled) return
    let buffer = ''
    let lastAt = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const flush = () => {
      clearTimeout(timer)
      const code = buffer
      buffer = ''
      if (code.length >= MIN_LEN) handler.current(code)
    }

    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target) || e.ctrlKey || e.altKey || e.metaKey) return
      const now = performance.now()
      if (now - lastAt > BURST_MS) buffer = ''
      lastAt = now

      if (e.key === 'Enter' || e.key === 'Tab') {
        // Swallow the scanner's Enter so it doesn't also press the focused button.
        if (buffer.length >= MIN_LEN) {
          e.preventDefault()
          e.stopPropagation()
        }
        flush()
      } else if (e.key.length === 1) {
        buffer += e.key
        clearTimeout(timer)
        timer = setTimeout(flush, IDLE_FLUSH_MS)
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [enabled])
}
