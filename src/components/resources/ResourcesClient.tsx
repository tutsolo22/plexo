'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function ResourcesClient() {
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/configurations', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) setConfig(json.data || {})
      else toast({ type: 'error', title: 'Error cargando configuraciones', description: json.error })
    } catch (e) {
      console.error(e)
      toast({ type: 'error', title: 'Error', description: 'No se pudieron cargar configuraciones' })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const save = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/configurations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) })
      const json = await res.json()
      if (json.success) {
        setConfig(prev => ({ ...prev, [key]: value }))
        toast({ type: 'success', title: 'Guardado', description: 'Configuración guardada' })
      } else {
        toast({ type: 'error', title: 'Error', description: json.error })
      }
    } catch (e) {
      console.error(e)
      toast({ type: 'error', title: 'Error', description: 'No se pudo guardar configuración' })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp</CardTitle>
          <CardDescription>Configura el número y credenciales de WhatsApp (por tenant)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Número (en formato internacional)</label>
              <Input value={config['whatsapp_number'] || ''} onChange={e=>setConfig(prev=>({ ...prev, whatsapp_number: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Token</label>
              <Input value={config['whatsapp_token'] || ''} onChange={e=>setConfig(prev=>({ ...prev, whatsapp_token: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">ID</label>
              <Input value={config['whatsapp_id'] || ''} onChange={e=>setConfig(prev=>({ ...prev, whatsapp_id: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={()=>save('whatsapp_number', config['whatsapp_number'] || '')}>Guardar número</Button>
            <Button onClick={()=>save('whatsapp_token', config['whatsapp_token'] || '')} variant="outline">Guardar token</Button>
            <Button onClick={()=>save('whatsapp_id', config['whatsapp_id'] || '')} variant="ghost">Guardar ID</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MercadoPago</CardTitle>
          <CardDescription>Configura token de MercadoPago por tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Access Token</label>
              <Input value={config['mercadopago_access_token'] || ''} onChange={e=>setConfig(prev=>({ ...prev, mercadopago_access_token: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Entorno Sandbox</label>
              <select className="rounded border px-2 py-1" value={config['mercadopago_sandbox'] || 'false'} onChange={e=>setConfig(prev=>({ ...prev, mercadopago_sandbox: e.target.value }))}>
                <option value="false">Producción</option>
                <option value="true">Sandbox</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={()=>save('mercadopago_access_token', config['mercadopago_access_token'] || '')}>Guardar token</Button>
            <Button onClick={()=>save('mercadopago_sandbox', config['mercadopago_sandbox'] || 'false')} variant="outline">Guardar entorno</Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
