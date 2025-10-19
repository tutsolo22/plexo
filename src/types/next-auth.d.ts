import { DefaultSession } from "next-auth"
import { LegacyUserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: LegacyUserRole
      tenantId: string
      tenantName: string
      emailVerified: Date | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: LegacyUserRole
    tenantId: string
    tenantName: string
    emailVerified: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string
    role?: LegacyUserRole
    tenantId?: string
    tenantName?: string
    emailVerified?: Date | null
  }
}