"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface EmailPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: {
    from: string
    to: string
    subject: string
    html: string
  } | null
}

export function EmailPreview({ open, onOpenChange, preview }: EmailPreviewProps) {
  if (!preview) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            Preview do Email
            <Badge variant="secondary">Exemplo</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Email Header */}
        <div className="border-b bg-muted/30 px-6 py-3 text-sm">
          <div className="grid gap-1">
            <div className="flex gap-2">
              <span className="font-medium text-muted-foreground">De:</span>
              <span>{preview.from}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-muted-foreground">Para:</span>
              <span>{preview.to}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-muted-foreground">Assunto:</span>
              <span className="font-medium">{preview.subject}</span>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="max-h-[60vh] overflow-auto">
          <iframe
            srcDoc={preview.html}
            title="Email Preview"
            className="h-[500px] w-full border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
