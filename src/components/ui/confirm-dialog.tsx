'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  setOpen: (v: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => Promise<void> | void
  loading?: boolean
}

export default function ConfirmDialog({ open, setOpen, title = 'Confirmar', description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, loading = false }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>{cancelLabel}</Button>
          <Button onClick={async () => { await onConfirm(); setOpen(false) }} disabled={loading}>{confirmLabel}</Button>
        </DialogFooter>
        <DialogClose />
      </DialogContent>
    </Dialog>
  )
}
