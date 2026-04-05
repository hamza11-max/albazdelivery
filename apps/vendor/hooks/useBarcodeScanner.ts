"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useToast } from "@/root/hooks/use-toast"
import { playSuccessSound } from "@/root/lib/notifications"
import type { InventoryProduct } from "@/root/lib/types"

interface UseBarcodeScannerProps {
  products: InventoryProduct[]
  onProductFound: (product: InventoryProduct) => void
  onBarcodeScanned?: (barcode: string) => void
  translate: (fr: string, ar: string) => string
}

export function useBarcodeScanner({
  products,
  onProductFound,
  onBarcodeScanned,
  translate,
}: UseBarcodeScannerProps) {
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false)
  const [barcodeScannerError, setBarcodeScannerError] = useState<string | null>(null)

  const barcodeVideoRef = useRef<HTMLVideoElement | null>(null)
  const barcodeStreamRef = useRef<MediaStream | null>(null)
  const barcodeAnimationFrameRef = useRef<number>()
  const barcodeDetectorRef = useRef<any>(null)
  const zxingReaderRef = useRef<any>(null)
  const scanDoneRef = useRef(false)

  const { toast } = useToast()

  // Always true — we have ZXing as fallback for environments without native BarcodeDetector
  const isBarcodeDetectorSupported = true

  const handleDetectedBarcode = useCallback((rawValue: string) => {
    if (!rawValue?.trim()) return

    if (onBarcodeScanned) {
      onBarcodeScanned(rawValue.trim())
    }

    const matchedProduct = products.find(
      (p) => p.barcode === rawValue.trim() || p.barcode === rawValue
    )
    if (matchedProduct) {
      onProductFound(matchedProduct)
      playSuccessSound()
      toast({
        title: translate("Produit trouvé", "تم العثور على المنتج"),
        description: translate(
          `${matchedProduct.name} ajouté au panier.`,
          `تمت إضافة ${matchedProduct.name} إلى السلة.`
        ),
      })
    } else {
      toast({
        title: translate("Code-barres inconnu", "رمز غير معروف"),
        description: `${rawValue} — ` + translate(
          "Aucun produit correspondant.",
          "لا يوجد منتج مطابق."
        ),
        variant: "destructive",
      })
    }
    setIsBarcodeScannerOpen(false)
  }, [products, onProductFound, onBarcodeScanned, toast, translate])

  const stopBarcodeScanner = useCallback(() => {
    scanDoneRef.current = false
    if (barcodeAnimationFrameRef.current) {
      cancelAnimationFrame(barcodeAnimationFrameRef.current)
      barcodeAnimationFrameRef.current = undefined
    }
    if (zxingReaderRef.current) {
      try { zxingReaderRef.current.reset() } catch {}
      zxingReaderRef.current = null
    }
    if (barcodeStreamRef.current) {
      barcodeStreamRef.current.getTracks().forEach((track) => track.stop())
      barcodeStreamRef.current = null
    }
    if (barcodeVideoRef.current) {
      barcodeVideoRef.current.srcObject = null
    }
  }, [])

  const startBarcodeScanner = useCallback(async () => {
    setBarcodeScannerError(null)
    scanDoneRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      barcodeStreamRef.current = stream
      if (barcodeVideoRef.current) {
        barcodeVideoRef.current.srcObject = stream
        await barcodeVideoRef.current.play()
      }

      // Try native BarcodeDetector (Chrome on Android / some desktops)
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        const Detector = (window as any).BarcodeDetector
        barcodeDetectorRef.current = new Detector({
          formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "upc_a", "upc_e", "itf"],
        })

        const detect = async () => {
          if (scanDoneRef.current || !barcodeDetectorRef.current || !barcodeVideoRef.current) return
          try {
            const codes = await barcodeDetectorRef.current.detect(barcodeVideoRef.current)
            if (codes?.length) {
              const rawValue = codes[0]?.rawValue
              if (rawValue && !scanDoneRef.current) {
                scanDoneRef.current = true
                handleDetectedBarcode(rawValue)
                return
              }
            }
          } catch {
            // ignore individual frame errors
          }
          if (!scanDoneRef.current) {
            barcodeAnimationFrameRef.current = requestAnimationFrame(detect)
          }
        }
        barcodeAnimationFrameRef.current = requestAnimationFrame(detect)
        return
      }

      // Fallback: ZXing BrowserMultiFormatReader
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser")
        const reader = new BrowserMultiFormatReader()
        zxingReaderRef.current = reader

        if (barcodeVideoRef.current) {
          reader.decodeFromVideoElement(barcodeVideoRef.current, (result, err) => {
            if (scanDoneRef.current) return
            if (result) {
              scanDoneRef.current = true
              handleDetectedBarcode(result.getText())
            }
            // Ignore errors — ZXing emits errors for every frame without a barcode
          })
        }
      } catch (zxingError) {
        console.error("[BarcodeScanner] ZXing init error:", zxingError)
        setBarcodeScannerError(
          translate("Impossible d'initialiser le scanner.", "تعذر تهيئة الماسح الضوئي.")
        )
      }
    } catch (error: any) {
      console.error("[BarcodeScanner] Camera error:", error)
      const msg = error?.name === "NotAllowedError"
        ? translate("Permission caméra refusée.", "تم رفض إذن الكاميرا.")
        : translate("Impossible d'accéder à la caméra.", "تعذر الوصول إلى الكاميرا.")
      setBarcodeScannerError(msg)
    }
  }, [handleDetectedBarcode, translate])

  useEffect(() => {
    if (!isBarcodeScannerOpen) {
      stopBarcodeScanner()
      return
    }
    startBarcodeScanner()
    return () => stopBarcodeScanner()
  }, [isBarcodeScannerOpen, startBarcodeScanner, stopBarcodeScanner])

  // ── Keyboard-wedge listener ──────────────────────────────────────────────
  // USB barcode scanners emulate a keyboard: they type chars rapidly then send Enter.
  // We detect bursts of ≥4 chars arriving within 80 ms and treat them as a scan.
  useEffect(() => {
    if (typeof window === "undefined") return

    let buffer = ""
    let lastKeyTime = 0
    let wedgeTimeout: ReturnType<typeof setTimeout> | null = null
    const BURST_MS = 80   // max gap between chars to count as scanner input
    const MIN_LEN  = 4    // minimum barcode length

    const flush = () => {
      const code = buffer.trim()
      buffer = ""
      wedgeTimeout = null
      if (code.length >= MIN_LEN) {
        handleDetectedBarcode(code)
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const now = Date.now()
      const target = e.target as HTMLElement
      const inInput = target?.tagName?.toLowerCase() === "input"
        || target?.tagName?.toLowerCase() === "textarea"

      if (e.key === "Enter") {
        // Scanner pressed Enter — flush whatever is in buffer
        if (buffer.length >= MIN_LEN) {
          if (wedgeTimeout) { clearTimeout(wedgeTimeout); wedgeTimeout = null }
          flush()
          // Prevent Enter from submitting forms when we consumed a scan
          if (!inInput) e.preventDefault()
        }
        return
      }

      if (e.key.length !== 1) return // ignore Shift, Ctrl, etc.

      const gap = now - lastKeyTime
      lastKeyTime = now

      // If gap is too large, this is normal typing — reset buffer
      if (buffer.length > 0 && gap > BURST_MS) {
        buffer = ""
        if (wedgeTimeout) { clearTimeout(wedgeTimeout); wedgeTimeout = null }
      }

      buffer += e.key
      if (wedgeTimeout) clearTimeout(wedgeTimeout)
      // Auto-flush if no Enter arrives within 200 ms after last char
      wedgeTimeout = setTimeout(flush, 200)
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      if (wedgeTimeout) clearTimeout(wedgeTimeout)
    }
  }, [handleDetectedBarcode])

  return {
    isBarcodeScannerOpen,
    setIsBarcodeScannerOpen,
    isBarcodeDetectorSupported,
    barcodeScannerError,
    barcodeVideoRef,
  }
}
