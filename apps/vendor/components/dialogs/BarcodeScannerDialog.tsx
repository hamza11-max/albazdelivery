"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@albaz/ui"
import { ScanLine } from "lucide-react"

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
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            {translate("Scanner un code-barres", "مسح الباركود")}
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dimmed corners */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Clear scan window */}
            <div
              className="relative z-10 border-2 border-white rounded-sm"
              style={{ width: "75%", height: "35%" }}
            >
              {/* Corner accents */}
              <span className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl-sm" />
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr-sm" />
              <span className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl-sm" />
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br-sm" />
              {/* Animated scan line */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/80 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 space-y-1">
          {error ? (
            <p className="text-sm text-destructive text-center font-medium">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {translate(
                "Centrez le code-barres dans le cadre.",
                "ضع الباركود داخل الإطار."
              )}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
