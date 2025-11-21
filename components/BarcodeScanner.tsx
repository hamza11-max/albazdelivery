'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/root/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/root/components/ui/dialog'
import { Camera, X, ScanLine } from 'lucide-react'
import { useToast } from '@/root/hooks/use-toast'

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
  title?: string
  description?: string
}

export function BarcodeScanner({
  isOpen,
  onClose,
  onScan,
  title = 'Scanner le code-barres',
  description = 'Positionnez le code-barres devant la caméra',
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false,
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      
      setStream(mediaStream)
      setIsScanning(true)
      
      // Start scanning for barcodes
      startBarcodeDetection()
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.')
      toast({
        title: 'Erreur',
        description: 'Impossible d\'accéder à la caméra',
        variant: 'destructive',
      })
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }

  const startBarcodeDetection = () => {
    // Use BarcodeDetector API if available (Chromium-based browsers)
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
      })

      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current)
            if (barcodes.length > 0) {
              const barcode = barcodes[0].rawValue
              handleBarcodeDetected(barcode)
            }
          } catch (err) {
            console.error('Barcode detection error:', err)
          }
        }
      }, 100) // Scan every 100ms
    } else {
      // Fallback: Use ZXing library or manual input
      toast({
        title: 'Information',
        description: 'Scan automatique non disponible. Utilisez la saisie manuelle.',
      })
    }
  }

  const handleBarcodeDetected = (barcode: string) => {
    console.log('Barcode detected:', barcode)
    onScan(barcode)
    stopCamera()
    onClose()
    
    toast({
      title: 'Code-barres scanné',
      description: `Code: ${barcode}`,
    })
  }

  const captureAndAnalyze = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for analysis
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Here you could implement barcode detection using a library like ZXing
    // For now, we'll rely on the BarcodeDetector API
    toast({
      title: 'Capture effectuée',
      description: 'Analyse de l\'image en cours...',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              {error}
            </div>
          ) : (
            <>
              {/* Video preview */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-32 border-4 border-primary rounded-lg animate-pulse">
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary animate-scan" />
                    </div>
                  </div>
                )}

                {/* Hidden canvas for image analysis */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Instructions */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-sm">
                <p className="font-medium mb-1">Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Positionnez le code-barres dans le cadre</li>
                  <li>Assurez-vous d'avoir un bon éclairage</li>
                  <li>Tenez l'appareil stable</li>
                </ul>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            {!error && (
              <Button onClick={captureAndAnalyze} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Capturer
              </Button>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes scan {
            0%, 100% {
              transform: translateY(-50%);
            }
            50% {
              transform: translateY(50%);
            }
          }
          .animate-scan {
            animation: scan 2s ease-in-out infinite;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}

