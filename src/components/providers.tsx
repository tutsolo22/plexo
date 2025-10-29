"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { AIAgent } from '@/components/ai-agent'
import React from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [aiMinimized, setAiMinimized] = React.useState(false)

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        {children}
        {/* Asistente IA flotante disponible en todas las páginas. Se puede minimizar/maximizar */}
        <AIAgent isMinimized={aiMinimized} onToggleMinimize={() => setAiMinimized(v => !v)} />
      </SessionProvider>
    </ThemeProvider>
  )
}