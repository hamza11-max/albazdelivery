"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/root/components/ui/dialog"
import { X } from "lucide-react"
import { Button } from "@/root/components/ui/button"

interface BarcodeScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoRef: React.RefObject<HTMLDivElement>
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
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>{translate("Scanner de Code-barres", "ماسح الباركود")}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-6 pt-0">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <div
              id="barcode-scanner"
              ref={videoRef}
              className="w-full h-full"
            />
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              {translate(
                "Pointez la caméra vers un code-barres pour le scanner automatiquement.",
                "وجه الكاميرا نحو الرمز الشريطي للمسح التلقائي."
              )}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>{translate("Scan en cours...", "جارٍ المسح...")}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

