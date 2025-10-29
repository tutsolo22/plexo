'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import UserActions from './UserActions'
import { useToast } from '@/hooks/use-toast'

type UserRow = {
  id: string
  name?: string | null
  email: string
  role: string
  isActive: boolean
  emailVerified?: string | null
  tenant?: { id: string; name?: string }
}

export default function UsersClient() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState('')
  const [data, setData] = useState<UserRow[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (role) params.set('role', role)
      if (isActive) params.set('isActive', isActive)

      const res = await fetch(`/api/users?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setData(json.data || [])
        setTotalPages(json.pagination?.pages || 1)
      } else {
        toast({ type: 'error', title: 'Error cargando usuarios', description: json.error })
      }
    } catch (err) {
      console.error(err)
      toast({ type: 'error', title: 'Error', description: 'No se pudieron cargar usuarios' })
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, role, isActive, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleActionComplete = async (message?: string) => {
    if (message) toast({ type: 'success', title: message })
    await fetchData()
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Input placeholder="Buscar por nombre o email" value={search} onChange={e=>setSearch(e.target.value)} />
        <select value={role} onChange={e=>setRole(e.target.value)} className="rounded border px-2 py-1">
          <option value="">Todos los roles</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          <option value="TENANT_ADMIN">TENANT_ADMIN</option>
          <option value="MANAGER">MANAGER</option>
          <option value="USER">USER</option>
          <option value="CLIENT_EXTERNAL">CLIENT_EXTERNAL</option>
        </select>
        <select value={isActive} onChange={e=>setIsActive(e.target.value)} className="rounded border px-2 py-1">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <Button onClick={()=>{ setPage(1); fetchData(); }}>Buscar</Button>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-max table-auto border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-700">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3">Email verificado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center">Cargando...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center">No se encontraron usuarios</td></tr>
            ) : (
              data.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">{u.name ?? '-'}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">{u.isActive ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3">{u.emailVerified ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3"><UserActions id={u.id} emailVerified={!!u.emailVerified} isActive={!!u.isActive} onComplete={handleActionComplete} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button onClick={()=>{ setPage(p=>Math.max(1,p-1)) }} disabled={page===1}>Anterior</Button>

          {/* numeric pagination */}
          <nav aria-label="Paginación" className="flex items-center gap-1">
            {(() => {
              const pages: (number | '...')[] = []
              const total = totalPages
              const current = page

              if (total <= 9) {
                for (let i = 1; i <= total; i++) pages.push(i)
              } else {
                // always show first
                pages.push(1)
                if (current > 4) pages.push('...')

                const start = Math.max(2, current - 2)
                const end = Math.min(total - 1, current + 2)
                for (let i = start; i <= end; i++) pages.push(i)

                if (current < total - 3) pages.push('...')
                pages.push(total)
              }

              return pages.map((p, idx) => (
                p === '...'
                  ? <span key={`dots-${idx}`} className="px-2">…</span>
                  : <Button key={p} variant={p === page ? 'ghost' : 'outline'} size="sm" onClick={() => setPage(Number(p))}>{p}</Button>
              ))
            })()}
          </nav>

          <Button onClick={()=>{ setPage(p=>Math.min(totalPages,p+1)) }} disabled={page===totalPages}>Siguiente</Button>
          <span className="mx-2">Página {page} / {totalPages}</span>
        </div>
        <div>
          <select value={limit} onChange={e=>{ setLimit(parseInt(e.target.value)); setPage(1); }} className="rounded border px-2 py-1">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  )
}
