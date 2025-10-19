"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    // Verificar el tema actual al cargar
    const theme = localStorage.getItem('theme') || 'light'
    const isDarkMode = theme === 'dark'
    setIsDark(isDarkMode)
    
    // Aplicar el tema al HTML
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    
    // Guardar en localStorage
    localStorage.setItem('theme', newTheme)
    
    // Aplicar al HTML
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-plexo-dark-text" />
      ) : (
        <Moon className="h-4 w-4 text-plexo-primary" />
      )}
      <span className="sr-only">
        {isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      </span>
    </Button>
  )
}