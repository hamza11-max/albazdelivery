"use client"

import { Button } from "@/root/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/root/components/ui/dialog"
import { Upload } from "lucide-react"
import type { ChangeEvent } from "react"

interface ImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  fileInputRef: React.RefObject<HTMLInputElement>
  translate: (fr: string, ar: string) => string
}

export function ImageUploadDialog({
  open,
  onOpenChange,
  onFileUpload,
  fileInputRef,
  translate,
}: ImageUploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translate("Télécharger une image", "رفع صورة")}</DialogTitle>
          <DialogDescription>
            {translate("Sélectionnez une image depuis votre appareil", "اختر صورة من جهازك")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              {translate("Cliquez sur le bouton ci-dessous pour sélectionner une image", "انقر على الزر أدناه لاختيار صورة")}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileUpload}
            className="hidden"
            id="product-image-upload"
          />
          <div className="flex justify-center">
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {translate("Sélectionner une image", "اختر صورة")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

