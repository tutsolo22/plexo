'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface AuditLog {
  id: string
  action: string
  provider: string
  description: string
  userId: string
  ipAddress: string
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
  }
  changesDetails: any
}

interface HistoryModalProps {
  configId: string
  provider: string
  isOpen: boolean
  onClose: () => void
}

export function AiConfigHistoryModal({ configId, provider, isOpen, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && configId) {
      fetchHistory()
    }
  }, [isOpen, configId])

  async function fetchHistory() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/ai-providers/${configId}/history`)
      if (!response.ok) {
        throw new Error('Error al cargar historial')
      }
      const data = await response.json()
      setHistory(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const getActionBadge = (action: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      CREATE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Creado' },
      UPDATE: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Actualizado' },
      DELETE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Eliminado' },
      ACTIVATE: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Activado' },
      DEACTIVATE: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Desactivado' },
    }
    const defaultStyle = { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Actualizado' }
    const style = styles[action] ?? defaultStyle
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Historial de Cambios</h2>
            <p className="text-slate-300 text-sm mt-1">Configuración de {provider}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-slate-300 transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
                <p className="text-slate-600">Cargando historial...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-900 font-medium">Error al cargar historial</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-2">📋</div>
              <p className="text-slate-600 font-medium">Sin cambios registrados</p>
              <p className="text-slate-500 text-sm mt-1">Aún no hay historial de cambios para esta configuración</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="border-l-4 border-slate-300 pl-4 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getActionBadge(entry.action)}
                        <span className="text-sm text-slate-500">
                          {format(new Date(entry.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: es })}
                        </span>
                      </div>
                      <p className="text-slate-900 font-medium text-sm">{entry.description}</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 mt-3 bg-slate-50 rounded p-2 space-y-1">
                    <div>
                      <strong>Usuario:</strong> {entry.user?.name || entry.user?.email || 'Desconocido'} ({entry.userId})
                    </div>
                    <div>
                      <strong>IP:</strong> {entry.ipAddress}
                    </div>
                    {entry.changesDetails && Object.keys(entry.changesDetails).length > 0 && (
                      <div className="mt-2 bg-white rounded p-1">
                        <div className="font-semibold text-slate-700 mb-1">Detalles de cambios:</div>
                        {entry.changesDetails.oldValues && (
                          <div className="text-red-700 mb-1">
                            <span className="text-red-600">−</span> Valor anterior:{' '}
                            {JSON.stringify(entry.changesDetails.oldValues)}
                          </div>
                        )}
                        {entry.changesDetails.newValues && (
                          <div className="text-green-700">
                            <span className="text-green-600">+</span> Valor nuevo:{' '}
                            {JSON.stringify(entry.changesDetails.newValues)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {index < history.length - 1 && <div className="mt-4 border-t border-slate-200"></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {!isLoading && history.length > 0 && (
            <Button variant="outline" onClick={fetchHistory}>
              Actualizar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
