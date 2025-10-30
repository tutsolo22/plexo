'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Minimize2, Maximize2, GripVertical } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp?: string
}

interface AIAgentProps {
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export function AIAgent({ isMinimized = false, onToggleMinimize }: AIAgentProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [provider, setProvider] = useState<'google' | 'openai' | null>(null)
  const [availableProvider, setAvailableProvider] = useState<'google' | 'openai' | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const lastMessageRef = useRef<HTMLDivElement | null>(null)
  const initializedRef = useRef(false)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 420, height: 520 })
  const draggingRef = useRef<{ active: boolean; startX: number; startY: number; origLeft: number; origTop: number } | null>(null)
  const resizingRef = useRef<{ active: boolean; startX: number; startY: number; origWidth: number; origHeight: number } | null>(null)

  const getFormattedTime = () => {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    setIsClient(true)

    // Detectar proveedor disponible desde localStorage o API
    const detectProvider = async () => {
      try {
        // Intentar obtener configuración guardada en localStorage
        const savedProvider = localStorage.getItem('plexo_ai_provider')
        
        // Verificar que el proveedor guardado realmente funcione
        if (savedProvider && (savedProvider === 'google' || savedProvider === 'openai')) {
          // Verificar si el proveedor guardado está disponible
          const response = await fetch('/api/ai/test/providers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: savedProvider })
          })

          if (response.ok) {
            const data = await response.json()
            const result = data.data?.results?.[0]
            
            if (result?.status === 'success') {
              // El proveedor guardado funciona, usarlo
              setAvailableProvider(savedProvider as 'google' | 'openai')
              setProvider(savedProvider as 'google' | 'openai')
              console.log(`Proveedor ${savedProvider} configurado y funcionando`)
              return
            } else {
              // El proveedor guardado no funciona, limpiar y buscar alternativa
              console.warn(`Proveedor guardado (${savedProvider}) no está disponible`)
              localStorage.removeItem('plexo_ai_provider')
            }
          }
        }

        // Si no hay preferencia guardada o no funciona, detectar automáticamente
        const response = await fetch('/api/ai/test/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'both' })
        })

        if (response.ok) {
          const data = await response.json()
          // Buscar el primer proveedor que funcione (preferencia: google > openai)
          const googleResult = data.data?.results?.find((r: any) => r.provider === 'google')
          const openaiResult = data.data?.results?.find((r: any) => r.provider === 'openai')
          
          if (googleResult?.status === 'success') {
            setAvailableProvider('google')
            setProvider('google')
            localStorage.setItem('plexo_ai_provider', 'google')
            console.log('Auto-detectado: Google Gemini')
          } else if (openaiResult?.status === 'success') {
            setAvailableProvider('openai')
            setProvider('openai')
            localStorage.setItem('plexo_ai_provider', 'openai')
            console.log('Auto-detectado: OpenAI')
          } else {
            // Si ninguno funciona, dejar null (sin proveedor)
            setProvider(null)
            setAvailableProvider(null)
            console.warn('No hay proveedores de IA disponibles')
          }
        }
      } catch (error) {
        console.error('Error detectando proveedor:', error)
        // Fallback a null si hay error
        setProvider(null)
        setAvailableProvider(null)
      }
    }

    detectProvider()

    // Cargar mensajes previos desde localStorage si existen (evita reset en remounts en Dev StrictMode)
    try {
      const saved = localStorage.getItem('plexo_ai_messages')
      if (saved) {
        setMessages(JSON.parse(saved))
      } else if (!initializedRef.current) {
        // Solo inicializar saludo la primera vez
        const userName = session?.user?.name || 'Usuario'
        const userRole = (session?.user as any)?.role || 'usuario'
        
        let greeting = `¡Hola ${userName}! Soy tu asistente de IA para Plexo. `
        
        // Personalizar el saludo según el rol
        if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
          greeting += `Como ${userRole === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador'}, puedo ayudarte con:\n\n` +
                     `• Gestión completa de eventos, clientes y cotizaciones\n` +
                     `• Análisis de datos y reportes\n` +
                     `• Configuración del sistema\n` +
                     `• Gestión de usuarios y permisos\n\n` +
                     `¿En qué puedo ayudarte hoy?`
        } else if (userRole === 'MANAGER') {
          greeting += `Como Manager, puedo ayudarte con:\n\n` +
                     `• Gestión de eventos y cotizaciones\n` +
                     `• Administración de clientes\n` +
                     `• Reportes y estadísticas\n` +
                     `• Supervisión de operaciones\n\n` +
                     `¿Qué necesitas?`
        } else {
          greeting += `Puedo ayudarte con información sobre eventos, cotizaciones, clientes y más. ¿En qué puedo asistirte hoy?`
        }
        
        const greetingMsg: Message = {
          id: '1',
          content: greeting,
          role: 'assistant',
          timestamp: getFormattedTime(),
        }
        setMessages([greetingMsg])
        initializedRef.current = true
      }
    } catch (e) {
      // si localStorage falla, seguimos con saludo por defecto
      if (!initializedRef.current) {
        setMessages([
          {
            id: '1',
            content: '¡Hola! Soy tu asistente de IA para Plexo. ¿En qué puedo ayudarte hoy? Puedo ayudarte con información sobre eventos, cotizaciones, clientes y más.',
            role: 'assistant',
            timestamp: getFormattedTime(),
          },
        ])
        initializedRef.current = true
      }
    }
  }, [session])

  // Listener para detectar cambios en el proveedor guardado (desde el panel de test)
  useEffect(() => {
    if (!isClient) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'plexo_ai_provider' && e.newValue) {
        const newProvider = e.newValue as 'google' | 'openai'
        console.log('Proveedor actualizado desde panel de test:', newProvider)
        setAvailableProvider(newProvider)
        setProvider(newProvider)
      }
    }

    // Escuchar cambios en localStorage (entre pestañas/ventanas)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isClient])

  // establecer posición inicial (bottom-right) una vez en cliente
  useEffect(() => {
    if (!isClient) return
    if (position) return
    const w = window.innerWidth
    const h = window.innerHeight
    const left = Math.max(12, w - size.width - 24)
    const top = Math.max(80, h - size.height - 24)
    setPosition({ left, top })
  }, [isClient, position, size])

  const startDrag = (e: React.MouseEvent) => {
    if (!position) return
    draggingRef.current = { active: true, startX: e.clientX, startY: e.clientY, origLeft: position.left, origTop: position.top }
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', endDrag)
  }

  const onDrag = (e: MouseEvent) => {
    const d = draggingRef.current
    if (!d || !position) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    setPosition({ left: Math.max(8, d.origLeft + dx), top: Math.max(8, d.origTop + dy) })
  }

  const endDrag = () => {
    draggingRef.current = null
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', endDrag)
  }

  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation()
    resizingRef.current = { active: true, startX: e.clientX, startY: e.clientY, origWidth: size.width, origHeight: size.height }
    window.addEventListener('mousemove', onResize)
    window.addEventListener('mouseup', endResize)
  }

  const onResize = (e: MouseEvent) => {
    const r = resizingRef.current
    if (!r) return
    const dx = e.clientX - r.startX
    const dy = e.clientY - r.startY
    const newWidth = Math.max(320, Math.min(800, r.origWidth + dx))
    const newHeight = Math.max(400, Math.min(900, r.origHeight + dy))
    setSize({ width: newWidth, height: newHeight })
  }

  const endResize = () => {
    resizingRef.current = null
    window.removeEventListener('mousemove', onResize)
    window.removeEventListener('mouseup', endResize)
  }

  useEffect(() => {
    // Intentar desplazar el último mensaje a la vista
    try {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      } else if (scrollAreaRef.current) {
        // fallback: desplazar el contenedor
        (scrollAreaRef.current as any).scrollTop = (scrollAreaRef.current as any).scrollHeight
      }
    } catch (e) {
      // ignore
    }
    try {
      // Persistir conversación para evitar pérdida en remounts de React StrictMode
      if (isClient) {
        localStorage.setItem('plexo_ai_messages', JSON.stringify(messages))
      }
    } catch (e) {
      // ignore
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: getFormattedTime(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      // Enviar historial completo (últimos 10 mensajes + el nuevo) para mantener contexto
      const historyToSend = newMessages.slice(-10)
      
      let assistantText = ''
      
      // Usar el proveedor detectado automáticamente
      const activeProvider = availableProvider || provider
      
      if (activeProvider === 'google') {
        // Llamar endpoint de Google con historial
        try {
          const res = await fetch('/api/ai/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: input,
              history: historyToSend 
            })
          })
          if (!res.ok) throw new Error('Google API error')
          const data = await res.json()
          assistantText = data?.data?.message || data?.text || 'Lo siento, no recibí respuesta del proveedor.'
        } catch (e) {
          console.error('Google provider error', e)
          assistantText = 'Lo siento, hubo un error contactando al proveedor Google.'
        }
      } else if (activeProvider === 'openai') {
        // Llamar endpoint de OpenAI (real) con historial
        try {
          const res = await fetch('/api/ai/real', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: input,
              history: historyToSend 
            })
          })
          if (!res.ok) throw new Error('OpenAI API error')
          const data = await res.json()
          assistantText = data?.data?.message || 'Lo siento, no recibí respuesta del proveedor.'
        } catch (e) {
          console.error('OpenAI provider error', e)
          assistantText = 'Lo siento, hubo un error contactando al proveedor OpenAI.'
        }
      } else {
        // Sin proveedor configurado
        assistantText = 'No hay proveedor de IA configurado. Por favor, configura Google AI o OpenAI en la página de administración (/dashboard/admin/ai-test).'
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantText,
        role: 'assistant',
        timestamp: getFormattedTime(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',
        role: 'assistant',
        timestamp: getFormattedTime(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Volver a enfocar el input para continuar la conversación
      setTimeout(() => {
        try {
          inputRef.current?.focus()
        } catch (e) {
          // ignore
        }
      }, 50)
    }
  }

  const clearConversation = () => {
    try {
      localStorage.removeItem('plexo_ai_messages')
    } catch (e) {}
    initializedRef.current = false
    const greeting: Message = {
      id: Date.now().toString(),
      content: '¡Hola! Soy tu asistente de IA para Plexo. ¿En qué puedo ayudarte hoy? Puedo ayudarte con información sobre eventos, cotizaciones, clientes y más.',
      role: 'assistant',
      timestamp: getFormattedTime(),
    }
    setMessages([greeting])
  }

  if (!isClient) {
    return null
  }

  if (isMinimized) {
    // minimized as a small draggable button to avoid covering UI
    return (
      <div style={position ? { position: 'fixed', left: position.left, top: position.top, zIndex: 60 } : { position: 'fixed', right: 16, bottom: 16, zIndex: 60 }}>
        <div onMouseDown={startDrag} className="flex items-center gap-2 cursor-grab select-none bg-primary text-primary-foreground rounded-full shadow p-2">
          <Bot size={16} />
          <button onClick={(e)=>{ e.stopPropagation(); onToggleMinimize?.() }} aria-label="Maximize" className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center ml-2">
            <Maximize2 size={14} />
          </button>
          <button onClick={(e)=>{ e.stopPropagation(); clearConversation() }} aria-label="Clear" className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center ml-2">
            C
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={position ? { position: 'fixed', left: position.left, top: position.top, zIndex: 60, width: size.width, height: size.height } : { position: 'fixed', right: 16, bottom: 16, zIndex: 60, width: size.width, height: size.height }}>
      <Card className="w-full h-full shadow-lg border-primary/20 flex flex-col relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary text-primary-foreground shrink-0">
        <div onMouseDown={startDrag} className="flex-1 cursor-grab">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot size={16} />
            Asistente IA de Plexo
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {/* Indicador de proveedor activo */}
          {availableProvider && (
            <span className="h-6 px-2 text-xs rounded bg-primary-foreground/10 text-primary-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              {availableProvider === 'google' ? 'Gemini' : 'GPT'}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={clearConversation} className="h-6 w-6 p-0 text-primary-foreground hover:bg-black/20">C</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-black/20"
          >
            <Minimize2 size={14} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
        <div ref={scrollAreaRef} className="space-y-4 flex-1 overflow-y-auto">
            {messages.map((message, idx) => (
              <div
                key={message.id}
                ref={idx === messages.length - 1 ? lastMessageRef : null}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`rounded-full p-1 ${message.role === 'user' ? 'bg-primary/10' : 'bg-accent/10'}`}
                  >
                    {message.role === 'user' ? (
                      <User size={12} className="text-primary" />
                    ) : (
                      <Bot size={12} className="text-accent" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {isClient && message.timestamp && (
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="rounded-full p-1 bg-accent/10">
                    <Bot size={12} className="text-accent" />
                  </div>
                  <div className="bg-secondary rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </CardContent>
      
      <CardFooter className="p-3 border-t">
        <div className="flex gap-2 w-full">
          <Input
            ref={(el) => { inputRef.current = el }}
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !(e as any).shiftKey) { e.preventDefault(); handleSendMessage() } }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Send size={14} />
          </Button>
        </div>
      </CardFooter>
      
      {/* Resize handle */}
      <div 
        onMouseDown={startResize}
        className="absolute bottom-0 right-0 p-1 cursor-nwse-resize opacity-50 hover:opacity-100 transition-opacity"
        title="Redimensionar"
      >
        <GripVertical size={16} className="text-muted-foreground" />
      </div>
    </Card>
    </div>
  )
}
