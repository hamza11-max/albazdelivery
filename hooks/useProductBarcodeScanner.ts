"use client"

import { useState, useRef, useEffect, useCallback } from "react"

interface UseProductBarcodeScannerProps {
  isOpen: boolean
  onBarcodeScanned: (barcode: string) => void
  onError?: (error: string) => void
}

export function useProductBarcodeScanner({
  isOpen,
  onBarcodeScanned,
  onError,
}: UseProductBarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)
  const isScanningRef = useRef(false)

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        await html5QrCodeRef.current.clear()
        isScanningRef.current = false
      } catch (error) {
        console.error('[ProductBarcodeScanner] Error stopping scanner:', error)
      }
    }
  }, [])

  const startScanner = useCallback(async () => {
    setError(null)
    
    if (!videoRef.current) {
      const errorMsg = "Scanner element not found"
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    try {
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
      if (!videoRef.current.id) {
        videoRef.current.id = `barcode-scanner-${Date.now()}`
      }

      // Create new instance
      const html5QrCode = new Html5Qrcode(videoRef.current.id)
      html5QrCodeRef.current = html5QrCode

      // Get available cameras
      const devices = await Html5Qrcode.getCameras()
      if (devices.length === 0) {
        const errorMsg = "No camera found"
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      // Prefer back camera on mobile
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
          if (isScanningRef.current && decodedText) {
            isScanningRef.current = false
            onBarcodeScanned(decodedText)
            stopScanner()
          }
        },
        (errorMessage: string) => {
          // Error callback - ignore "not found" errors
          if (!errorMessage.includes('No QR code') && !errorMessage.includes('No MultiFormat')) {
            // Silently continue scanning
          }
        }
      )
      
      isScanningRef.current = true
    } catch (error: any) {
      console.error('[ProductBarcodeScanner] Error starting scanner:', error)
      let errorMessage = "Unable to access camera"
      
      if (error?.message?.includes('Permission denied') || error?.message?.includes('NotAllowedError')) {
        errorMessage = "Camera permission denied. Please allow camera access."
      } else if (error?.message?.includes('NotFoundError') || error?.message?.includes('No camera')) {
        errorMessage = "No camera found"
      }
      
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [onBarcodeScanned, onError, stopScanner])

  useEffect(() => {
    if (!isOpen) {
      stopScanner()
      return
    }
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner()
    }, 100)
    
    return () => {
      clearTimeout(timer)
      stopScanner()
    }
  }, [isOpen, startScanner, stopScanner])

  return {
    videoRef,
    error,
  }
}

