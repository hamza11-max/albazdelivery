"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@albaz/ui"

interface BarcodeScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoRef: React.RefObject<HTMLVideoElement>
  error: string | null
  translate: (fr: string, ar: string) => string
}

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  videoRef,
  error,
  translate,
}: BarcodeScannerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{translate("Scanner de Code-barres", "ماسح الباركود")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <p className="text-sm text-muted-foreground text-center">
            {translate(
              "Pointez la caméra vers un code-barres pour le scanner automatiquement.",
              "وجه الكاميرا نحو الرمز الشريطي للمسح التلقائي."
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

