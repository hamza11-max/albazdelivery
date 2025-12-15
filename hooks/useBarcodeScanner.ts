"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
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
  const [isBarcodeDetectorSupported, setIsBarcodeDetectorSupported] = useState(false)
  const [barcodeScannerError, setBarcodeScannerError] = useState<string | null>(null)
  
  const barcodeVideoRef = useRef<HTMLVideoElement | null>(null)
  const barcodeStreamRef = useRef<MediaStream | null>(null)
  const barcodeAnimationFrameRef = useRef<number>()
  const barcodeDetectorRef = useRef<any>(null)
  
  const { toast } = useToast()

  // Check if BarcodeDetector is supported
  useEffect(() => {
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      setIsBarcodeDetectorSupported(true)
    }
  }, [])

  const stopBarcodeScanner = useCallback(() => {
    if (barcodeAnimationFrameRef.current) {
      cancelAnimationFrame(barcodeAnimationFrameRef.current)
      barcodeAnimationFrameRef.current = undefined
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
    if (!isBarcodeDetectorSupported) {
      setBarcodeScannerError(translate("La lecture de code-barres n'est pas prise en charge sur cet appareil.", "مسح الباركود غير مدعوم على هذا الجهاز."))
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      barcodeStreamRef.current = stream
      if (barcodeVideoRef.current) {
        barcodeVideoRef.current.srcObject = stream
        await barcodeVideoRef.current.play()
      }
      const Detector = (window as any).BarcodeDetector
      barcodeDetectorRef.current = new Detector({
        formats: ["code_128", "code_39", "ean_13", "qr_code", "upc_a", "upc_e"],
      })

      const detect = async () => {
        if (!barcodeDetectorRef.current || !barcodeVideoRef.current) {
          barcodeAnimationFrameRef.current = requestAnimationFrame(detect)
          return
        }
        try {
          const codes = await barcodeDetectorRef.current.detect(barcodeVideoRef.current)
          if (codes?.length) {
            const rawValue = codes[0]?.rawValue
            if (rawValue) {
              // Call onBarcodeScanned callback if provided (e.g., to set search)
              if (onBarcodeScanned) {
                onBarcodeScanned(rawValue)
              }
              
              const matchedProduct = products.find((p) => p.barcode === rawValue)
              if (matchedProduct) {
                onProductFound(matchedProduct)
                playSuccessSound()
                toast({
                  title: translate("Produit trouvé", "تم العثور على المنتج"),
                  description: translate("Le produit a été ajouté au panier.", "تمت إضافة المنتج إلى السلة."),
                })
              } else {
                toast({
                  title: translate("Code-barres inconnu", "رمز غير معروف"),
                  description: translate("Aucun produit ne correspond à ce code-barres.", "لا يوجد منتج مطابق لهذا الرمز."),
                  variant: "destructive",
                })
              }
              setIsBarcodeScannerOpen(false)
              return
            }
          }
        } catch (error) {
          console.error("[v0] Barcode detection error:", error)
          setBarcodeScannerError(translate("Impossible de lire le code-barres.", "تعذر قراءة الرمز."))
        }
        barcodeAnimationFrameRef.current = requestAnimationFrame(detect)
      }

      barcodeAnimationFrameRef.current = requestAnimationFrame(detect)
    } catch (error) {
      console.error("[v0] Error starting barcode scanner:", error)
      setBarcodeScannerError(translate("Impossible d'accéder à la caméra.", "تعذر الوصول إلى الكاميرا."))
    }
  }, [isBarcodeDetectorSupported, products, onProductFound, onBarcodeScanned, toast, translate])

  useEffect(() => {
    if (!isBarcodeScannerOpen) {
      stopBarcodeScanner()
      return
    }
    startBarcodeScanner()
    return () => {
      stopBarcodeScanner()
    }
  }, [isBarcodeScannerOpen, startBarcodeScanner, stopBarcodeScanner])

  return {
    isBarcodeScannerOpen,
    setIsBarcodeScannerOpen,
    isBarcodeDetectorSupported,
    barcodeScannerError,
    barcodeVideoRef,
  }
}
