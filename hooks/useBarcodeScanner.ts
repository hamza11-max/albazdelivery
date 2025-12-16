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
  toast?: ReturnType<typeof useToast>['toast']
}

export function useBarcodeScanner({
  products,
  onProductFound,
  onBarcodeScanned,
  translate,
  toast: toastProp,
}: UseBarcodeScannerProps) {
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false)
  const [isBarcodeDetectorSupported, setIsBarcodeDetectorSupported] = useState(true) // Always true for html5-qrcode
  const [barcodeScannerError, setBarcodeScannerError] = useState<string | null>(null)
  
  const barcodeVideoRef = useRef<HTMLDivElement | null>(null)
  const html5QrCodeRef = useRef<any>(null)
  const isScanningRef = useRef(false)
  
  // Use passed toast or fallback to useToast hook
  const toastHook = useToast()
  const toast = toastProp || toastHook.toast

  const stopBarcodeScanner = useCallback(async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        await html5QrCodeRef.current.clear()
        isScanningRef.current = false
      } catch (error) {
        console.error("[BarcodeScanner] Error stopping scanner:", error)
      }
    }
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.clear()
      } catch (error) {
        // Ignore clear errors
      }
    }
  }, [])

  const startBarcodeScanner = useCallback(async () => {
    setBarcodeScannerError(null)
    
    if (!barcodeVideoRef.current) {
      setBarcodeScannerError(translate("Élément de scanner introuvable.", "عنصر الماسح غير موجود."))
      return
    }

    try {
      // Dynamically import html5-qrcode
      const { Html5Qrcode } = await import('html5-qrcode')
      
      // Clean up any existing instance
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop()
          await html5QrCodeRef.current.clear()
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Ensure the div has an ID
      if (!barcodeVideoRef.current.id) {
        barcodeVideoRef.current.id = 'barcode-scanner'
      }

      // Create new instance
      const html5QrCode = new Html5Qrcode(barcodeVideoRef.current.id)
      html5QrCodeRef.current = html5QrCode

      // Get available cameras
      const devices = await Html5Qrcode.getCameras()
      if (devices.length === 0) {
        setBarcodeScannerError(translate("Aucune caméra trouvée.", "لم يتم العثور على كاميرا."))
        return
      }

      // Prefer back camera on mobile, or first available camera
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      )
      const cameraId = backCamera?.id || devices[0].id

      // Start scanning
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            facingMode: { ideal: "environment" }
          }
        },
        (decodedText: string) => {
          // Success callback
          if (isScanningRef.current) {
            isScanningRef.current = false
            
            // Call onBarcodeScanned callback if provided
            if (onBarcodeScanned) {
              onBarcodeScanned(decodedText)
            }
            
            // Find matching product
            const matchedProduct = products.find((p) => p.barcode === decodedText)
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
            
            // Stop scanner and close
            stopBarcodeScanner().then(() => {
              setIsBarcodeScannerOpen(false)
            })
          }
        },
        (errorMessage: string) => {
          // Error callback - ignore, we're continuously scanning
          // Only log if it's not a "not found" error
          if (!errorMessage.includes('No QR code') && !errorMessage.includes('No MultiFormat')) {
            // Silently continue scanning
          }
        }
      )
      
      isScanningRef.current = true
    } catch (error: any) {
      console.error("[BarcodeScanner] Error starting scanner:", error)
      let errorMessage = translate("Impossible d'accéder à la caméra.", "تعذر الوصول إلى الكاميرا.")
      
      if (error?.message?.includes('Permission denied') || error?.message?.includes('NotAllowedError')) {
        errorMessage = translate("Permission de caméra refusée. Veuillez autoriser l'accès à la caméra.", "تم رفض إذن الكاميرا. يرجى السماح بالوصول إلى الكاميرا.")
      } else if (error?.message?.includes('NotFoundError') || error?.message?.includes('No camera')) {
        errorMessage = translate("Aucune caméra trouvée.", "لم يتم العثور على كاميرا.")
      }
      
      setBarcodeScannerError(errorMessage)
    }
  }, [products, onProductFound, onBarcodeScanned, toast, translate, stopBarcodeScanner])

  useEffect(() => {
    if (!isBarcodeScannerOpen) {
      stopBarcodeScanner()
      return
    }
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startBarcodeScanner()
    }, 100)
    
    return () => {
      clearTimeout(timer)
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
