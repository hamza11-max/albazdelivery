"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotFoundBackButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => window.history.back()}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Page précédente
    </Button>
  )
}
