"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function NewUserPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('USER')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, role, password }) })
      if (res.ok) {
        router.push('/dashboard/users')
      } else {
        const json = await res.json().catch(()=>null)
        alert('Error creando usuario' + (json?.error ? ': ' + json.error : ''))
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold">Crear Usuario</h1>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label>Nombre</Label>
          <Input value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Contraseña</Label>
          <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <Label>Rol</Label>
          <select value={role} onChange={e=>setRole(e.target.value)} className="w-full rounded-md border px-2 py-1">
            <option value="USER">USER</option>
            <option value="MANAGER">MANAGER</option>
            <option value="TENANT_ADMIN">TENANT_ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </div>
        <div>
          <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear usuario'}</Button>
        </div>
      </form>
    </div>
  )
}
