'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface Props {
  id: string
  emailVerified: boolean
  isActive: boolean
  onComplete?: (message?: string) => void
}

export default function UserActions({ id, emailVerified, isActive, onComplete }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'toggle' | 'resend' | null>(null)

  const openConfirm = (action: 'toggle' | 'resend') => {
    setPendingAction(action)
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingAction) return
    setLoading(true)
    try {
      if (pendingAction === 'toggle') {
        const res = await fetch(`/api/users/${id}/toggle-activation`, { method: 'POST' })
        if (res.ok) {
          const json = await res.json()
          toast({ type: 'success', title: json?.message || 'Estado actualizado' })
          if (onComplete) onComplete(json?.message)
          else router.refresh()
        } else {
          const err = await res.text()
          toast({ type: 'error', title: 'Error', description: err || 'No se pudo actualizar estado' })
        }
      } else if (pendingAction === 'resend') {
        const res = await fetch(`/api/users/${id}/resend-activation`, { method: 'POST' })
        if (res.ok) {
          const json = await res.json()
          toast({ type: 'success', title: json?.message || 'Email enviado' })
          if (onComplete) onComplete(json?.message)
          else router.refresh()
        } else {
          const err = await res.text()
          toast({ type: 'error', title: 'Error', description: err || 'No se pudo enviar email' })
        }
      }
    } catch (error) {
      console.error(error)
      toast({ type: 'error', title: 'Error', description: 'Ocurrió un error' })
    } finally {
      setLoading(false)
      setPendingAction(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => openConfirm('toggle')} disabled={loading}>{isActive ? 'Desactivar' : 'Activar'}</Button>
        {!emailVerified && (
          <Button variant="outline" size="sm" onClick={() => openConfirm('resend')} disabled={loading}>Reenviar verificación</Button>
        )}
        <a className="text-blue-600 hover:underline text-sm" href={`/dashboard/users/${id}`}>Editar</a>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        title={pendingAction === 'toggle' ? (isActive ? 'Desactivar usuario' : 'Activar usuario') : 'Reenviar verificación'}
        description={pendingAction === 'toggle' ? '¿Estás seguro que deseas cambiar el estado de activación de este usuario?' : 'Se enviará un correo de verificación a este usuario.'}
        confirmLabel={pendingAction === 'toggle' ? (isActive ? 'Desactivar' : 'Activar') : 'Enviar'}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  )
}
