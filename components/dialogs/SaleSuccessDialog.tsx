"use client"

import { Button } from "@/root/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/root/components/ui/dialog"
import { Printer } from "lucide-react"

interface SaleSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  onPrint: () => void
  translate: (fr: string, ar: string) => string
}

export function SaleSuccessDialog({
  open,
  onOpenChange,
  onClose,
  onPrint,
  translate,
}: SaleSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <DialogTitle className="text-center text-xl text-gray-900 dark:text-white">
            {translate("Vente complétée", "تمت العملية")}
          </DialogTitle>
          <DialogDescription className="text-center text-base text-gray-700 dark:text-gray-300">
            {translate("Sale completed; the transaction has been completed successfully", "تم إتمام البيع؛ تمت العملية بنجاح")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {translate("Fermer", "إغلاق")}
          </Button>
          <Button
            onClick={onPrint}
            className="w-full sm:w-auto bg-albaz-green-gradient hover:opacity-90 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            {translate("Imprimer le reçu", "طباعة الإيصال")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

