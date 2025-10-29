// Cliente: utilitario ligero para comprobar jerarquía de roles en el frontend
export const ROLE_HIERARCHY: Record<string, number> = {
  CLIENT_EXTERNAL: 0,
  USER: 1,
  MANAGER: 2,
  TENANT_ADMIN: 3,
  SUPER_ADMIN: 4,
}

export const isAtLeast = (role: string | undefined | null, required: string) => {
  if (!role) return false
  const r = ROLE_HIERARCHY[role] ?? -1
  const req = ROLE_HIERARCHY[required] ?? 999
  return r >= req
}

export default isAtLeast
