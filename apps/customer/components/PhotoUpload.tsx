'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

interface PhotoUploadProps {
  isOpen: boolean
  onClose: () => void
  onPhotoCapture: (file: File, preview: string) => void
  title?: string
  description?: string
  maxSizeMB?: number
}

export function PhotoUpload({
  isOpen,
  onClose,
  onPhotoCapture,
  title = 'Ajouter une photo',
  description = 'Prenez une photo ou téléchargez depuis votre appareil',
  maxSizeMB = 5,
}: PhotoUploadProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      
      setStream(mediaStream)
      setIsCameraActive(true)
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Impossible d\'accéder à la caméra. Utilisez le téléchargement de fichier.')
      toast({
        title: 'Erreur',
        description: 'Impossible d\'accéder à la caméra',
        variant: 'destructive',
      })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const context = canvas.getContext('2d')
    if (!context) return

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return

      const file = new File([blob], `product-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const previewUrl = URL.createObjectURL(blob)
      
      setPreview(previewUrl)
      stopCamera()

      // Call the callback with the captured photo
      onPhotoCapture(file, previewUrl)
      
      toast({
        title: 'Photo capturée',
        description: 'La photo a été capturée avec succès',
      })
    }, 'image/jpeg', 0.9)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une image valide',
        variant: 'destructive',
      })
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: 'Erreur',
        description: `La taille du fichier doit être inférieure à ${maxSizeMB}MB`,
        variant: 'destructive',
      })
      return
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    // Call the callback with the uploaded file
    onPhotoCapture(file, previewUrl)

    toast({
      title: 'Photo téléchargée',
      description: 'La photo a été téléchargée avec succès',
    })
  }

  const handleClose = () => {
    stopCamera()
    setPreview(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Camera view or preview */}
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-video">
            {preview ? (
              // Show preview
              <div className="relative w-full h-full">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
                <Button
                  onClick={() => {
                    setPreview(null)
                    if (preview) URL.revokeObjectURL(preview)
                  }}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : isCameraActive ? (
              // Show camera feed
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            ) : (
              // Show placeholder
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Aucune photo sélectionnée</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            {!preview && !isCameraActive && (
              <>
                <Button onClick={startCamera} variant="outline" className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Prendre photo
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </>
            )}

            {isCameraActive && !preview && (
              <>
                <Button onClick={capturePhoto} className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Capturer
                </Button>
                <Button onClick={stopCamera} variant="outline" className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </>
            )}

            {preview && (
              <>
                <Button onClick={handleClose} className="w-full">
                  Confirmer
                </Button>
                <Button
                  onClick={() => {
                    setPreview(null)
                    if (preview) URL.revokeObjectURL(preview)
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Retirer
                </Button>
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center">
            Taille maximale: {maxSizeMB}MB • Formats acceptés: JPG, PNG, WebP
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

